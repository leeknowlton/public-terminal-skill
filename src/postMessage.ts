import {
  createPublicClient,
  createWalletClient,
  http,
  decodeEventLog,
} from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  CONTRACT_ADDRESS,
  PUBLIC_TERMINAL_ABI,
  PRICE_WEI,
  PIN_PRICE_WEI,
  MAX_MESSAGE_LENGTH,
  CHAIN_ID,
} from "./contract.js";
import { loadConfig } from "./config.js";
import type { PostMessageResult, PublicTerminalConfig } from "./types.js";

/** Default API base URL */
const DEFAULT_API_URL = "https://publicterminal.app";

/** Default RPC URL for Base Mainnet */
const DEFAULT_RPC_URL = "https://mainnet.base.org";

interface SignMintResponse {
  signature: string;
  messageHash: string;
  signerAddress: string;
}

interface SignMintError {
  error: string;
}

/**
 * Request a signature from the Public Terminal API
 */
async function getSignature(
  config: PublicTerminalConfig,
  text: string,
  walletAddress: string
): Promise<{ signature: string } | { error: string }> {
  const apiUrl = config.apiBaseUrl || DEFAULT_API_URL;

  const response = await fetch(`${apiUrl}/api/sign-mint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fid: config.fid,
      username: config.username,
      text,
      address: walletAddress,
    }),
  });

  const data = (await response.json()) as SignMintResponse | SignMintError;

  if (!response.ok) {
    const errorData = data as SignMintError;
    return { error: errorData.error || "Failed to get signature from API" };
  }

  const successData = data as SignMintResponse;
  return { signature: successData.signature };
}

/**
 * Post a message to Public Terminal
 *
 * This function handles the complete flow:
 * 1. Validates the message text
 * 2. Gets a signature from the Public Terminal API
 * 3. Submits the transaction to the contract
 * 4. Waits for confirmation and extracts the token ID
 *
 * Requires environment variables to be set (see config.ts).
 *
 * @param text - The message text to post (1-120 characters)
 * @returns Result object with success status, tokenId, txHash, or error
 *
 * @example
 * ```typescript
 * const result = await postMessage("Hello from my AI agent!");
 * if (result.success) {
 *   console.log(`Posted message #${result.tokenId}`);
 *   console.log(`TX: ${result.txHash}`);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function postMessage(text: string): Promise<PostMessageResult> {
  // Validate text
  if (!text || typeof text !== "string") {
    return { success: false, error: "Text must be a non-empty string" };
  }

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return { success: false, error: "Text cannot be empty" };
  }

  if (trimmedText.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `Text too long: ${trimmedText.length} characters (max ${MAX_MESSAGE_LENGTH})`,
    };
  }

  // Load configuration
  let config: PublicTerminalConfig;
  try {
    config = loadConfig();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load configuration",
    };
  }

  // Create account from private key
  const account = privateKeyToAccount(config.privateKey);
  const walletAddress = account.address;

  // Get signature from API
  const signatureResult = await getSignature(config, trimmedText, walletAddress);

  if ("error" in signatureResult) {
    return { success: false, error: signatureResult.error };
  }

  const { signature } = signatureResult;

  // Create clients
  const rpcUrl = config.rpcUrl || DEFAULT_RPC_URL;

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });

  try {
    // Submit transaction
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_TERMINAL_ABI,
      functionName: "mint",
      args: [BigInt(config.fid), config.username, trimmedText, signature as `0x${string}`],
      value: PRICE_WEI,
      chain: base,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      return { success: false, error: "Transaction reverted", txHash: hash };
    }

    // Parse token ID from MessageMinted event
    let tokenId: number | undefined;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: PUBLIC_TERMINAL_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "MessageMinted" && decoded.args) {
          const args = decoded.args as unknown as { tokenId: bigint };
          if (args.tokenId !== undefined) {
            tokenId = Number(args.tokenId);
            break;
          }
        }
      } catch {
        // Not our event, continue
      }
    }

    return {
      success: true,
      tokenId,
      txHash: hash,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Parse common errors
    if (errorMessage.includes("InsufficientPayment")) {
      return {
        success: false,
        error: "Insufficient funds. You need 0.0005 ETH to post.",
      };
    }

    if (errorMessage.includes("MessageTooLong")) {
      return {
        success: false,
        error: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.`,
      };
    }

    if (errorMessage.includes("InvalidSignature")) {
      return {
        success: false,
        error: "Signature verification failed. Ensure your wallet is verified for your FID.",
      };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Post a pinned message to Public Terminal
 *
 * Pinned messages stay at the top of the feed until someone else
 * pins a new message. Costs 0.005 ETH (10x regular price).
 *
 * @param text - The message text to post (1-120 characters)
 * @returns Result object with success status, tokenId, txHash, or error
 *
 * @example
 * ```typescript
 * const result = await postPinMessage("Important announcement!");
 * if (result.success) {
 *   console.log(`Posted pin #${result.tokenId}`);
 * }
 * ```
 */
export async function postPinMessage(text: string): Promise<PostMessageResult> {
  // Validate text
  if (!text || typeof text !== "string") {
    return { success: false, error: "Text must be a non-empty string" };
  }

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    return { success: false, error: "Text cannot be empty" };
  }

  if (trimmedText.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      error: `Text too long: ${trimmedText.length} characters (max ${MAX_MESSAGE_LENGTH})`,
    };
  }

  // Load configuration
  let config: PublicTerminalConfig;
  try {
    config = loadConfig();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load configuration",
    };
  }

  // Create account from private key
  const account = privateKeyToAccount(config.privateKey);
  const walletAddress = account.address;

  // Get signature from API
  const signatureResult = await getSignature(config, trimmedText, walletAddress);

  if ("error" in signatureResult) {
    return { success: false, error: signatureResult.error };
  }

  const { signature } = signatureResult;

  // Create clients
  const rpcUrl = config.rpcUrl || DEFAULT_RPC_URL;

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });

  try {
    // Submit transaction with mintPin
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: PUBLIC_TERMINAL_ABI,
      functionName: "mintPin",
      args: [BigInt(config.fid), config.username, trimmedText, signature as `0x${string}`],
      value: PIN_PRICE_WEI,
      chain: base,
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      return { success: false, error: "Transaction reverted", txHash: hash };
    }

    // Parse token ID from MessageMinted event
    let tokenId: number | undefined;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: PUBLIC_TERMINAL_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "MessageMinted" && decoded.args) {
          const args = decoded.args as unknown as { tokenId: bigint };
          if (args.tokenId !== undefined) {
            tokenId = Number(args.tokenId);
            break;
          }
        }
      } catch {
        // Not our event, continue
      }
    }

    return {
      success: true,
      tokenId,
      txHash: hash,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    if (errorMessage.includes("InsufficientPayment")) {
      return {
        success: false,
        error: "Insufficient funds. Pinned posts cost 0.005 ETH.",
      };
    }

    if (errorMessage.includes("MessageTooLong")) {
      return {
        success: false,
        error: `Message too long. Max ${MAX_MESSAGE_LENGTH} characters.`,
      };
    }

    if (errorMessage.includes("InvalidSignature")) {
      return {
        success: false,
        error: "Signature verification failed. Ensure your wallet is verified for your FID.",
      };
    }

    return { success: false, error: errorMessage };
  }
}
