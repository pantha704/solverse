"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram } from "@/lib/anchor";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";
import Link from "next/link";

interface Task {
  taskId: string;
  description: string;
  creator: PublicKey;
  reward: number;
  endTime: number;
  submissionCount: number;
}

interface Participation {
  task: PublicKey;
  status: any;
}

export default function Dashboard() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [acceptedTasks, setAcceptedTasks] = useState<Task[]>([]);
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wallet.publicKey) {
      fetchUserTasks();
    }
  }, [wallet.publicKey, connection]);

  const fetchUserTasks = async () => {
    if (!wallet.publicKey) return;

    try {
      setLoading(true);
      const program = getProgram(connection, wallet);

      // Fetch all tasks
      const allTasks = await program.account.task.all();

      // Filter created tasks
      const created = allTasks
        .filter((task: any) => task.account.creator.toString() === wallet.publicKey!.toString())
        .map((task: any) => ({
          taskId: task.account.taskId,
          description: task.account.description,
          creator: task.account.creator,
          reward: task.account.reward.toNumber() / 1e6, // SPL tokens (6 decimals)
          endTime: task.account.endTime.toNumber(),
          submissionCount: task.account.submissionCount,
        }));

      setCreatedTasks(created);

      // Fetch participations
      const participations = await program.account.participation.all();
      const userParticipations = participations.filter(
        (p: any) => p.account.participant.toString() === wallet.publicKey!.toString()
      );

      // Fetch tasks for participations
      const accepted: Task[] = [];
      for (const participation of userParticipations) {
        const taskPubkey = participation.account.task;
        const taskAccount = await program.account.task.fetch(taskPubkey);

        accepted.push({
          taskId: taskAccount.taskId,
          description: taskAccount.description,
          creator: taskAccount.creator,
          reward: taskAccount.reward.toNumber() / 1e6, // SPL tokens (6 decimals)
          endTime: taskAccount.endTime.toNumber(),
          submissionCount: taskAccount.submissionCount,
        });
      }

      setAcceptedTasks(accepted);
    } catch (error) {
      console.error("Error fetching user tasks:", error);
    } finally {
      setLoading(false);
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

  if (!wallet.publicKey) {
    return (
      <div className="min-h-screen bg-leaf-pale flex items-center justify-center px-6">
        <Card className="text-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-dark mb-6">
              Please connect your wallet to view your dashboard
            </p>
            <div className="brutal-border brutal-shadow-sm bg-accent-yellow p-6">
              <p className="font-bold">👆 Click the button in the navbar</p>
            </div>
          </motion.div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-leaf-pale py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl font-bold uppercase text-black mb-4">
            My Dashboard
          </h1>
          <div className="brutal-border brutal-shadow-md bg-white p-4">
            <p className="font-mono text-sm break-all">{wallet.publicKey.toString()}</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center text-2xl font-bold">Loading...</div>
        ) : (
          <div className="space-y-12">
            {/* Accepted Tasks Section */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold uppercase text-leaf-dark">
                  My Accepted Tasks ({acceptedTasks.length})
                </h2>
              </div>

              {acceptedTasks.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-xl font-bold text-gray-dark mb-4">
                    No accepted tasks
                  </p>
                  <p className="text-gray-dark mb-6">
                    Browse available tasks and accept one to get started!
                  </p>
                  <Link href="/">
                    <Button variant="primary">Browse Tasks</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {acceptedTasks.map((task) => (
                    <Card key={task.taskId} className="flex flex-col">
                      <div className="brutal-border brutal-shadow-sm bg-leaf-medium text-white inline-block px-4 py-2 mb-4 font-bold uppercase text-sm w-fit">
                        #{task.taskId}
                      </div>

                      <p className="text-gray-dark mb-6 flex-grow line-clamp-3">
                        {task.description}
                      </p>

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
                      </div>

                      <Link href={`/task/${task.taskId}`}>
                        <Button variant="primary" className="w-full" size="sm">
                          View Task
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Created Tasks Section */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold uppercase text-leaf-dark">
                  My Created Tasks ({createdTasks.length})
                </h2>
              </div>

              {createdTasks.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-xl font-bold text-gray-dark mb-4">
                    No created tasks
                  </p>
                  <p className="text-gray-dark mb-6">
                    Create your first task and get help from the community!
                  </p>
                  <Link href="/">
                    <Button variant="secondary">Create Task</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {createdTasks.map((task) => (
                    <Card key={task.taskId} className="flex flex-col">
                      <div className="brutal-border brutal-shadow-sm bg-accent-blue text-white inline-block px-4 py-2 mb-4 font-bold uppercase text-sm w-fit">
                        #{task.taskId} (CREATOR)
                      </div>

                      <p className="text-gray-dark mb-6 flex-grow line-clamp-3">
                        {task.description}
                      </p>

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

                      <Link href={`/task/${task.taskId}`}>
                        <Button variant="secondary" className="w-full" size="sm">
                          Manage Task
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
