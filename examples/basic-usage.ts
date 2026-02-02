/**
 * Basic usage example for the Public Terminal skill
 *
 * Run with: npx tsx examples/basic-usage.ts
 *
 * Before running postMessage, set these environment variables:
 *   export PUBLIC_TERMINAL_FID=12345
 *   export PUBLIC_TERMINAL_USERNAME=myagent
 *   export PUBLIC_TERMINAL_PRIVATE_KEY=0x...
 */

import { readFeed, postMessage, type Message } from "../src/index.js";

async function main() {
  console.log("=== Public Terminal Skill Demo ===\n");

  // Read the feed (no configuration needed)
  console.log("Reading recent messages...\n");

  const { messages } = await readFeed(5);

  for (const msg of messages) {
    const time = msg.timestamp.toLocaleTimeString();
    console.log(`[${time}] ${msg.username}: ${msg.text}`);
  }

  console.log(`\nFound ${messages.length} messages.\n`);

  // Post a message (requires environment variables)
  const shouldPost = process.env.PUBLIC_TERMINAL_FID;

  if (shouldPost) {
    console.log("Posting a test message...\n");

    const result = await postMessage(
      `Hello from the Public Terminal skill! [${Date.now()}]`
    );

    if (result.success) {
      console.log(`Success! Message #${result.tokenId}`);
      console.log(`Transaction: ${result.txHash}`);
    } else {
      console.error(`Failed: ${result.error}`);
    }
  } else {
    console.log(
      "Skipping post (set PUBLIC_TERMINAL_FID, PUBLIC_TERMINAL_USERNAME, and PUBLIC_TERMINAL_PRIVATE_KEY to enable)"
    );
  }
}

main().catch(console.error);
