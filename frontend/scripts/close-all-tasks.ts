import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { readFileSync } from "fs";
import IDL from "../src/lib/idl.json";
import type { Solverse } from "../src/lib/types";

const PROGRAM_ID = new PublicKey("4kruCJtCQbxT1AQxZprCe7MfBVwFBJKYsdySz8ECPe6p");

async function closeAllTasks() {
  // Use the wallet from tests that created the tasks
  const keypairPath = "/home/panther/.config/solana/id.json";

  console.log("📂 Loading wallet from:", keypairPath);
  const keypairData = JSON.parse(readFileSync(keypairPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));

  console.log("👤 Wallet:", keypair.publicKey.toString());

  // Setup connection and program
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const program = new Program(IDL as any, provider) as Program<Solverse>;

  // Fetch all tasks
  console.log("\n🔍 Fetching all tasks...");
  const allTasks = await program.account.task.all();

  // Filter tasks created by you
  const myTasks = allTasks.filter(
    (task: any) => task.account.creator.toString() === keypair.publicKey.toString()
  );

  console.log(`\n📊 Found ${myTasks.length} tasks created by you`);
  console.log(`   Total tasks on program: ${allTasks.length}`);

  if (myTasks.length === 0) {
    console.log("\n✅ No tasks to close!");
    return;
  }

  // Display tasks
  console.log("\n📋 Your tasks:");
  myTasks.forEach((task: any, i: number) => {
    console.log(`   ${i + 1}. Task ID: ${task.account.taskId}`);
  });

  // Close each task
  console.log("\n🗑️  Starting to close tasks...\n");
  let successCount = 0;
  let failCount = 0;

  for (const task of myTasks) {
    const taskId = task.account.taskId;
    try {
      const txSignature = await program.methods
        .closeTask(taskId)
        .accounts({
          creator: keypair.publicKey,
        })
        .rpc();

      console.log(`✅ Closed: ${taskId}`);
      console.log(`   TX: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
      successCount++;
    } catch (error) {
      console.log(`❌ Failed: ${taskId}`);
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      failCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary:");
  console.log(`   ✅ Successfully closed: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   💰 Recovered rent from ${successCount} task accounts`);
  console.log("=".repeat(60));
}

closeAllTasks()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
