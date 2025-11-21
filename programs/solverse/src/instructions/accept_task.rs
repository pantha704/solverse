use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct AcceptTask<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,

    /// CHECK: Needed for task seeds derivation
    pub creator: UncheckedAccount<'info>,

    #[account(
        seeds = [b"task", creator.key().as_ref(), task_id.as_bytes()],
        bump = task.bump,
    )]
    pub task: Account<'info, Task>,

    #[account(
        init,
        payer = participant,
        space = 8 + Participation::INIT_SPACE,
        seeds = [b"participation", task.key().as_ref(), participant.key().as_ref()],
        bump
    )]
    pub participation: Account<'info, Participation>,

    pub system_program: Program<'info, System>,
}

pub fn _accept_task(ctx: Context<AcceptTask>, _task_id: String) -> Result<()> {
    let participation = &mut ctx.accounts.participation;
    participation.participant = ctx.accounts.participant.key();
    participation.task = ctx.accounts.task.key();
    participation.status = ParticipationStatus::Accepted;
    participation.bump = ctx.bumps.participation;

    Ok(())
}
