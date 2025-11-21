"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getProgram,
  getTaskPDA,
  getEscrowPDA,
  getAssociatedTokenAddress,
  getEscrowVaultPDA,
  BN,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@/lib/anchor";
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

interface Task {
  taskId: string;
  description: string;
  creator: PublicKey;
  reward: number;
  startTime: number;
  endTime: number;
  winner: PublicKey | null;
  submissionCount: number;
  publicKey: PublicKey;
}

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [taskId, setTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days">("days");
  const [rewardMint, setRewardMint] = useState("");
  const [selectedToken, setSelectedToken] = useState("custom");

  useEffect(() => {
    fetchTasks();
  }, [connection]);

  // Popular devnet SPL tokens
  const POPULAR_TOKENS = {
    usdc: {
      name: "USDC (Devnet)",
      mint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // USDC devnet
    },
    usdt: {
      name: "USDT (Devnet)",
      mint: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS", // Tether devnet
    },
    sol: {
      name: "Wrapped SOL (Devnet)",
      mint: "So11111111111111111111111111111111111111112", // Native SOL wrapper (same on all networks)
    },
    custom: {
      name: "Custom Token",
      mint: "",
    },
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const program = getProgram(connection, wallet);
      const accounts = await program.account.task.all();

      const taskData = accounts.map((account: any) => ({
        ...account.account,
        publicKey: account.publicKey,
        reward: account.account.reward.toNumber() / 1e6, // Assuming 6 decimals for most tokens
        startTime: account.account.startTime.toNumber(),
        endTime: account.account.endTime.toNumber(),
      }));

      // Sort by creation date (newest first)
      const sortedTasks = taskData.sort((a, b) => b.startTime - a.startTime);

      setTasks(sortedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey) return;

    try {
      const program = getProgram(connection, wallet);

      // Parse reward mint
      const mintPubkey = new PublicKey(rewardMint);

      // Derive PDAs
      const [taskPDA] = getTaskPDA(wallet.publicKey, taskId);
      const [escrowPDA] = getEscrowPDA(taskPDA);

      // Get token accounts
      const creatorTokenAccount = getAssociatedTokenAddress(mintPubkey, wallet.publicKey);
      const escrowVault = getEscrowVaultPDA(escrowPDA, mintPubkey);

      // Convert reward amount (assuming 6 decimals)
      const rewardAmount = new BN(parseFloat(reward) * 1e6);

      // Convert duration to seconds based on selected unit
      let durationInSeconds: number;
      switch (durationUnit) {
        case "minutes":
          durationInSeconds = parseInt(duration) * 60;
          break;
        case "hours":
          durationInSeconds = parseInt(duration) * 60 * 60;
          break;
        case "days":
          durationInSeconds = parseInt(duration) * 24 * 60 * 60;
          break;
      }
      const durationSeconds = new BN(durationInSeconds);

      // Check if creator's token account exists, create if not
      const creatorTokenAccountInfo = await connection.getAccountInfo(creatorTokenAccount);

      let txSignature: string;

      if (!creatorTokenAccountInfo) {
        // Need to create the ATA first
        toast.info("Creating token account...", {
          description: "Initializing your token account for this token"
        });

        const transaction = await program.methods
          .createTask(taskId, description, rewardAmount, durationSeconds)
          .accounts({
            creator: wallet.publicKey,
            creatorTokenAccount: creatorTokenAccount,
            rewardMint: mintPubkey,
          })
          .preInstructions([
            createAssociatedTokenAccountInstruction(
              wallet.publicKey, // payer
              creatorTokenAccount, // ata
              wallet.publicKey, // owner
              mintPubkey // mint
            )
          ])
          .rpc();

        txSignature = transaction;
      } else {
        // Account exists, proceed normally
        txSignature = await program.methods
          .createTask(taskId, description, rewardAmount, durationSeconds)
          .accounts({
            creator: wallet.publicKey,
            creatorTokenAccount: creatorTokenAccount,
            rewardMint: mintPubkey,
          })
          .rpc();
      }

      // Reset form
      setTaskId("");
      setDescription("");
      setReward("");
      setDuration("");
      setRewardMint("");

      // Refresh tasks FIRST
      await fetchTasks();

      // Close modal AFTER refresh completes
      setShowCreateModal(false);

      const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
      toast.success("Task created successfully!", {
        description: (
          <div>
            <p>Task "{taskId}" is now live</p>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-leaf-primary font-bold">
              View Transaction →
            </a>
          </div>
        ),
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task", {
        description: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Date.now() / 1000;
    const remaining = endTime - now;

    if (remaining <= 0) return "Ended";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);

    return `${days}d ${hours}h`;
  };

  return (
    <div className="min-h-screen bg-leaf-pale py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="my-16 text-center"
        >
          <h1 className="mb-6">
            <span className="block text-7xl md:text-8xl font-black text-black uppercase tracking-tight italic" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              BUILD.
            </span>
            <span className="block text-7xl md:text-8xl font-black text-black uppercase tracking-tight italic" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              SUBMIT.
            </span>
            <span
              className="block text-7xl md:text-8xl font-black uppercase tracking-tight italic"
              style={{
                color: '#ec4899',
                WebkitTextStroke: '3px black',
                textShadow: '6px 6px 0px rgba(0,0,0,0.3)'
              }}
            >
              EARN.
            </span>
          </h1>
          <p className="text-2xl md:text-3xl mt-16 font-mono font-bold text-gray-dark mb-28">
            The decentralized task marketplace on Solana.
          </p>
        </motion.section>
        <hr className="brutal-border brutal-shadow-sm border-t-4 border-black my-16" />

        {/* Task List Section */}
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-bold uppercase text-black"
          >
            All Tasks
          </motion.h1>

          {wallet.publicKey && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Task
            </Button>
          )}
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="text-center text-2xl font-bold">Loading...</div>
        ) : tasks.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-2xl font-bold text-gray-dark mb-4">No tasks available</p>
            <p className="text-gray-dark">Be the first to create a task!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <Card key={task.taskId} className="flex flex-col">
                {/* Task ID Badge */}
                <div className="brutal-border brutal-shadow-sm bg-leaf-medium text-white inline-block px-4 py-2 mb-4 font-bold uppercase text-sm w-fit">
                  #{task.taskId}
                </div>

                {/* Description */}
                <p className="text-gray-dark mb-6 flex-grow line-clamp-3">
                  {task.description}
                </p>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">Reward:</span>
                    <span className="brutal-border brutal-shadow-sm bg-accent-yellow px-3 py-1 font-bold">
                      {task.reward} Tokens
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">Deadline:</span>
                    <span className="font-bold text-leaf-primary">
                      {getTimeRemaining(task.endTime)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-black">Submissions:</span>
                    <span className="font-bold text-black">{task.submissionCount}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Link href={`/task/${task.taskId}`} className="flex-1">
                    <Button variant="primary" className="w-full" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
      >
        <form onSubmit={handleCreateTask} className="space-y-6">
          <div>
            <label className="block font-bold mb-2 uppercase text-sm">Task ID</label>
            <input
              type="text"
              value={taskId}
              onChange={(e) => {
                // Only allow lowercase letters, numbers, and hyphens
                const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setTaskId(sanitized);
              }}
              className="w-full brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all"
              placeholder="my-task-id"
              required
              minLength={3}
              maxLength={50}
            />
            <p className="text-xs text-gray-dark mt-1">
              Use lowercase letters, numbers, and hyphens only (e.g., "build-website-2024")
            </p>
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase text-sm">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all resize-none"
              placeholder="Describe the task..."
              rows={4}
              required
              maxLength={280}
            />
            <p className="text-sm text-gray-dark mt-1">{description.length}/280</p>
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase text-sm">Reward (Tokens)</label>
            <input
              type="number"
              step="0.01"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="w-full brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all"
              placeholder="1.5"
              required
            />
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase text-sm">Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="flex-1 brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all"
                placeholder="7"
                required
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value as "minutes" | "hours" | "days")}
                className="brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all bg-white font-bold"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-2 uppercase text-sm">Reward Token</label>

            <div className="flex gap-2 mb-3">
              {/* Custom Token Input */}
              <input
                type="text"
                value={selectedToken === "custom" ? rewardMint : POPULAR_TOKENS[selectedToken as keyof typeof POPULAR_TOKENS].mint}
                onChange={(e) => {
                  if (selectedToken === "custom") {
                    setRewardMint(e.target.value);
                  }
                }}
                className="flex-1 brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all"
                placeholder="Token mint address"
                required
                disabled={selectedToken !== "custom"}
              />

              {/* Token Dropdown */}
              <select
                value={selectedToken}
                onChange={(e) => {
                  const token = e.target.value;
                  setSelectedToken(token);
                  if (token !== "custom") {
                    setRewardMint(POPULAR_TOKENS[token as keyof typeof POPULAR_TOKENS].mint);
                  } else {
                    setRewardMint("");
                  }
                }}
                className="brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all bg-white font-bold"
              >
                <option value="usdc">{POPULAR_TOKENS.usdc.name}</option>
                <option value="usdt">{POPULAR_TOKENS.usdt.name}</option>
                <option value="sol">{POPULAR_TOKENS.sol.name}</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <p className="text-xs text-gray-dark">
              Select a popular token or choose custom to enter your own SPL token mint address.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
