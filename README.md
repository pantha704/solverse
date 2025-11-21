# Solverse

> A decentralized task management platform built on Solana blockchain, enabling trustless bounty creation, submission, and reward distribution through smart contracts.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-v0.30-purple)](https://www.anchor-lang.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📖 Overview

Solverse is a blockchain-based bounty platform where task creators can post tasks with SPL token rewards, participants can submit work, and winners receive automatic payouts through escrow smart contracts. All operations are trustless, transparent, and immutable on the Solana blockchain.

### Key Features

- **🎯 Task Creation**: Create tasks with customizable rewards using any SPL token
- **💰 Escrow System**: Automatic fund locking and distribution via smart contracts
- **⏱️ Time-Bound Tasks**: Set deadlines with automatic expiration handling
- **✅ Winner Selection**: Task creators pick winners from submitted work
- **🔐 Wallet Authentication**: Secure authentication via Solana wallet adapters
- **📊 Personal Dashboard**: Track created and accepted tasks in real-time
- **🛡️ Admin Panel**: Authorized task management and cleanup tools
- **📱 Responsive UI**: Modern neobrutalism design optimized for all devices

---

## 🏗️ Architecture

### Tech Stack

**Blockchain Layer**
- **Solana** - High-performance blockchain (devnet)
- **Anchor Framework** - Smart contract development framework
- **SPL Token Program** - Token management and transfers

**Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Animation library
- **Wallet Adapter** - Solana wallet integration

**Development Tools**
- **Bun** - Fast JavaScript runtime and package manager
- **Anchor CLI** - Smart contract compilation and deployment

### Smart Contract Architecture

```
programs/solverse/
├── lib.rs              # Program entry point
├── state/              # Account structures
│   ├── task.rs         # Task state management
│   ├── escrow.rs       # Escrow PDA
│   ├── submission.rs   # Work submission tracking
│   └── participation.rs # Task acceptance tracking
└── instructions/       # Program instructions
    ├── create_task.rs  # Initialize task with escrow
    ├── accept_task.rs  # Participant acceptance
    ├── submit_work.rs  # Work submission
    ├── pick_winner.rs  # Winner selection
    ├── claim_reward.rs # Reward distribution
    ├── refund_escrow.rs # Refund to creator
    └── close_task.rs   # Account cleanup
```

### Program Accounts

| Account | Type | Seeds | Description |
|---------|------|-------|-------------|
| `Task` | PDA | `["task", creator, taskId]` | Stores task metadata and state |
| `Escrow` | PDA | `["escrow", task]` | Holds reward funds in escrow |
| `Submission` | PDA | `["submission", task, participant]` | Tracks work submissions |
| `Participation` | PDA | `["participation", task, participant]` | Records task acceptance |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ or **Bun** v1.0+
- **Rust** v1.70+ with `wasm32` target
- **Solana CLI** v1.18+
- **Anchor CLI** v0.30+
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/solverse.git
   cd solverse
   ```

2. **Install Anchor dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   bun install
   # or npm install
   ```

4. **Configure Solana CLI for devnet**
   ```bash
   solana config set --url devnet
   solana airdrop 2  # Get devnet SOL
   ```

### Development

#### Running the Smart Contract Tests

```bash
# Build the program
anchor build

# Run all tests
anchor test

# Run specific test
anchor test --skip-build -- --test "Full bounty lifecycle"
```

#### Running the Frontend

```bash
cd frontend
bun run dev
# or npm run dev

# Visit http://localhost:3000
```

---

## 🔧 Configuration

### Program ID

Update the program ID in the following files after deployment:

- `Anchor.toml` - `[programs.devnet]`
- `frontend/src/lib/anchor.ts` - `PROGRAM_ID` constant
- `programs/solverse/src/lib.rs` - `declare_id!` macro

### Environment Variables

Create `.env.local` in the `frontend` directory:

```bash
# Optional: Custom RPC endpoint
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Optional: Network (devnet/mainnet-beta)
NEXT_PUBLIC_NETWORK=devnet
```

---

## 📝 Usage Guide

### For Task Creators

1. **Create a Task**
   - Navigate to the home page
   - Click "Create Task"
   - Fill in task details (ID, description, reward, duration)
   - Select reward token (USDC, USDT, Wrapped SOL, or custom)
   - Confirm transaction in wallet

2. **Review Submissions**
   - Go to Dashboard → "My Created Tasks"
   - Click on a task to view submissions
   - Review participant submissions after deadline

3. **Pick a Winner**
   - Select the best submission
   - Click "Pick Winner"
   - Winner can claim their reward

4. **Refund Escrow** (if no winner)
   - After deadline, if no winner selected
   - Click "Refund Escrow" to recover funds

### For Participants

1. **Browse Tasks**
   - View available tasks on the home page
   - Check reward, deadline, and description

2. **Accept a Task**
   - Click on a task to view details
   - Click "Accept Task" to participate
   - Submit work link before deadline

3. **Claim Reward**
   - If selected as winner, return to task page
   - Click "Claim Reward" after deadline
   - Tokens will be transferred to your wallet

---

## 🌐 Deployment

### Smart Contract Deployment

1. **Build the program**
   ```bash
   anchor build
   ```

2. **Deploy to devnet**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

3. **Update Program ID**
   - Copy the deployed program ID
   - Update in all configuration files (see Configuration section)

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy frontend"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Set root directory to `frontend`
   - Deploy!

3. **Environment Variables** (Vercel Dashboard)
   - Add `NEXT_PUBLIC_RPC_ENDPOINT` if using custom RPC
   - Add `NEXT_PUBLIC_NETWORK` (devnet/mainnet-beta)

---

## 🔐 Security Considerations

### Smart Contract Security

- ✅ **PDA Validation**: All accounts use Program Derived Addresses with seed constraints
- ✅ **Signer Checks**: Creator and participant signatures verified on all operations
- ✅ **Time Guards**: Deadline enforcement prevents expired submissions
- ✅ **State Validation**: Status checks prevent invalid state transitions
- ✅ **Escrow Safety**: Funds locked in PDA until winner claims or creator refunds

### Known Limitations

- **No Multi-Winner Support**: Only one winner per task
- **No Submission Editing**: Submissions are immutable after creation
- **No Task Cancellation**: Tasks cannot be cancelled before deadline
- **Devnet Only**: Currently deployed on devnet for testing

---

## 🧪 Testing

### Test Coverage

- ✅ Full bounty lifecycle (create → submit → pick → claim)
- ✅ Refund escrow when no winner
- ✅ Edge cases (zero duration, late submissions, early picks)
- ✅ Invalid winner validation
- ✅ Non-creator authorization checks
- ✅ Claim reward validation (before deadline, non-winner)

### Running Tests

```bash
# All tests
anchor test

# With logs
anchor test -- --nocapture

# Specific test file
anchor test --skip-build tests/solverse.ts
```

---

## 📚 API Reference

### Program Instructions

#### `create_task`
Creates a new task with escrow funding.

**Accounts**
- `creator` - Task creator (signer, payer)
- `task` - Task PDA (init)
- `escrow` - Escrow PDA (init)
- `reward_mint` - SPL token mint for rewards

**Arguments**
- `task_id: String` - Unique task identifier
- `description: String` - Task description
- `reward: u64` - Reward amount (in smallest token units)
- `duration: i64` - Task duration in seconds

#### `accept_task`
Participant accepts a task.

**Accounts**
- `participant` - Task participant (signer, payer)
- `task` - Task PDA
- `participation` - Participation PDA (init)

**Arguments**
- `task_id: String` - Task identifier

#### `submit_work`
Submit work for a task.

**Accounts**
- `participant` - Submitter (signer)
- `task` - Task PDA
- `submission` - Submission PDA (init)

**Arguments**
- `task_id: String` - Task identifier
- `link: String` - Submission link

#### `pick_winner`
Creator selects a winner.

**Accounts**
- `creator` - Task creator (signer)
- `task` - Task PDA (mut)
- `submission` - Winning submission PDA
- `escrow` - Escrow PDA (mut)

**Arguments**
- `task_id: String` - Task identifier

#### `claim_reward`
Winner claims their reward.

**Accounts**
- `winner` - Winner (signer)
- `task` - Task PDA
- `escrow` - Escrow PDA (mut, close)
- `escrow_vault` - Escrow token account (mut, close)
- `winner_token_account` - Winner's token account (mut)

**Arguments**
- `task_id: String` - Task identifier

#### `refund_escrow`
Creator refunds escrow if no winner.

**Accounts**
- `creator` - Task creator (signer)
- `task` - Task PDA
- `escrow` - Escrow PDA (mut, close)
- `escrow_vault` - Escrow token account (mut, close)
- `creator_token_account` - Creator's token account (mut)

**Arguments**
- `task_id: String` - Task identifier

#### `close_task`
Closes a task account (creator only).

**Accounts**
- `creator` - Task creator (signer)
- `task` - Task PDA (mut, close)

**Arguments**
- `task_id: String` - Task identifier

---

## 🛠️ Admin Tools

### Bulk Task Deletion

For cleaning up test tasks:

```bash
cd frontend
bun run scripts/close-all-tasks.ts
```

This script:
- Fetches all tasks created by your wallet
- Closes each task account
- Returns rent to your wallet

### Admin Page

Access at `/admin` (authorized wallets only):
- Close individual tasks by ID
- Wallet authorization check
- Visual feedback for operations

To authorize wallets, edit `frontend/src/app/admin/page.tsx`:
```typescript
const AUTHORIZED_ADMINS = [
  "YourWalletAddressHere...",
];
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Anchor Framework](https://www.anchor-lang.com/)
- UI powered by [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Wallet integration via [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)

---

## 📧 Support

For questions and support:
- **Issues**: [GitHub Issues](https://github.com/yourusername/solverse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/solverse/discussions)
- **Twitter**: [@yourusername](https://twitter.com/yourusername)

---

**Built with ❤️ on Solana**