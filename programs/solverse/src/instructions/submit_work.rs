use anchor_lang::prelude::*;

use crate::errors::BountyError;
use crate::state::{Submission, Task};

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct SubmitWork<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,
    /// CHECK: For PDA derivation
    pub creator: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"task", creator.key().as_ref(), task_id.as_bytes()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,
    #[account(
        init,
        payer = participant,
        space = 8 + Submission::INIT_SPACE,
        seeds = [b"submission", task.key().as_ref(), participant.key().as_ref()],
        bump
    )]
    pub submission: Account<'info, Submission>,
    pub system_program: Program<'info, System>,
}

pub fn _submit_work(
    ctx: Context<SubmitWork>,
    _task_id: String,
    link: String,
) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let submission = &mut ctx.accounts.submission;
    let clock = Clock::get()?;

    require!(clock.unix_timestamp < task.end_time, BountyError::TaskEnded);

    // Verify that the task creator matches the creator passed in (for PDA derivation)
    require!(
        task.creator == ctx.accounts.creator.key(),
        BountyError::NotCreator
    );

    submission.participant = ctx.accounts.participant.key();
    submission.task = task.key();
    submission.link = link;
    submission.bump = ctx.bumps.submission;

    // Increment submission counter instead of pushing to vector
    task.submission_count = task.submission_count.checked_add(1).ok_or(BountyError::EscrowMismatch)?;

    Ok(())
}
