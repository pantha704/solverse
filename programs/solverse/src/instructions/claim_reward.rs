use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer, CloseAccount};

use crate::errors::BountyError;
use crate::state::{Escrow, Task};

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,
    #[account(
        seeds = [b"task", creator.key().as_ref(), task_id.as_bytes()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,
    #[account(
        mut,
        seeds = [b"escrow", task.key().as_ref()],
        bump = escrow.bump,
        close = creator // Refund rent to creator
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    /// CHECK: This is the creator of the task, used for PDA derivation and to receive rent refund when escrow is closed
    pub creator: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
pub fn _claim_reward(ctx: Context<ClaimReward>, _task_id: String) -> Result<()> {

    let task = &ctx.accounts.task;
    let escrow = &ctx.accounts.escrow;
    let clock = Clock::get()?;

    require!(clock.unix_timestamp >= task.end_time, BountyError::TaskNotEnded);
    require!(Some(ctx.accounts.winner.key()) == task.winner, BountyError::InvalidWinner);
    require!(escrow.winner == Some(ctx.accounts.winner.key()), BountyError::InvalidWinner);
    require!(ctx.accounts.escrow_vault.amount > 0, BountyError::EscrowMismatch);

    // Transfer tokens to winner
    let task_key = task.key();
    let seeds = &[
        b"escrow".as_ref(),
        task_key.as_ref(),
        &[escrow.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_vault.to_account_info(),
        to: ctx.accounts.winner_token_account.to_account_info(),
        authority: ctx.accounts.escrow.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    anchor_spl::token::transfer(cpi_ctx, ctx.accounts.escrow_vault.amount)?;

    // Close vault, send lamports to creator
    let close_accounts = CloseAccount {
        account: ctx.accounts.escrow_vault.to_account_info(),
        destination: ctx.accounts.creator.to_account_info(),
        authority: ctx.accounts.escrow.to_account_info(),
    };
    let close_cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        close_accounts,
        signer_seeds,
    );
    anchor_spl::token::close_account(close_cpi_ctx)?;

    Ok(())
}
