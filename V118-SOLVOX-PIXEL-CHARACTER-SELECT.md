# V118 — Pixel-art Character Select

- Reworked the existing single-player character select screen to follow the supplied pixel-art reference: near-black backdrop, gold pixel-display heading, gold/yellow framed portrait card, side character previews, left/right navigation and a GAME START / YES / NO confirmation row.
- Reused the existing Traveler and supplied Asuka portrait assets. The two-character carousel wraps between both characters and supports arrow buttons, clickable side previews, and left/right keyboard navigation while a carousel control has focus.
- Added Indonesian and English labels for the title, game-start prompt, yes/no actions, and accessible carousel navigation labels.
- `YES` starts Chapter 1 with the currently selected character. `NO`/Back returns to chapter select without launching a battle. Existing one-character-choice-per-campaign persistence remains owned by `App` and is unchanged.
- Removed the now-unused V114/V116 character picker/page CSS before adding V118 styles, rather than layering the new layout on top of the previous grid.

## Validation

- `npm run qa`: PASS.
- JS/JSX syntax transpilation: 48 files checked, PASS.
- Required Traveler portrait, Asuka portrait, and display font assets: present.
- Character select stylesheet brace balance: PASS; obsolete picker selectors removed.
- A full Vite production build was not run because Vite is not installed in this working environment. Run `npm ci` followed by `npm run build` in a Node 18+ environment for the production build check.
