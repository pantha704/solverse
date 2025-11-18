use anchor_lang::prelude::*;

#[error_code]
pub enum BountyError {
    #[msg("Task has ended")]
    TaskEnded,
    #[msg("Task not ended yet")]
    TaskNotEnded,
    #[msg("No submissions")]
    NoSubmissions,
    #[msg("Already submitted")]
    AlreadySubmitted,
    #[msg("Not creator")]
    NotCreator,
    #[msg("Invalid winner")]
    InvalidWinner,
    #[msg("Escrow mismatch")]
    EscrowMismatch,
}