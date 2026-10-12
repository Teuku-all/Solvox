# V116 — Solvox chapter flow fix

- Replaced the V114/V115 nested chapter-modal transition with an explicit application route: Chapter Select → Character Select → Battle.
- Chapter cards now notify `App` to change the active screen before character selection is rendered.
- Character selection has its own screen and an explicit Back/Start flow, removing the previous local-modal/global-screen transition collision.
- Added launch guard to prevent duplicate Battle starts.
- Battle HUD now correctly uses the selected player's portrait instead of always falling back to Traveler.
- Kept Traveler + Asuka and all existing animation assets intact.
