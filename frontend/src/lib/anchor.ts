import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { Solverse } from "./types";
import IDL from "./idl.json";

export const PROGRAM_ID = new PublicKey("4kruCJtCQbxT1AQxZprCe7MfBVwFBJKYsdySz8ECPe6p");

export function getProgram(connection: Connection, wallet: any): Program<Solverse> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(IDL as any, provider);
}

export function getTaskPDA(creator: PublicKey, taskId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("task"), creator.toBuffer(), Buffer.from(taskId)],
    PROGRAM_ID
  );
}

export function getEscrowPDA(taskPDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), taskPDA.toBuffer()],
    PROGRAM_ID
  );
}

export function getParticipationPDA(taskPDA: PublicKey, participant: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("participation"), taskPDA.toBuffer(), participant.toBuffer()],
    PROGRAM_ID
  );
}

export function getSubmissionPDA(taskPDA: PublicKey, participant: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("submission"), taskPDA.toBuffer(), participant.toBuffer()],
    PROGRAM_ID
  );
}

export function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, true);
}

export function getEscrowVaultPDA(escrowPDA: PublicKey, mint: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(mint, escrowPDA, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);
}

export { BN, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID };
