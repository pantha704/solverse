"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useParams, useRouter } from "next/navigation";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getProgram, getTaskPDA, getEscrowPDA, getParticipationPDA, getSubmissionPDA } from "@/lib/anchor";
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
}

interface Submission {
  participant: PublicKey;
  link: string;
}

export default function TaskDetail() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const { connection } = useConnection();
  const wallet = useWallet();

  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");
  const [hasAccepted, setHasAccepted] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
      fetchSubmissions();
      checkParticipation();
    }
  }, [taskId, wallet.publicKey]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const program = getProgram(connection, wallet);

      // Fetch all tasks and find the matching one
      const allTasks = await program.account.task.all();
      const matchingTask = allTasks.find((t: any) => t.account.taskId === taskId);

      if (!matchingTask) {
        console.error("Task not found");
        setLoading(false);
        return;
      }

      const taskAccount = matchingTask.account;
      setTask({
        taskId: taskAccount.taskId,
        description: taskAccount.description,
        creator: taskAccount.creator,
        reward: taskAccount.reward.toNumber() / 1e6,
        startTime: taskAccount.startTime.toNumber(),
        endTime: taskAccount.endTime.toNumber(),
        winner: taskAccount.winner,
        submissionCount: taskAccount.submissionCount,
      });
    } catch (error) {
      console.error("Error fetching task:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!task) return;

    try {
      const program = getProgram(connection, wallet);
      const accounts = await program.account.submission.all();

      // Get the task PDA for comparison
      const [taskPDA] = getTaskPDA(task.creator, taskId);

      // Filter submissions for this specific task only
      const taskSubmissions = accounts
        .filter((acc: any) => acc.account.task.toString() === taskPDA.toString())
        .map((acc: any) => ({
          participant: acc.account.participant,
          link: acc.account.link,
        }));

      setSubmissions(taskSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const checkParticipation = async () => {
    if (!wallet.publicKey || !task) return;

    try {
      const program = getProgram(connection, wallet);
      const [taskPDA] = getTaskPDA(task.creator, taskId);
      const [participationPDA] = getParticipationPDA(taskPDA, wallet.publicKey);

      const participation = await program.account.participation.fetchNullable(participationPDA);
      setHasAccepted(!!participation);

      if (participation) {
        setHasSubmitted(
          !!participation.status.submitted || !!participation.status.completed
        );
      }
    } catch (error) {
      console.error("Error checking participation:", error);
    }
  };

  const handleAcceptTask = async () => {
    if (!wallet.publicKey || !task) return;

    try {
      const program = getProgram(connection, wallet);
      const [taskPDA] = getTaskPDA(task.creator, taskId);
      const [participationPDA] = getParticipationPDA(taskPDA, wallet.publicKey);

      const txSignature = await program.methods
        .acceptTask(taskId)
        .accounts({
          creator: task.creator,
        })
        .rpc();

      const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
      toast.success("Task accepted!", {
        description: (
          <div>
            <p>You can now submit your work</p>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-leaf-primary font-bold">
              View Transaction →
            </a>
          </div>
        ),
      });
      await checkParticipation();
    } catch (error) {
      console.error("Error accepting task:", error);
      toast.error("Failed to accept task", {
        description: "Please try again"
      });
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !task) return;

    try {
      const program = getProgram(connection, wallet);
      const [taskPDA] = getTaskPDA(task.creator, taskId);
      const [participationPDA] = getParticipationPDA(taskPDA, wallet.publicKey);
      const [submissionPDA] = getSubmissionPDA(taskPDA, wallet.publicKey);

      const txSignature = await program.methods
        .submitWork(taskId, submissionLink)
        .accounts({
          creator: task.creator,
        })
        .rpc();

      const explorerUrl = `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
      toast.success("Work submitted!", {
        description: (
          <div>
            <p>Your submission has been recorded</p>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-leaf-primary font-bold">
              View Transaction →
            </a>
          </div>
        ),
      });
      setSubmissionLink("");
      await fetchTaskDetails();
      await fetchSubmissions();
      await checkParticipation();
    } catch (error) {
      console.error("Error submitting work:", error);
      toast.error("Failed to submit work", {
        description: "Please try again"
      });
    }
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Date.now() / 1000;
    const remaining = endTime - now;

    if (remaining <= 0) return "Ended";

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-leaf-pale flex items-center justify-center">
        <p className="text-3xl font-bold">Loading...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-leaf-pale flex items-center justify-center">
        <Card className="text-center">
          <p className="text-2xl font-bold mb-4">Task not found</p>
          <Link href="/">
            <Button variant="primary">Back to Tasks</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isCreator = wallet.publicKey?.toString() === task.creator.toString();
  const isExpired = task.endTime <= Date.now() / 1000;

  return (
    <div className="min-h-screen bg-leaf-pale py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Link href="/">
          <Button variant="outline" size="sm" className="mb-6">
            ← Back to Tasks
          </Button>
        </Link>

        {/* Task Card */}
        <Card className="mb-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="brutal-border brutal-shadow-sm bg-leaf-medium text-white inline-block px-4 py-2 mb-4 font-bold uppercase text-sm">
                #{task.taskId}
              </div>
              <h1 className="text-4xl font-bold uppercase text-black">Task Details</h1>
            </div>

            {task.winner && (
              <div className="brutal-border brutal-shadow-sm bg-accent-yellow px-4 py-2 font-bold uppercase">
                ✓ Completed
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-8 p-4 bg-gray-light brutal-border">
            <p className="text-lg text-gray-dark">{task.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="brutal-border brutal-shadow-sm bg-white p-4 text-center">
              <p className="text-sm font-bold text-gray-dark mb-1">REWARD</p>
              <p className="text-2xl font-bold text-leaf-primary">{task.reward} Tokens</p>
            </div>

            <div className="brutal-border brutal-shadow-sm bg-white p-4 text-center">
              <p className="text-sm font-bold text-gray-dark mb-1">TIME LEFT</p>
              <p className="text-2xl font-bold text-accent-red">{getTimeRemaining(task.endTime)}</p>
            </div>

            <div className="brutal-border brutal-shadow-sm bg-white p-4 text-center">
              <p className="text-sm font-bold text-gray-dark mb-1">SUBMISSIONS</p>
              <p className="text-2xl font-bold text-black">{task.submissionCount}</p>
            </div>

            <div className="brutal-border brutal-shadow-sm bg-white p-4 text-center">
              <p className="text-sm font-bold text-gray-dark mb-1">STATUS</p>
              <p className="text-lg font-bold text-leaf-medium">
                {hasAccepted ? (hasSubmitted ? "SUBMITTED" : "ACCEPTED") : "OPEN"}
              </p>
            </div>
          </div>

          {/* Creator */}
          <div className="mb-8 pb-8 border-b-[3px] border-black">
            <p className="font-bold text-sm uppercase text-gray-dark mb-2">Creator</p>
            <p className="font-mono text-sm bg-gray-light brutal-border px-3 py-2 break-all">
              {task.creator.toString()}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowSubmissionsModal(true)}
            >
              👁 View Submissions ({submissions.length})
            </Button>

            {!isCreator && !hasAccepted && wallet.publicKey && (
              <div>
                <Button
                  variant="primary"
                  className="w-full"
                  size="lg"
                  onClick={handleAcceptTask}
                  disabled={isExpired}
                >
                  ✓ Accept Task
                </Button>
                {isExpired && (
                  <p className="text-sm text-accent-red font-bold mt-2 text-center">
                    ⏰ This task has expired
                  </p>
                )}
              </div>
            )}

            {hasAccepted && !hasSubmitted && (
              <form onSubmit={handleSubmitWork} className="space-y-4">
                <input
                  type="url"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  placeholder="https://your-work-link.com"
                  className="w-full brutal-border brutal-shadow-sm px-4 py-3 focus:outline-none focus:brutal-shadow-lg transition-all"
                  required
                  maxLength={100}
                  disabled={isExpired}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="lg"
                  disabled={isExpired}
                >
                  📤 Submit Work
                </Button>
                {isExpired && (
                  <p className="text-sm text-accent-red font-bold text-center">
                    ⏰ This task has expired - submissions are closed
                  </p>
                )}
              </form>
            )}

            {!wallet.publicKey && (
              <div className="brutal-border brutal-shadow-sm bg-accent-yellow p-4 text-center">
                <p className="font-bold">Connect your wallet to interact with this task</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Submissions Modal */}
      <Modal
        isOpen={showSubmissionsModal}
        onClose={() => setShowSubmissionsModal(false)}
        title="Submissions"
      >
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xl font-bold text-gray-dark">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission, idx) => (
              <div
                key={idx}
                className="brutal-border brutal-shadow-sm bg-white p-4 hover:brutal-shadow-lg transition-all"
              >
                <p className="font-bold text-sm uppercase text-gray-dark mb-2">
                  Participant {idx + 1}
                </p>
                <p className="font-mono text-xs bg-gray-light px-2 py-1 mb-3 break-all">
                  {submission.participant.toString()}
                </p>
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-leaf-primary font-bold hover:text-leaf-dark underline break-all"
                >
                  {submission.link}
                </a>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
