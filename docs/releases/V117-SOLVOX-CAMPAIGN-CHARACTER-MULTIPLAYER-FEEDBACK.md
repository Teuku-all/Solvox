# Solvox V117 — Campaign Character Lock, Asuka Sprite, Multiplayer, Feedback

- Character selection is shown only before Chapter 1. The selected character is reused for later chapters until all chapters are completed; beginning a new campaign after full completion allows a new selection. Resetting progress unlocks selection again.
- Asuka's supplied animation images load from their actual folders: `idle-asuka`, `attack-asuka`, `hurt-asuka`, and `die-asuka`.
- Multiplayer development mode starts both backend and Vite through `npm run dev`. Vite proxies both `/api` and `/socket.io` to IPv4 loopback. Pending clicks are retained while the socket connects, and room tokens are used for player matching/reconnect.
- Single-player questions allow up to three attempts. Feedback after the second incorrect answer remains visible longer; the third incorrect answer advances the question unless HP reaches zero or the chapter has ended.
- The character picker remains a standalone responsive page. Obsolete nested-modal styles and an unused registry import were removed.

## Checks

- Static regression QA: PASS
- JavaScript/JSX syntax check: PASS (46 files)
- Local relative-import check: PASS (0 missing)
- Asuka animation path check: PASS (32 paths, 0 missing)
- Legacy V45–V110 documentation cleanup: PASS
- Full Vite build could not run in the authoring environment because `vite` is not installed in the partial dependency tree. Install dependencies with `npm ci` before building/running the game.
