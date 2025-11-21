use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;
use instructions::*;

declare_id!("4kruCJtCQbxT1AQxZprCe7MfBVwFBJKYsdySz8ECPe6p");

#[program]
pub mod solverse {
    use super::*;

    pub fn create_task(
        ctx: Context<CreateTask>,
        task_id: String,
        description: String,
        reward_amount: u64,
        duration: i64,
    ) -> Result<()> {
        _create_task(ctx, task_id, description, reward_amount, duration)
    }

    pub fn accept_task(
        ctx: Context<AcceptTask>,
        task_id: String,
    ) -> Result<()> {
        _accept_task(ctx, task_id)
    }

    pub fn submit_work(
        ctx: Context<SubmitWork>,
        task_id: String,
        link: String,
    ) -> Result<()> {
        _submit_work(ctx, task_id, link)
    }

    pub fn pick_winner(
        ctx: Context<PickWinner>,
        task_id: String,
    ) -> Result<()> {
        _pick_winner(ctx, task_id)
    }

    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        task_id: String,
    ) -> Result<()> {
        _claim_reward(ctx, task_id)
    }

    pub fn refund_escrow(
        ctx: Context<RefundEscrow>,
        task_id: String,
    ) -> Result<()> {
        _refund_escrow(ctx, task_id)
    }

    pub fn close_task(
        ctx: Context<CloseTask>,
        task_id: String,
    ) -> Result<()> {
        _close_task(ctx, task_id)
    }
}
