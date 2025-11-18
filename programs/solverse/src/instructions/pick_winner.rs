use anchor_lang::prelude::*;

use crate::errors::BountyError;
use crate::state::{Escrow, Submission, Task};

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct PickWinner<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        seeds = [b"task", creator.key().as_ref(), task_id.as_bytes()],
        bump = task.bump
    )]
    pub task: Box<Account<'info, Task>>,

    #[account(
        seeds = [b"submission", task.key().as_ref(), participant.key().as_ref()],
        bump = submission.bump
    )]
    pub submission: Box<Account<'info, Submission>>,
    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    /// CHECK: Participant account for PDA verification
    pub participant: AccountInfo<'info>,
}

pub fn _pick_winner(ctx: Context<PickWinner>, _task_id: String) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let escrow = &mut ctx.accounts.escrow;
    let submission = &ctx.accounts.submission;
    let clock = Clock::get()?;

    require!(clock.unix_timestamp >= task.end_time, BountyError::TaskNotEnded);
    require!(task.winner.is_none(), BountyError::InvalidWinner);

    // Verify submission belongs to this task
    require!(submission.task == task.key(), BountyError::InvalidWinner);
    // We no longer check if it's in the submissions vector since we're using a counter now

    task.winner = Some(ctx.accounts.participant.key());
    escrow.winner = Some(ctx.accounts.participant.key());

    Ok(())
}
