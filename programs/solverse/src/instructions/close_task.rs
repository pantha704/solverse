use anchor_lang::prelude::*;

use crate::errors::BountyError;
use crate::state::Task;

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct CloseTask<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        seeds = [b"task", creator.key().as_ref(), task_id.as_bytes()],
        bump = task.bump,
        close = creator
    )]
    pub task: Account<'info, Task>,
}
pub fn _close_task(ctx: Context<CloseTask>, _task_id: String) -> Result<()> {

    let task = &ctx.accounts.task;
    let clock = Clock::get()?;

    require!(clock.unix_timestamp >= task.end_time, BountyError::TaskNotEnded);

    Ok(())
}
