# Solverse - Decentralized Task Management Platform

Solverse is a decentralized task management platform built on the Solana blockchain that enables creators to post tasks with rewards, and participants to complete them with guaranteed payment through an escrow mechanism.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Workflow](#workflow)
- [Smart Contract Functions](#smart-contract-functions)
- [Installation](#installation)
- [Usage](#usage)
- [Technical Specifications](#technical-specifications)

## Deployment

The Solverse program is deployed on Solana devnet with the following program ID:
[4kruCJtCQbxT1AQxZprCe7MfBVwFBJKYsdySz8ECPe6p](https://explorer.solana.com/address/4kruCJtCQbxT1AQxZprCe7MfBVwFBJKYsdySz8ECPe6p?cluster=devnet)


## Overview

Solverse provides a trustless, decentralized solution for task management and bounty completion. The platform ensures that creators lock their rewards in escrow when creating tasks, guaranteeing payment to successful participants. The system uses Solana's high-speed, low-cost blockchain to provide a seamless experience for both task creators and participants.

## Architecture

The Solverse platform consists of a Solana program written in Rust using the Anchor framework. The core components include:

- **Task Account**: Stores task details including ID, description, creator, reward amount, start/end times, and winner
- **Submission Account**: Stores participant submissions with links to completed work
- **Escrow Account**: Holds the reward tokens securely until a winner is selected or refund conditions are met
- **Token Integration**: Uses SPL tokens for reward payments

## Key Features

- **Secure Escrow**: Reward tokens are locked in a secure escrow account upon task creation
- **Deadline Management**: Tasks have configurable deadlines with automatic processing
- **Multiple Submissions**: Participants can submit work via links, documents, or other digital formats
- **Creator Control**: Task creators have full control over winner selection
- **Automatic Refunds**: Unclaimed rewards are automatically refunded to creators after deadlines
- **Permissionless Participation**: Anyone can participate in completing tasks

## Workflow

The Solverse platform follows a clear workflow from task creation to reward distribution:

### 1. Task Creation
- A creator initiates a task with a title, description, reward amount, and deadline
- The reward amount is transferred to an escrow account using the task ID, creator's public key, and other parameters as seeds
- The task is registered on-chain and becomes visible to participants globally

### 2. Task Discovery
- Tasks are displayed on a public page where participants can browse available opportunities
- Each task shows the reward amount, deadline, description, and submission requirements

### 3. Work Submission
- Participants complete the required work independently
- Submissions are made through the platform as links (URLs, Notion documents, GitHub repos, etc.)
- Each submission is recorded on-chain with the participant's public key

### 4. Winner Selection
- After the deadline expires, the task creator reviews all submissions
- The creator selects the best submission and declares a winner
- The winner's public key is recorded in both the task and escrow accounts

### 5. Reward Distribution
- The winner can claim their reward by calling the claim function
- The escrow program releases the reward to the winner's address
- The task and escrow accounts are closed after successful reward distribution

### 6. Refund Scenarios
- If no submissions are received within the deadline, the escrow is refunded to the creator
- If none of the submissions meet the creator's requirements, the creator can close the task and receive a refund

## Smart Contract Functions

### `create_task`
- Creates a new task with specified parameters
- Initializes both Task and Escrow accounts
- Transfers reward tokens to the escrow vault
- Parameters: task_id, description, reward_amount, duration

### `submit_work`
- Allows participants to submit their completed work
- Records submission with a link to the work
- Parameters: task_id, link

### `pick_winner`
- Allows the task creator to select a winner after the deadline
- Updates both task and escrow accounts with the winner's address
- Parameters: task_id

### `claim_reward`
- Allows the winner to claim their reward tokens
- Transfers tokens from escrow to winner's account
- Closes the escrow account
- Parameters: task_id

### `refund_escrow`
- Refunds tokens to the creator if no winner is selected
- Used when no suitable submissions are received
- Parameters: task_id

### `close_task`
- Closes the task account after deadline
- Can be used to close tasks without a winner
- Parameters: task_id

## Installation

### Prerequisites
- Rust (latest stable version)
- Solana CLI tools
- Anchor framework
- Node.js and Yarn

### Setup Steps

1. Install Rust:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Install Solana CLI:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

3. Install Anchor:
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

4. Install Node.js dependencies:
```bash
yarn install
```

5. Build the program:
```bash
anchor build
```

## Usage

### Development
```bash
# Start local Solana cluster
solana-test-validator

# Deploy the program
anchor deploy

# Run tests
anchor test
```

### Deployment
The program can be deployed to devnet, testnet, or mainnet-beta using Anchor commands.

## Technical Specifications

### Data Structures
- **Task**: Contains task_id, description, creator pubkey, reward amount, timestamps, winner, and submission count
- **Submission**: Contains participant pubkey, task reference, and submission link
- **Escrow**: Contains seed, creator pubkey, reward token account, timestamps, and winner

### Security Features
- PDA (Program Derived Address) based accounts for secure access control
- Time-locked operations to prevent premature actions
- Token account validation to prevent unauthorized access
- Rent-exempt account closures to recover SOL

### Error Handling
- `TaskEnded`: Task deadline has passed during submission
- `TaskNotEnded`: Action attempted before deadline expiration
- `NoSubmissions`: No valid submissions found
- `AlreadySubmitted`: Participant already submitted to this task
- `NotCreator`: Unauthorized access to creator functions
- `InvalidWinner`: Invalid winner selection
- `EscrowMismatch`: Escrow validation failure