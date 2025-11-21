# Solverse Frontend - SPL Token Integration Guide

## Overview

Solverse uses SPL tokens for task rewards, not native SOL. This means you need to have SPL tokens in your wallet to create tasks.

## Quick Start

### 1. Install & Run

```bash
cd frontend
bun install
bun run dev
```

Visit: `http://localhost:3000`

### 2. Connect Wallet

Click "Connect Wallet" in the navbar and select Phantom or Solflare.

## Creating a Task with SPL Tokens

### Requirements

1. **SPL Token**: You need an SPL token (e.g., USDC, USDT, or custom token)
2. **Token Balance**: Your wallet must have enough of that token for the reward
3. **Associated Token Account**: Your wallet needs an ATA for that token mint

### Common Token Mints on Devnet

For testing, you can use these devnet tokens:

```
USDC Devnet: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

Or create your own test token using `spl-token` CLI.

### Step-by-Step

1. Click **"+ Create Task"** button
2. Fill in the form:
   - **Task ID**: Unique identifier (max 32 chars)
   - **Description**: What needs to be done (max 280 chars)
   - **Reward**: Amount of tokens (assumes 6 decimals)
   - **Duration**: How many days until deadline
   - **Reward Token Mint**: The SPL token mint address

3. Click **"Create Task"**

### Example Values

```
Task ID: my-first-task-001
Description: Build a landing page with Next.js and Tailwind
Reward: 100
Duration: 7
Reward Token Mint: <your-token-mint-address>
```

This will create a task with 100 tokens (100000000 with 6 decimals) as the reward, due in 7 days.

## Architecture

### Account Structure

When you create a task, the following accounts are created/used:

1. **Task PDA**: `[b"task", creator.key(), task_id]`
2. **Escrow PDA**: `[b"escrow", task.key()]`
3. **Escrow Vault**: Associated Token Account owned by the escrow PDA
4. **Creator Token Account**: Your ATA for the reward token

### Token Flow

1. **Create Task**: Tokens transfer from your wallet → Escrow Vault
2. **Pick Winner**: Task creator picks a winner
3. **Claim Reward**: Winner claims tokens from Escrow Vault → Winner's wallet
4. **Refund**: If no winner, creator can refund after deadline

## Troubleshooting

### "Account not found" Error

You need to create an Associated Token Account for the reward mint:

```bash
spl-token create-account <MINT_ADDRESS>
```

### "Insufficient funds" Error

Make sure you have enough tokens:

```bash
spl-token balance <MINT_ADDRESS>
```

### "Reached maximum depth for account resolution"

This error occurs when required accounts can't be auto-derived. The frontend now provides all accounts explicitly:
- `creator`: Your wallet
- `creatorTokenAccount`: Your ATA for the reward token
- `rewardMint`: The SPL token mint address

## Testing with Custom Token

### 1. Create a Test Token

```bash
# Create a new token
spl-token create-token

# Output: Creating token ABC123...
# Save this token address
```

### 2. Create Token Account

```bash
spl-token create-account <TOKEN_ADDRESS>
```

### 3. Mint Tokens

```bash
spl-token mint <TOKEN_ADDRESS> 1000
```

### 4. Use in Solverse

Use the token address from step 1 as the "Reward Token Mint" when creating a task.

## Next Steps

After creating a task:

1. **Accept Task**: Another wallet can accept the task
2. **Submit Work**: Participant submits a link to their work
3. **Pick Winner**: Creator picks the winner
4. **Claim Reward**: Winner claims the tokens

---

For more information, check the [walkthrough.md](../../../.gemini/antigravity/brain/854164a9-82c2-44c8-a293-d44a51778711/walkthrough.md) artifact.
