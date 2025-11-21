"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "@/lib/anchor";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import { toast } from "sonner";

// List of authorized admin wallet addresses
const AUTHORIZED_ADMINS = [
  "4NEhzQmwNKnvDtnZmHcykybBNmW1KL2xkD9PN9f8MPsc",
  // Add more wallet addresses here if needed
];

export default function AdminPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [taskId, setTaskId] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if connected wallet is authorized
  const isAuthorized = wallet.publicKey && AUTHORIZED_ADMINS.includes(wallet.publicKey.toString());

  const handleCloseTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !isAuthorized) return;

    try {
      setLoading(true);
      const program = getProgram(connection, wallet);

      // Execute close_task instruction
      const txSignature = await program.methods
        .closeTask(taskId)
        .accounts({
          creator: wallet.publicKey,
        })
        .rpc();

      const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
      toast.success("Task closed successfully!", {
        description: (
          <div>
            <p>Task "{taskId}" has been deleted</p>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-leaf-primary font-bold">
              View Transaction →
            </a>
          </div>
        ),
      });

      // Reset form
      setTaskId("");
    } catch (error) {
      console.error("Error closing task:", error);
      toast.error("Failed to close task", {
        description: error instanceof Error ? error.message : "Please ensure you are the task creator"
      });
    } finally {
      setLoading(false);
    }
  };

  // If wallet not connected
  if (!wallet.publicKey) {
    return (
      <div className="min-h-screen bg-gray-light py-12 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center p-12">
            <h1 className="text-4xl font-bold mb-4 uppercase">🔒 Admin Panel</h1>
            <p className="text-xl text-gray-dark mb-6">
              Please connect your wallet to access the admin panel
            </p>
            <div className="text-6xl mb-4">🔌</div>
          </Card>
        </div>
      </div>
    );
  }

  // If wallet not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-light py-12 px-6">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center p-12 border-accent-red">
            <h1 className="text-4xl font-bold mb-4 uppercase text-accent-red">🚫 Access Denied</h1>
            <p className="text-xl text-gray-dark mb-4">
              Your wallet is not authorized to access this page
            </p>
            <div className="text-6xl mb-6">⛔</div>
            <p className="text-sm font-mono bg-gray-light px-4 py-2 brutal-border inline-block">
              {wallet.publicKey.toString()}
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Authorized admin view
  return (
    <div className="min-h-screen bg-gray-light py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8 bg-leaf-pale border-leaf-primary">
            <h1 className="text-4xl font-bold mb-2 uppercase">⚙️ Admin Panel</h1>
            <p className="text-gray-dark">
              Authorized wallet: <span className="font-mono text-sm">{wallet.publicKey.toString()}</span>
            </p>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold mb-6 uppercase">🗑️ Close Task</h2>
            <p className="text-gray-dark mb-6">
              Enter the task ID to permanently delete it from the blockchain. This action cannot be undone.
            </p>

            <form onSubmit={handleCloseTask} className="space-y-6">
              <div>
                <label className="block font-bold mb-2 uppercase text-sm">Task ID</label>
                <input
                  type="text"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all"
                  placeholder="task-id-to-delete"
                  required
                />
                <p className="text-xs text-gray-dark mt-1">
                  ⚠️ Warning: Only the task creator can successfully close a task
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-accent-red hover:bg-red-600 border-black"
                size="lg"
                disabled={loading}
              >
                {loading ? "⏳ Closing Task..." : "🗑️ Close Task"}
              </Button>
            </form>
          </Card>

          <Card className="mt-6 bg-accent-yellow/20">
            <h3 className="font-bold mb-2 uppercase text-sm">📝 Important Notes</h3>
            <ul className="text-sm text-gray-dark space-y-2 list-disc list-inside">
              <li>You can only close tasks that you created (blockchain enforced)</li>
              <li>Closed tasks are permanently deleted from the blockchain</li>
              <li>The rent from the task account will be returned to the creator</li>
              <li>Refresh the home page to see updated task list</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
