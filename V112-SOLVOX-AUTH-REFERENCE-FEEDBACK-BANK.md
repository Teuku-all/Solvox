# Solvox — Login Removal + Bilingual Feedback Bank

## Login / Account
The Register / Log In screen has been removed from the active application flow.
- The game opens directly to Home.
- Single-player progress and profile data stay on the user's device.
- Multiplayer sockets and feedback/evaluation endpoints no longer require account authentication.
- Account-only frontend/backend modules are no longer part of the active project.

## Feedback Bank
The project now bundles both:
- `docs/feedback-bank/BANK FEEDBACK SOLVOX.xlsx` — Indonesian source.
- `docs/feedback-bank/BANK FEEDBACK SOLVOX EN.xlsx` — supplied English source.

Runtime file: `frontend/src/data/feedbackBank.js`

Bank coverage: 195 feedback rows across 50 questions for each language.

Matching rule:
1. Match by question id.
2. Normalize the player's answer numerically.
3. Support decimal comma/dot formats, fractions such as `5/3`, and Rupiah values in both localized styles.
4. When a bank row matches, show the bank feedback and use the bank error type as the mistake tag.
5. When no row matches, use the neutral fallback for the selected language.
6. Matched/unmatched attempts remain in the question log through `feedbackBankHistory`, `feedbackBankMatched`, `feedbackBankCode`, `feedbackBankRow`, and `unregisteredFeedbackAnswer`.

Language behavior:
- Indonesian mode uses the Indonesian bank.
- English mode uses the English bank.
- The English UI never falls back to Indonesian bank text.

## AI feedback
Gemini/API-key feedback is not part of the active game flow.
