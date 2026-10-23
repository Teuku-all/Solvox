# Solvox — Character stories and faster artwork

- Kazura and Asuna now have distinct stories in Indonesian and English. Character details use a flowing panel with consistent, readable text on desktop and phones.
- Menu and selection images have responsive WebP variants. `scripts/optimize-assets.cjs` generates these images, content-hashed URLs, and sprite foot anchors automatically before frontend development and production builds. Keep the supplied originals when replacing artwork.
- The first selection pose loads before the rest of its animation and is shared across previews. Sprite alignment no longer scans image pixels on the player's device.
- Menu backgrounds show a lightweight poster first and defer video. Slow connections, data saving, and reduced motion keep the still image. Optimized artwork uses long-lived cache headers on Vercel and the Node server.

# Solvox V117 — Campaign Character Lock, Asuka Sprite Fix, Multiplayer Reliability

- Character selection is offered on Chapter 1 only and remains locked across the campaign. It becomes available again after all chapters are cleared; resetting progress restores the default choice.
- Asuka animation files are loaded from their actual supplied folders (`idle-asuka`, `attack-asuka`, `hurt-asuka`, `die-asuka`) without duplicating image files.
- Multiplayer now proxies Socket.IO requests to IPv4 loopback in Vite development, surfaces connection errors, preserves the first action while the socket connects, fixes current-player token matching, and supports reconnecting to the active room.
- Single-player allows up to three attempts per question. Wrong-answer feedback after the second attempt remains visible longer; a third incorrect answer advances to the next question unless the player's HP reaches zero or the chapter has ended.
- Legacy V114 modal-only CSS was removed; the standalone character selection screen uses a more polished responsive card layout.

For local use, run `npm run start:local` to build and start Solvox, or `npm run dev` for the Vite development server. For production hosting, use the build/start commands and persistence notes in [DEPLOYMENT.md](DEPLOYMENT.md). The Node server serves the frontend, API, and multiplayer Socket.IO connection from the same origin. Run `npm run qa` for static regression checks.

---

## Latest UI
- Login/Register has been removed. Solvox now opens directly into the game and stores player progress locally on the device.

# Solvox V102

Perubahan V102 berfokus pada polish icon Settings dan penambahan Tutorial/Panduan pada Home, dengan responsive portrait tetap menggunakan satu sumber `responsive-v102.css`.

Jalankan dari folder project:

```bash
npm start
```

QA cepat:

```bash
npm run qa
```


## V105 — Mobile, Sound, Evaluation, Feedback, Bot

- Mobile battle/multiplayer surfaces tightened for portrait screens.
- Sound effects with a Settings toggle.
- Single-player hint costs progress 5/10/15 HP; multiplayer turn hints cost 5/10 HP.
- Evaluation redesigned as summary-first with two-column stats, accuracy bar, and collapsible full-question details.
- Evaluation labels are bilingual and do not expose source filenames.
- Multiplayer adds an optional server-side Bot mode for turn and score duels.
- Wrong-answer feedback remains in a visible top banner and currently uses the bundled local question feedback.


## V108 — Gemini AI Battle Feedback (superseded)

The previous Gemini integration is no longer part of the active game flow. Battle feedback is currently deterministic/local and will be replaced by the supplied feedback bank when it is provided.


## V112+ — Login Removal + Bilingual Feedback Bank

- Login/Register is removed from the active game flow; the game opens directly.
- Single-player progress, player name, language, and evaluation history remain local to the device.
- Multiplayer no longer requires an account/session token.
- The Indonesian feedback bank and the supplied English feedback bank are both bundled in `frontend/src/data/feedbackBank.js` (195 rows across 50 questions).
- Wrong-answer matching uses question id + normalized numeric answer, including localized decimals, fractions, and Rupiah values.
- When the language is Indonesian, the Indonesian bank feedback is shown; when the language is English, the English bank feedback is shown.
- Unlisted wrong answers use the matching neutral fallback for the selected language.
- Matched feedback details are stored in the question log so evaluation can distinguish bank-covered and unlisted mistakes.

