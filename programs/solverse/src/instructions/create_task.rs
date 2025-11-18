use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;

use crate::errors::BountyError;
use crate::state::{Escrow, Task};

#[derive(Accounts)]
#[instruction(task_id: String, duration: i64)]
pub struct CreateTask<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + Task::INIT_SPACE,
        seeds = [b"task", creator.key().as_ref(), task_id.as_bytes()],
        bump,
    )]
    pub task: Box<Account<'info, Task>>,
    /// CHECK: Escrow PDA
    #[account(
        init,
        payer = creator,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", task.key().as_ref()],
        bump
    )]
    pub escrow: Box<Account<'info, Escrow>>,
    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,
    /// CHECK: Vault ATA for escrow
    #[account(
        init,
        payer = creator,
        associated_token::mint = reward_mint,
        associated_token::authority = escrow,
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn _create_task(
    ctx: Context<CreateTask>,
    task_id: String,
    _description: String,  // Still accepting description for compatibility but not storing it
    reward_amount: u64,
    duration: i64,
) -> Result<()> {
    let task = &mut ctx.accounts.task;
    let escrow = &mut ctx.accounts.escrow;
    let clock = Clock::get()?;

    task.task_id = task_id.clone();
    task.creator = ctx.accounts.creator.key();
    task.description = _description;
    task.reward = reward_amount;
    task.start_time = clock.unix_timestamp;
    require!(duration > 0, BountyError::EscrowMismatch);
    task.end_time = clock.unix_timestamp.checked_add(duration).ok_or(BountyError::EscrowMismatch)?;
    task.winner = None;
    task.submission_count = 0;  // Changed from vector to counter
    task.bump = ctx.bumps.task;

    escrow.seed = task_id.clone();
    escrow.creator = ctx.accounts.creator.key();
    escrow.reward_tokens = ctx.accounts.escrow_vault.key();
    escrow.start_time = task.start_time;
    escrow.end_time = task.end_time;
    escrow.winner = None;
    escrow.bump = ctx.bumps.escrow;

    // Transfer reward to escrow vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.creator_token_account.to_account_info(),
        to: ctx.accounts.escrow_vault.to_account_info(),
        authority: ctx.accounts.creator.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, reward_amount)?;

    Ok(())
}