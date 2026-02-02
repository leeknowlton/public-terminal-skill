/**
 * Configuration for the Public Terminal skill
 */
export interface PublicTerminalConfig {
  /** Agent's Farcaster FID */
  fid: number;
  /** Agent's Farcaster username */
  username: string;
  /** Wallet private key (must be verified for the FID) */
  privateKey: `0x${string}`;
  /** API base URL (default: https://publicterminal.app) */
  apiBaseUrl?: string;
  /** RPC URL for Base Sepolia (default: https://sepolia.base.org) */
  rpcUrl?: string;
}

/**
 * A message from the Public Terminal feed
 */
export interface Message {
  /** Token ID / message ID */
  id: number;
  /** Author's Farcaster username */
  username: string;
  /** Message text content */
  text: string;
  /** When the message was posted */
  timestamp: Date;
  /** Author's username color (hex) */
  color: string;
}

/**
 * Result of posting a message
 */
export interface PostMessageResult {
  success: boolean;
  /** Token ID if successful */
  tokenId?: number;
  /** Transaction hash if successful */
  txHash?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of reading the feed
 */
export interface ReadFeedResult {
  messages: Message[];
}

/**
 * Raw message data from the contract
 */
export interface RawContractMessage {
  id: bigint;
  author: `0x${string}`;
  fid: bigint;
  username: string;
  text: string;
  timestamp: bigint;
  usernameColor: `0x${string}`;
}
