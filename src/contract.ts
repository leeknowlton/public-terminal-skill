/**
 * Public Terminal contract details
 */

/** Contract address on Base Sepolia */
export const CONTRACT_ADDRESS = "0x1C89997a8643A8E380305F0078BB8210e3952e1C" as const;

/** Base Sepolia chain ID */
export const CHAIN_ID = 84532;

/** Mint price in wei (0.0005 ETH) */
export const PRICE_WEI = 500000000000000n;

/** Pin mint price in wei (0.005 ETH) */
export const PIN_PRICE_WEI = 5000000000000000n;

/** Maximum message length */
export const MAX_MESSAGE_LENGTH = 120;

/** Maximum username length */
export const MAX_USERNAME_LENGTH = 64;

/** Default number of messages to fetch */
export const DEFAULT_FEED_COUNT = 15;

/** Contract ABI - only the functions we need */
export const PUBLIC_TERMINAL_ABI = [
  // Mint function
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "fid", type: "uint256" },
      { name: "username", type: "string" },
      { name: "text", type: "string" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  // Mint sticky function
  {
    type: "function",
    name: "mintSticky",
    inputs: [
      { name: "fid", type: "uint256" },
      { name: "username", type: "string" },
      { name: "text", type: "string" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  // Get recent messages
  {
    type: "function",
    name: "getRecentMessages",
    inputs: [{ name: "count", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "author", type: "address" },
          { name: "fid", type: "uint256" },
          { name: "username", type: "string" },
          { name: "text", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "usernameColor", type: "bytes3" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // Get message count
  {
    type: "function",
    name: "getMessageCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // MessageMinted event
  {
    type: "event",
    name: "MessageMinted",
    inputs: [
      { name: "author", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "fid", type: "uint256", indexed: true },
      { name: "username", type: "string", indexed: false },
      { name: "text", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "usernameColor", type: "bytes3", indexed: false },
    ],
  },
  // StickySet event
  {
    type: "event",
    name: "StickySet",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "author", type: "address", indexed: true },
    ],
  },
] as const;
