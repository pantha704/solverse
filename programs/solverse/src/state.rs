use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Task {
    #[max_len(32)]
    pub task_id: String,
    #[max_len(280)]
    pub description: String,
    pub creator: Pubkey,
    pub reward: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub winner: Option<Pubkey>,
    pub submission_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Submission {
    pub participant: Pubkey,
    pub task: Pubkey,
    #[max_len(100)]
    pub link: String,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    #[max_len(32)]
    pub seed: String,
    pub creator: Pubkey,
    pub reward_tokens: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub winner: Option<Pubkey>,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Participation {
    pub participant: Pubkey,
    pub task: Pubkey,
    pub status: ParticipationStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Eq)]
pub enum ParticipationStatus {
    Accepted,
    Submitted,
    Completed,
}