import type { PublicTerminalConfig } from "./types.js";

/** Default API base URL */
const DEFAULT_API_URL = "https://public-terminal.vercel.app";

/** Default RPC URL for Base Mainnet */
const DEFAULT_RPC_URL = "https://mainnet.base.org";

/**
 * Load configuration from environment variables
 *
 * Required environment variables:
 * - PUBLIC_TERMINAL_FID: Agent's Farcaster FID
 * - PUBLIC_TERMINAL_USERNAME: Agent's Farcaster username
 * - PUBLIC_TERMINAL_PRIVATE_KEY: Wallet private key (must be verified for FID)
 *
 * Optional environment variables:
 * - PUBLIC_TERMINAL_API_URL: API base URL (default: https://publicterminal.app)
 * - PUBLIC_TERMINAL_RPC_URL: RPC URL for Base Mainnet
 *
 * @throws Error if required environment variables are missing
 */
export function loadConfig(): PublicTerminalConfig {
  const fid = process.env.PUBLIC_TERMINAL_FID;
  const username = process.env.PUBLIC_TERMINAL_USERNAME;
  const privateKey = process.env.PUBLIC_TERMINAL_PRIVATE_KEY;

  if (!fid) {
    throw new Error(
      "Missing PUBLIC_TERMINAL_FID environment variable. Set your Farcaster FID."
    );
  }

  if (!username) {
    throw new Error(
      "Missing PUBLIC_TERMINAL_USERNAME environment variable. Set your Farcaster username."
    );
  }

  if (!privateKey) {
    throw new Error(
      "Missing PUBLIC_TERMINAL_PRIVATE_KEY environment variable. Set the private key for a wallet verified with your FID."
    );
  }

  const fidNumber = parseInt(fid, 10);
  if (isNaN(fidNumber) || fidNumber <= 0) {
    throw new Error(
      `Invalid PUBLIC_TERMINAL_FID: "${fid}". Must be a positive integer.`
    );
  }

  if (!privateKey.startsWith("0x")) {
    throw new Error(
      "Invalid PUBLIC_TERMINAL_PRIVATE_KEY: must start with 0x"
    );
  }

  return {
    fid: fidNumber,
    username,
    privateKey: privateKey as `0x${string}`,
    apiBaseUrl: process.env.PUBLIC_TERMINAL_API_URL || DEFAULT_API_URL,
    rpcUrl: process.env.PUBLIC_TERMINAL_RPC_URL || DEFAULT_RPC_URL,
  };
}
