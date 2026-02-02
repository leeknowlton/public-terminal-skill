import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import {
  CONTRACT_ADDRESS,
  PUBLIC_TERMINAL_ABI,
  DEFAULT_FEED_COUNT,
} from "./contract.js";
import type { Message, RawContractMessage, ReadFeedResult } from "./types.js";

/** Default RPC URL for Base Mainnet */
const DEFAULT_RPC_URL = "https://mainnet.base.org";

/**
 * Convert bytes3 color to hex string
 */
function bytes3ToHex(color: `0x${string}`): string {
  const hex = color.replace("0x", "").padStart(6, "0");
  return `#${hex}`;
}

/**
 * Transform raw contract message to friendly format
 */
function transformMessage(raw: RawContractMessage): Message {
  return {
    id: Number(raw.id),
    username: raw.username,
    text: raw.text,
    timestamp: new Date(Number(raw.timestamp) * 1000),
    color: bytes3ToHex(raw.usernameColor),
  };
}

/**
 * Read recent messages from the Public Terminal feed
 *
 * @param count - Number of messages to fetch (default: 15)
 * @param rpcUrl - Optional RPC URL (default: https://mainnet.base.org)
 * @returns Array of messages
 *
 * @example
 * ```typescript
 * const { messages } = await readFeed();
 * console.log(messages[0].text);
 * ```
 */
export async function readFeed(
  count?: number,
  rpcUrl?: string
): Promise<ReadFeedResult> {
  const client = createPublicClient({
    chain: base,
    transport: http(rpcUrl || DEFAULT_RPC_URL),
  });

  const messageCount = count ?? DEFAULT_FEED_COUNT;

  const rawMessages = (await client.readContract({
    address: CONTRACT_ADDRESS,
    abi: PUBLIC_TERMINAL_ABI,
    functionName: "getRecentMessages",
    args: [BigInt(messageCount)],
  })) as RawContractMessage[];

  const messages = rawMessages.map(transformMessage);

  return { messages };
}
