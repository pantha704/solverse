import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solverse } from "../target/types/solverse";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  mintTo,
  getAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import { BN } from "@coral-xyz/anchor";

describe("solverse", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Solverse as Program<Solverse>;

  // Load once at the top — reuse everywhere
  const creatorKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(require("fs").readFileSync("/home/panther/.config/solana/id.json", "utf8")))
  );
  const participantKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(require("fs").readFileSync("/home/panther/participant-keypair.json", "utf8")))
  );

  let creator: Keypair = creatorKeypair;
  let participant: Keypair = participantKeypair;
  let mint: Keypair;
  let creatorTokenAccount: PublicKey;
  let participantTokenAccount: PublicKey;

  const description = "End-to-end bounty task";
  const rewardAmount = new BN(10_000_000); // 10 tokens, 6 decimals
  const duration = 12;                    // reliable timeout
  const link = "https://example.com/submission";

  before(async () => {
    // creator = provider.wallet.payer as Keypair;

    // const sig = await provider.connection.requestAirdrop(creator.publicKey, 5_000_000_000);
    // await provider.connection.confirmTransaction(sig);

    const creator = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(require("fs").readFileSync("/home/panther/.config/solana/id.json", "utf8")))
    );

    mint = Keypair.generate();
    const rent = await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: creator.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports: rent,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mint.publicKey, 6, creator.publicKey, null)
    );
    await provider.sendAndConfirm(tx, [mint]);

    creatorTokenAccount = getAssociatedTokenAddressSync(mint.publicKey, creator.publicKey);
    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
          creator.publicKey,
          creatorTokenAccount,
          creator.publicKey,
          mint.publicKey
        )
      ),
      [creator]
    );
    await mintTo(
      provider.connection,
      creator,
      mint.publicKey,
      creatorTokenAccount,
      creator,
      rewardAmount.mul(new BN(100)).toNumber() // plenty of tokens
    );

    // participant = Keypair.generate();
    // const participantSig = await provider.connection.requestAirdrop(participant.publicKey, 2_000_000_000);
    // await provider.connection.confirmTransaction(participantSig);

    participant = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(require("fs").readFileSync("/home/panther/participant-keypair.json", "utf8")))
    );

    participantTokenAccount = getAssociatedTokenAddressSync(mint.publicKey, participant.publicKey);
    await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        createAssociatedTokenAccountInstruction(
          participant.publicKey,
          participantTokenAccount,
          participant.publicKey,
          mint.publicKey
        )
      ),
      [participant]
    );
  });

  it("Full bounty lifecycle: create → submit → pick → claim", async () => {
    const taskId = `e2e-${Date.now()}`;
    let task: PublicKey;
    let escrow: PublicKey;
    let submission: PublicKey;

    [task] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId)],
      program.programId
    );
    [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task.toBuffer()],
      program.programId
    );
    const escrowVault = getAssociatedTokenAddressSync(mint.publicKey, escrow, true);

    // Create
    await program.methods
      .createTask(taskId, description, rewardAmount, new BN(duration))
      .accounts({
        creator: creator.publicKey,
        task,
        escrow,
        creatorTokenAccount,
        escrowVault,
        rewardMint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    // Submit
    [submission] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), task.toBuffer(), participant.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .submitWork(taskId, link)
      .accounts({
        participant: participant.publicKey,
        creator: creator.publicKey,
        task,
        submission,
        systemProgram: SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    // Pick winner
    await new Promise(r => setTimeout(r, duration * 1000 + 3000));

    await program.methods
      .pickWinner(taskId)
      .accounts({
        creator: creator.publicKey,
        task,
        submission,
        escrow,
        participant: participant.publicKey,
      })
      .signers([creator])
      .rpc();

    // Claim
    const initial = await getAccount(provider.connection, participantTokenAccount);

    await program.methods
      .claimReward(taskId)
      .accounts({
        winner: participant.publicKey,
        task,
        escrow,
        escrowVault,
        winnerTokenAccount: participantTokenAccount,
        creator: creator.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    const final = await getAccount(provider.connection, participantTokenAccount);
    assert.equal(
      final.amount.toString(),
      (BigInt(initial.amount) + BigInt(rewardAmount.toString())).toString()
    );
  });

  it("Refund escrow when no winner", async () => {
    const taskId = `refund-${Date.now()}`;
    let task: PublicKey;
    let escrow: PublicKey;

    [task] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId)],
      program.programId
    );
    [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task.toBuffer()],
      program.programId
    );
    const escrowVault = getAssociatedTokenAddressSync(mint.publicKey, escrow, true);

    await program.methods
      .createTask(taskId, description, rewardAmount, new BN(duration))
      .accounts({
        creator: creator.publicKey,
        task,
        escrow,
        creatorTokenAccount,
        escrowVault,
        rewardMint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    await new Promise(r => setTimeout(r, duration * 1000 + 3000));

    const initial = await getAccount(provider.connection, creatorTokenAccount);

    await program.methods
      .refundEscrow(taskId)
      .accounts({
        creator: creator.publicKey,
        task,
        escrow,
        escrowVault,
        creatorTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    const final = await getAccount(provider.connection, creatorTokenAccount);
    assert(final.amount > BigInt(initial.amount));
  });

  // ==================== EDGE CASES ====================

  it("Fails create_task with zero duration", async () => {
    const taskId = `zero-dur-${Date.now()}`;
    const [task] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId)],
      program.programId
    );
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task.toBuffer()],
      program.programId
    );
    const escrowVault = getAssociatedTokenAddressSync(mint.publicKey, escrow, true);

    try {
      await program.methods
        .createTask(taskId, description, rewardAmount, new BN(0))
        .accounts({
          creator: creator.publicKey,
          task,
          escrow,
          creatorTokenAccount,
          escrowVault,
          rewardMint: mint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.include(e.message, "EscrowMismatch");
    }
  });

  it("Fails submit_work after deadline", async () => {
    const taskId = `late-submit-${Date.now()}`;
    const [task] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId)],
      program.programId
    );
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task.toBuffer()],
      program.programId
    );
    const escrowVault = getAssociatedTokenAddressSync(mint.publicKey, escrow, true);

    await program.methods
      .createTask(taskId, description, rewardAmount, new BN(duration))
      .accounts({
        creator: creator.publicKey,
        task,
        escrow,
        creatorTokenAccount,
        escrowVault,
        rewardMint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    await new Promise(r => setTimeout(r, duration * 1000 + 3000));

    // const lateParticipant = Keypair.generate();
    // const sig = await provider.connection.requestAirdrop(lateParticipant.publicKey, 1_000_000_000);
    // await provider.connection.confirmTransaction(sig);

    const lateParticipant = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(require("fs").readFileSync("/home/panther/participant-keypair.json", "utf8")))
    );
    const [lateSubmission] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), task.toBuffer(), lateParticipant.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .submitWork(taskId, "too late")
        .accounts({
          participant: lateParticipant.publicKey,
          creator: creator.publicKey,
          task,
          submission: lateSubmission,
          systemProgram: SystemProgram.programId,
        })
        .signers([lateParticipant])
        .rpc();
      assert.fail("Should have failed with TaskEnded");
    } catch (e) {
      assert.include(e.message, "TaskEnded");
    }
  });

  it("Fails pick_winner before deadline", async () => {
    const taskId = `early-pick-${Date.now()}`;
    const [task] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId)],
      program.programId
    );
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task.toBuffer()],
      program.programId
    );
    const escrowVault = getAssociatedTokenAddressSync(mint.publicKey, escrow, true);

    await program.methods
      .createTask(taskId, description, rewardAmount, new BN(duration))
      .accounts({
        creator: creator.publicKey,
        task,
        escrow,
        creatorTokenAccount,
        escrowVault,
        rewardMint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    // const p = Keypair.generate();
    // const sig = await provider.connection.requestAirdrop(p.publicKey, 1_000_000_000);
    // await provider.connection.confirmTransaction(sig);

    const p = participantKeypair

    const [sub] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), task.toBuffer(), participant.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .submitWork(taskId, link)
      .accounts({
        participant: p.publicKey,
        creator: creator.publicKey,
        task,
        submission: sub,
        systemProgram: SystemProgram.programId,
      })
      .signers([p])
      .rpc();

    try {
      await program.methods
        .pickWinner(taskId)
        .accounts({
          creator: creator.publicKey,
          task,
          submission: sub,
          escrow,
          participant: p.publicKey,
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have failed with TaskNotEnded");
    } catch (e) {
      assert.include(e.message, "TaskNotEnded");
    }
  });

  it("Fails pick_winner with invalid submission (different task)", async () => {
    // Main task
    const taskId1 = `main-${Date.now()}`;
    const [task1] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId1)],
      program.programId
    );
    const [escrow1] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task1.toBuffer()],
      program.programId
    );
    const vault1 = getAssociatedTokenAddressSync(mint.publicKey, escrow1, true);

    await program.methods
      .createTask(taskId1, description, rewardAmount, new BN(duration))
      .accounts({
        creator: creator.publicKey,
        task: task1,
        escrow: escrow1,
        creatorTokenAccount,
        escrowVault: vault1,
        rewardMint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    // Second task + submission
    const taskId2 = `invalid-${Date.now()}`;
    const [task2] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId2)],
      program.programId
    );
    const [escrow2] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task2.toBuffer()],
      program.programId
    );
    const vault2 = getAssociatedTokenAddressSync(mint.publicKey, escrow2, true);

    await program.methods
      .createTask(taskId2, description, rewardAmount, new BN(duration))
      .accounts({
        creator: creator.publicKey,
        task: task2,
        escrow: escrow2,
        creatorTokenAccount,
        escrowVault: vault2,
        rewardMint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    // const invalidParticipant = Keypair.generate();
    // const sig = await provider.connection.requestAirdrop(invalidParticipant.publicKey, 1_000_000_000);
    // await provider.connection.confirmTransaction(sig);

    const invalidParticipant = participantKeypair
    const [invalidSubmission] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), task2.toBuffer(), invalidParticipant.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .submitWork(taskId2, link)
      .accounts({
        participant: invalidParticipant.publicKey,
        creator: creator.publicKey,
        task: task2,
        submission: invalidSubmission,
        systemProgram: SystemProgram.programId,
      })
      .signers([invalidParticipant])
      .rpc();

    await new Promise(r => setTimeout(r, duration * 1000 + 3000));

    try {
      await program.methods
        .pickWinner(taskId1)
        .accounts({
          creator: creator.publicKey,
          task: task1,
          submission: invalidSubmission,
          escrow: escrow1,
          participant: invalidParticipant.publicKey,
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have failed with InvalidWinner");
    } catch (e) {
       assert.include(e.message, "ConstraintSeeds");
    }
  });

  it("Fails pick_winner as non-creator (seeds mismatch)", async () => {
    const taskId = `non-creator-${Date.now()}`;
    const [task] = PublicKey.findProgramAddressSync(
      [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId)],
      program.programId
    );
    const [escrow] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), task.toBuffer()],
      program.programId
    );
    const escrowVault = getAssociatedTokenAddressSync(mint.publicKey, escrow, true);

    await program.methods
      .createTask(taskId, description, rewardAmount, new BN(duration))
      .accounts({
        creator: creator.publicKey,
        task,
        escrow,
        creatorTokenAccount,
        escrowVault,
        rewardMint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    // const p = Keypair.generate();
    // const sig = await provider.connection.requestAirdrop(p.publicKey, 1_000_000_000);
    // await provider.connection.confirmTransaction(sig);

    const p = participantKeypair

    const [sub] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), task.toBuffer(), p.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .submitWork(taskId, link)
      .accounts({
        participant: p.publicKey,
        creator: creator.publicKey,
        task,
        submission: sub,
        systemProgram: SystemProgram.programId,
      })
      .signers([p])
      .rpc();

    await new Promise(r => setTimeout(r, duration * 1000 + 3000));

    // const fakeCreator = Keypair.generate();
    // const fakeSig = await provider.connection.requestAirdrop(fakeCreator.publicKey, 1_000_000_000);
    // await provider.connection.confirmTransaction(fakeSig);

    const fakeCreator = Keypair.generate()

    try {
      await program.methods
        .pickWinner(taskId)
        .accounts({
          creator: fakeCreator.publicKey,
          task,
          submission: sub,
          escrow,
          participant: p.publicKey,
        })
        .signers([fakeCreator])
        .rpc();
      assert.fail("Should have failed with ConstraintSeeds");
    } catch (e) {
      assert.include(e.message, "ConstraintSeeds");
    }
  });
    describe("claim_reward", () => {
    let taskId: string;
    let task: PublicKey;
    let escrow: PublicKey;
    let submission: PublicKey;
    let escrowVault: PublicKey;

    beforeEach(async () => {
      taskId = `claim-reward-${Date.now()}`;
      [task] = PublicKey.findProgramAddressSync(
        [Buffer.from("task"), creator.publicKey.toBuffer(), Buffer.from(taskId)],
        program.programId
      );
      [escrow] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), task.toBuffer()],
        program.programId
      );
      escrowVault = getAssociatedTokenAddressSync(mint.publicKey, escrow, true);

      await program.methods
        .createTask(taskId, description, rewardAmount, new BN(duration))
        .accounts({
          creator: creator.publicKey,
          task,
          escrow,
          creatorTokenAccount,
          escrowVault,
          rewardMint: mint.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      // participant = Keypair.generate();
      // const sig = await provider.connection.requestAirdrop(participant.publicKey, 1_000_000_000);
      // await provider.connection.confirmTransaction(sig);

      const p = participantKeypair

      const [submission] = PublicKey.findProgramAddressSync(
        [Buffer.from("submission"), task.toBuffer(), p.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .submitWork(taskId, link)
        .accounts({
          participant: p.publicKey,
          creator: creator.publicKey,
          task,
          submission,
          systemProgram: SystemProgram.programId,
        })
        .signers([participant])
        .rpc();

      // Pick winner
      await new Promise(resolve => setTimeout(resolve, duration * 1000 + 3000));
      await program.methods
        .pickWinner(taskId)
        .accounts({
          creator: creator.publicKey,
          task,
          submission,
          escrow,
          participant: participant.publicKey,
        })
        .signers([creator])
        .rpc();
    });

    it("Winner claims reward after pick", async () => {
      const initialBalance = await getAccount(provider.connection, participantTokenAccount);

      await program.methods
        .claimReward(taskId)
        .accounts({
          winner: participant.publicKey,
          task,
          escrow,
          escrowVault,
          winnerTokenAccount: participantTokenAccount,
          creator: creator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([participant])
        .rpc();

      const finalBalance = await getAccount(provider.connection, participantTokenAccount);
      assert.equal(
        finalBalance.amount.toString(),
        (BigInt(initialBalance.amount) + BigInt(rewardAmount.toString())).toString()
      );

      // Escrow closed
      try {
        await program.account.escrow.fetch(escrow);
        assert.fail("Escrow should be closed");
      } catch (e) {
        // Expected
      }
      try {
        await getAccount(provider.connection, escrowVault);
        assert.fail("Vault should be closed");
      } catch (e) {
        // Expected
      }
    });

    it("Fails claim before deadline", async () => {
      // Reset clock (before wait)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Partial wait to before deadline

      try {
        await program.methods
          .claimReward(taskId)
          .accounts({
            winner: participant.publicKey,
            task,
            escrow,
            escrowVault,
            winnerTokenAccount: participantTokenAccount,
            creator: creator.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([participant])
          .rpc();
        assert.fail("Should have failed with TaskNotEnded");
      } catch (e) {
        assert.include(e.message, "TaskNotEnded");
      }
    });

    it("Fails claim as non-winner", async () => {
      await new Promise(resolve => setTimeout(resolve, duration * 1000 + 3000));

      // const fakeWinner = Keypair.generate();
      // const fakeSig = await provider.connection.requestAirdrop(fakeWinner.publicKey, 1_000_000_000);
      // await provider.connection.confirmTransaction(fakeSig);

      const fakeWinner = Keypair.generate()

      await provider.sendAndConfirm(
      new anchor.web3.Transaction().add(
        SystemProgram.transfer({
          fromPubkey: creator.publicKey,
          toPubkey: fakeWinner.publicKey,
          lamports: 100_000_000, // 0.1 SOL
        })
      ),
      [creator]
    );

      const fakeTokenAccount = getAssociatedTokenAddressSync(mint.publicKey, fakeWinner.publicKey);
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            fakeWinner.publicKey,
            fakeTokenAccount,
            fakeWinner.publicKey,
            mint.publicKey
          )
        ),
        [fakeWinner]
      );

      try {
        await program.methods
          .claimReward(taskId)
          .accounts({
            winner: fakeWinner.publicKey,
            task,
            escrow,
            escrowVault,
            winnerTokenAccount: fakeTokenAccount,
            creator: creator.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([fakeWinner])
          .rpc();
        assert.fail("Should have failed with InvalidWinner");
      } catch (e) {
        assert.include(e.message, "InvalidWinner");
      }
    });
  });
});