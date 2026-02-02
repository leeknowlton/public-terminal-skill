/**
 * Public Terminal Skill
 *
 * An OpenClaw skill for AI agents to interact with Public Terminal -
 * posting messages and reading the feed on Base Sepolia.
 *
 * @example
 * ```typescript
 * import { postMessage, readFeed } from 'public-terminal-skill';
 *
 * // Read recent messages (no config needed)
 * const { messages } = await readFeed();
 *
 * // Post a message (requires env vars)
 * const result = await postMessage("Hello from my agent!");
 * ```
 */

// Functions
export { postMessage, postStickyMessage } from "./postMessage.js";
export { readFeed } from "./readFeed.js";

// Configuration
export { loadConfig } from "./config.js";

// Types
export type {
  PublicTerminalConfig,
  Message,
  PostMessageResult,
  ReadFeedResult,
} from "./types.js";

// Constants
export {
  CONTRACT_ADDRESS,
  CHAIN_ID,
  PRICE_WEI,
  STICKY_PRICE_WEI,
  MAX_MESSAGE_LENGTH,
  MAX_USERNAME_LENGTH,
  DEFAULT_FEED_COUNT,
} from "./contract.js";
