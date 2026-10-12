# V111 — Account UI polish + Gemini removed / feedback bank ready

- Register/Login UI rebuilt with a richer Solvox fantasy frame, character artwork, clearer account sections, password strength feedback, password-match state, responsive mobile layout, and bilingual labels.
- Gemini API feedback has been removed from the active game flow.
- Removed the frontend Gemini adapter, the `/api/ai-feedback` backend route, local Gemini env template, and active README setup instructions.
- Battle mistake feedback now stays deterministic and local using the question's existing feedback/explanation data.
- The feedback-bank integration is intentionally deferred until the bank is supplied. No assumptions were made about the future bank schema.
- Account registration, login, persistent player identity, and per-user progress remain unchanged.
