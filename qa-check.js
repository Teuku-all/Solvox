const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const must = (condition, message) => {
  if (!condition) throw new Error(message);
};

const app = read('frontend/src/App.jsx');
const home = read('frontend/src/components/menu/HomeMenu.jsx');
const modes = read('frontend/src/components/menu/ModeSelect.jsx');
const chapters = read('frontend/src/components/menu/ChapterSelect.jsx');
const settings = read('frontend/src/components/menu/Settings.jsx');
const utilityArt = read('frontend/src/components/shared/SolvoxUtilityArt.jsx');
const profile = read('frontend/src/components/menu/ProfilePanel.jsx');
const battle = read('frontend/src/components/battle/Battle.jsx');
const battlePanel = read('frontend/src/components/battle/BattleQuestionPanel.jsx');
const singlePlayerGame = read('backend/singlePlayerGame.js');
const combatStage = read('frontend/src/components/battle/CombatStage.jsx');
const server = read('server.js');
const apiServer = read('backend/server.js');
const icon = read('frontend/src/components/shared/PixelIcon.jsx');
const keypad = read('frontend/src/components/battle/Keypad.jsx');
const multi = read('frontend/src/components/multiplayer/Multiplayer.jsx');
const evaluation = read('frontend/src/components/screens/Evaluation.jsx');
const feedback = read('frontend/src/components/menu/Feedback.jsx');
const gameMeta = read('frontend/src/config/game.js');
const i18n = read('frontend/src/services/i18n.js');
const css = read('frontend/src/styles/base.css');
const ui42 = read('frontend/src/styles/shared-surfaces.css');
const chapterCss = read('frontend/src/styles/chapter-select.css');
const battleCss = read('frontend/src/styles/battle.css');
const levels = read('frontend/src/data/levels.js');
const backgrounds = read('frontend/src/config/backgrounds.js');
const responsive105 = read('frontend/src/styles/responsive.css');
const englishQuestions = JSON.parse(fs.readFileSync(path.join(root, 'backend/solvoxQuestions.en.json'), 'utf8'));
const main = read('frontend/src/main.jsx');
const pkg = require('./package.json');

/* -------------------------------------------------------------------------- */
/* Application routing / Home                                                */
/* -------------------------------------------------------------------------- */
must(
  app.includes('ProfilePanel') &&
    app.includes('HomeMenu') &&
    app.includes('ModeSelect'),
  'Main routing components missing',
);
must(!app.includes('MathActivities') && !app.includes("screen==='activities'") && !app.includes('activityLogs:'), 'Legacy Math Lab wiring still present');
must(app.includes('summarizePerformance(result).mastery'), 'Completed runs do not persist mastery');
must(
  !home.includes("id: 'activities'") &&
    home.includes("id: 'settings'") &&
    home.includes("id: 'feedback'"),
  'Home navigation still exposes the retired Math Lab or is missing core controls',
);
must(!home.includes("id: 'multi'") && !home.includes('nav-multiplayer-icon.png'), 'Multiplayer must not be exposed directly on home');
must(!home.includes('onChangeLang') && !home.includes("lang==='id'?'EN':'ID'"), 'Home language switch should be moved to Settings');
must(!home.includes('home-v31-chapter-row') && !home.includes('home-v31-next-banner'), 'Removed Home chapter/overflow panel is still referenced');
must(!home.includes('SpriteCharacter') && !home.includes('home-v31-character'), 'Home character should be removed from Home');
must(home.includes('home-menu') && home.includes("id: 'play'") && home.includes("id: 'tutorial'") && home.includes("labelKey: 'homeMain'") && home.includes("labelKey: 'homeTutorial'") && home.includes("labelKey: 'homeDashboard'") && home.includes("labelKey: 'homeSettings'") && home.includes("labelKey: 'homeFeedback'"), 'V103 Home menu is missing one or more core text navigation items');
must(!home.includes('SolvoxUtilityArt') && !home.includes('home-v31') && !home.includes('homeHeroTitle') && !home.includes('continueAdventure') && !home.includes('viewProfile'), 'Legacy Home icon/hero implementation remains in HomeMenu');
must(home.includes('onTutorial') && home.includes("id: 'tutorial'"), 'Home tutorial entry point is missing');
must(exists('frontend/src/components/menu/Tutorial.jsx') && read('frontend/src/components/menu/Tutorial.jsx').includes('tutorial-title') && read('frontend/src/components/menu/Tutorial.jsx').includes('tutorialGotIt'), 'Tutorial component is missing or incomplete');

/* -------------------------------------------------------------------------- */
/* Main mode selection / learning surfaces                                   */
/* -------------------------------------------------------------------------- */
must(
  modes.includes('singleModeDesc') &&
    modes.includes('multiModeDesc') &&
    modes.includes('onSingle') &&
    modes.includes('onMulti'),
  'Main mode selector missing single/multiplayer cards',
);
must(
  app.includes("onSingle={()=>setScreen('chapters')}") &&
    app.includes("screen==='chapters'") &&
    chapters.includes('chooseChapter'),
  'Single Player must route to a dedicated chapter selector',
);
must(!exists(path.join(root, 'frontend/src/components/MathActivities.jsx')), 'Legacy MathActivities component still present');
must(
  settings.includes('language-switch--legacy') &&
    settings.includes('onChangeLang') &&
    app.includes('onChangeLang={changeLang}'),
  'Language selector must be wired to App state',
);

/* -------------------------------------------------------------------------- */
/* Profile / backend                                                          */
/* -------------------------------------------------------------------------- */
must(profile.includes('/api/player-profile') && profile.includes("t('recentRuns')"), 'Player profile is not data-driven');
must(server.includes("require('./backend/server')") && apiServer.includes("app.get('/api/player-profile'"), 'Player profile API endpoint missing');

/* -------------------------------------------------------------------------- */
/* Battle behavior                                                            */
/* -------------------------------------------------------------------------- */
must(!battle.includes('setPaused') && !battle.includes('rpg-pause-v29'), 'Battle pause control should be removed');
must(battle.includes('battle-home-back') && !battle.includes('battle-feedback-top-v36'), 'Battle back/feedback controls are inconsistent');
must(JSON.parse(read('backend/solvoxQuestions.json')).length === 50 && singlePlayerGame.includes('getChapterQuestions'), 'Backend must own the complete single-player question pack');
must(battle.includes('verdict.feedback') && singlePlayerGame.includes('FALLBACK_FEEDBACK'), 'Server-provided answer feedback must resolve for single-player Battle');
must(battle.includes('{feedback.message}') && battle.includes('battle-mistake-copy'), 'Question-specific feedback must render inside the V41 mistake banner');
must(battlePanel.includes('hint-rail') && battlePanel.includes('hint-reveal-btn'), 'Contextual hint rail is missing');
must(!battlePanel.includes('hint-btn-v23') && !battlePanel.includes('hint-panel-v23'), 'Hint must not render inside the question panel');
must(battlePanel.includes('keypad-toggle') && battlePanel.includes('attempts'), 'Question panel controls missing');
must(battlePanel.includes('QUESTION_PANEL_THEME_BY_LEVEL') && battlePanel.includes('style={panelTheme}'), 'Chapter-aware question panel theme wiring is missing');
must(!battlePanel.includes('feedback-panel'), 'Learning feedback must not expand inside the question panel');
must(battle.includes('battle-top-rail') && battle.includes('hp-card') && battle.includes('hp-track'), 'Battle HUD missing');
must(battle.includes('getBossImpactMs') && battle.includes('bossAttackImpactMs'), 'Boss attack impact timing is not synchronized with the selected boss asset');
must(combatStage.includes('getBoundingClientRect') && combatStage.includes('getDistance') && combatStage.includes('bossRect.left - playerRect.right'), 'Real attack distance calculation missing');
must(!battle.includes('finalizeQuestion'), 'Unused finalizeQuestion helper remains');
must(!battle.includes('<BattleQuestionPanel') || !battle.slice(battle.indexOf('<BattleQuestionPanel')).includes('feedback={feedback}'), 'Dead feedback prop remains on question panel');

/* -------------------------------------------------------------------------- */
/* Battle styling ownership / cleanup                                         */
/* -------------------------------------------------------------------------- */
must(main.includes("import './styles/battle.css';"), 'Dedicated Battle V43 stylesheet is not wired into main');
must(
  battleCss.includes('.battle-question-panel') &&
    battleCss.includes('margin: 0;') &&
    battleCss.includes('grid-template-columns: minmax(0, 1.62fr)') && battleCss.includes('.question-content') && battleCss.includes('.question-answer') &&
    battleCss.includes('rgba(110, 213, 201'),
  'Clean Battle question dock styling is missing',
);
must(!battlePanel.includes('question-copy-v65') && !battleCss.includes('question-copy-v65'), 'Retired V65 question wrapper still exists');
must(!battleCss.includes('stage-frame-clean.png'), 'Question panel still depends on decorative stage frame asset');
for (const legacy of [
  'battle-ui-v24',
  'battle-ui-v23',
  'battle-v23',
  'battle-top-rail-v23',
  'battle-question-panel-v23',
  'combat-stage-v24',
  'rpg-pause-v29',
  'pause-overlay-v29',
]) {
  must(!css.includes(`.${legacy}`), `Legacy selector remains in base.css: ${legacy}`);
  must(!ui42.includes(`.${legacy}`), `Legacy selector remains in shared-surfaces.css: ${legacy}`);
}
must(!ui42.includes('.home-v31-next-banner'), 'Removed Home overflow banner style remains in shared-surfaces.css');
must(!ui42.includes('html,body,#root{width:100%;height:100%;overflow:hidden}'), 'Legacy fixed viewport overflow rule remains in shared-surfaces.css');
must(!ui42.includes('.app-shell{height:100dvh;min-height:100dvh;overflow:hidden}'), 'Legacy fixed app-shell overflow rule remains in shared-surfaces.css');
must(/html,\s*body,\s*#root/.test(responsive105) && responsive105.includes('overflow-y: auto !important') && responsive105.includes('touch-action: pan-y'), 'Mobile document scroll contract is missing');
must(main.includes("import './styles/home-menu.css';") && main.includes("import './styles/tutorial.css';"), 'V103 Home/tutorial styles are not wired into main');
must(main.includes("import './styles/responsive.css';") && exists('frontend/src/styles/tutorial.css') && !exists('frontend/src/styles/responsive-v101.css') && responsive105.includes('.battle-reference') && responsive105.includes('mobile document-scroll contract'), 'V103 responsive portrait layer is not wired correctly');
must(responsive105.includes('.mode-select') && responsive105.includes('overflow: visible !important') && responsive105.includes('height: auto !important'), 'Mobile mode selector must use natural vertical scrolling');
must(responsive105.includes('.chapter-select') && responsive105.includes('overflow: visible !important') && responsive105.includes('min-height: 0 !important'), 'Mobile chapter selector must use natural vertical scrolling');
must(responsive105.includes('.battle-reference-arena') && responsive105.includes('touch-action: pan-y') && responsive105.includes('.settings-head') && responsive105.includes('filter:none!important'), 'V103 responsive battle/mobile/settings layer is incomplete');
must(!exists('frontend/src/components/OrientationNotice.jsx') && !main.includes('OrientationNotice'), 'Legacy orientation blocker remains after portrait-responsive update');
must(Array.isArray(englishQuestions) && englishQuestions.length === 50 && englishQuestions.every(q => q.text && q.feedback && Array.isArray(q.hints) && q.hints.length === 3), 'English question pack must contain 50 complete questions');
const frontendSinglePlayer = read('frontend/src/services/singlePlayerGame.js');
must(frontendSinglePlayer.includes("const locale = lang === 'en' ? 'en' : 'id'") && frontendSinglePlayer.includes('questionsByLanguage[locale]') && frontendSinglePlayer.includes('fallbackFeedback[locale]') && singlePlayerGame.includes("lang === 'en' ? 'en' : 'id'"), 'Single-player question and answer services must support English and Indonesian');
must(read('backend/question-generator.js').includes('packEn') && read('backend/question-generator.js').includes("lang === 'en' ? packEn : packId"), 'Multiplayer question generator is not language-aware');
must(read('frontend/src/services/solvoxEvaluation.js').includes('CHAPTER_RULES_EN') && read('frontend/src/services/solvoxEvaluation.js').includes("result.lang === 'en'"), 'English chapter evaluation rules are missing');
must(!css.includes('.home-v31') && !ui42.includes('.home-v31'), 'Legacy V31 Home CSS remains after the V77 rewrite');
must(!read('frontend/src/styles/font-display.css').includes('home-menu-v77') && !responsive105.includes('home-menu-v77'), 'Retired V77 Home selectors remain in shared styles');
must(exists('frontend/src/components/shared/SolvoxBrandLogo.jsx') && exists('frontend/src/styles/brand-logo.css') && main.includes("import './styles/brand-logo.css';") && read('frontend/src/components/shared/SolvoxBrandLogo.jsx').includes('solvox-logo-v89.png'), 'Solvox V89 image logo is missing or not wired');
    must(!exists('frontend/public/assets/ui/brand/solvox-wordmark-v83.svg') && !exists('frontend/src/components/SolvoxHtmlLogo.jsx') && !exists('frontend/src/styles/solvox-logo-v83.css'), 'Retired V83 logo implementation remains');
must(!exists('frontend/public/assets/ui/brand/solvox-logo.png'), 'Retired image-based Solvox logo remains');
must(!exists('frontend/public/assets/ui/utility/icons/main.png') && !exists('frontend/public/assets/ui/utility/art/main.png'), 'Retired Main utility art remains');
must(main.includes("import './styles/chapter-select.css';") && chapters.includes('chapter-card') && chapterCss.includes('.chapter-card-art'), 'Current chapter art UI is not wired to a dedicated stylesheet');
must(levels.includes("art:'/assets/ui/chapters/chapter-1.png'") && levels.includes("art:'/assets/ui/chapters/chapter-5.png'"), 'Chapter artwork metadata missing');
for (let id = 1; id <= 5; id += 1) must(exists(`frontend/public/assets/ui/chapters/chapter-${id}.png`), `Chapter ${id} artwork asset missing`);
must(
  backgrounds.includes("3: { type:'video'") &&
    backgrounds.includes("/assets/backgrounds/level3/chapter3-arena-4x1.mp4") &&
    backgrounds.includes("chapter3-video-poster-4x1.jpg") &&
    backgrounds.includes("scale:1.0"),
  'Chapter 3 supplied video background is not wired',
);
must(exists('frontend/public/assets/backgrounds/level3/chapter3-arena-4x1.mp4'), 'Chapter 3 video background asset is missing');
must(exists('frontend/public/assets/backgrounds/level3/chapter3-video-poster-4x1.jpg'), 'Chapter 3 video poster is missing');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-battle-4x1.png'), 'Retired Chapter 3 image background remains');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-arena.mp4'), 'Retired Chapter 3 video remains');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-video-poster.jpg'), 'Retired Chapter 3 poster remains');
must(!exists('frontend/public/assets/backgrounds/level3/background.mp4'), 'Retired Chapter 3 video asset remains');
must(!exists('frontend/public/assets/backgrounds/level3/background.png'), 'Retired Chapter 3 poster remains');
must(!chapters.includes('chapter-emblem-') && !chapterCss.includes('chapter-emblem-v43') && !ui42.includes('chapter-emblem-v43'), 'Retired chapter emblem implementation remains');

/* -------------------------------------------------------------------------- */
/* i18n / assets / data                                                       */
/* -------------------------------------------------------------------------- */
must(
  !i18n.includes('mathActivities') &&
    i18n.includes('chooseMode') &&
    i18n.includes('languageEnglish'),
  'Bilingual translation keys missing or retired Math Lab keys remain',
);
must(exists('frontend/public/assets/home/home-background-v83.mp4') && read('frontend/src/components/menu/HomeMenu.jsx').includes('home-background-v83.mp4'), 'V83 Home background video is missing or not wired');
must(read('frontend/src/components/menu/ModeSelect.jsx').includes('home-background-v83.mp4') && read('frontend/src/components/menu/ModeSelect.jsx').includes('home-background-v83-poster.jpg'), 'Mode selection is not sharing the Home background video');
must(!exists('frontend/public/assets/home/home-background.gif'), 'Unused home GIF should be removed');
must(!exists('frontend/public/assets/characters/wanderer'), 'Legacy Wanderer player asset folder remains');
must(!exists('frontend/public/assets/ui/reference/player-avatar-portrait.png'), 'Legacy player portrait remains');
must(!exists('frontend/public/assets/characters/wanderer_BACKUP_V24.2'), 'Unused backup sprite folder should be removed');
must(!exists('frontend/public/assets/ui/reference/pause.png'), 'Unused pause raster should be removed');
must(pkg.version === '4.3.0', 'Root package version changed unexpectedly');
must(exists('frontend/src/styles/battle.css'), 'Dedicated Battle stylesheet missing');
must(keypad.includes("'²'") && keypad.includes("'fraction'") && keypad.includes("'a'") && keypad.includes("'z'"), 'Math keypad revision missing');
must(multi.includes('turn:hint') && multi.includes('viewSolution') && multi.includes('tieBreakHintRule'), 'Multiplayer hint support missing');
must(apiServer.includes("socket.on('turn:hint'") && apiServer.includes('hintsUsed') && apiServer.includes('finishSummary'), 'Multiplayer hint/tie-break tracking missing');
must(feedback.includes('PixelIcon'), 'Feedback icon import missing');
must(evaluation.includes('eval-detail') && evaluation.includes('eval-question-full') && evaluation.includes('evalStrengthsTitle'), 'V105 evaluation learning layer missing');
must(gameMeta.includes("title: 'Solvox'") && gameMeta.includes("shortTitle: 'Solvox'"), 'Game branding config missing');
must(read('frontend/index.html').includes('/assets/ui/brand/solvox-logo-v89.png'), 'V89 favicon is not wired');


/* -------------------------------------------------------------------------- */
/* V105 audio / evaluation / bot / mobile contract                            */
/* -------------------------------------------------------------------------- */
must(exists('frontend/src/services/sound.js') && read('frontend/src/services/sound.js').includes("playSound('correct'") || exists('frontend/src/services/sound.js'), 'Sound service missing');
must(settings.includes("t('sound')") && settings.includes('setSoundEnabled'), 'Sound toggle is not wired into Settings');
must(battle.includes('q.feedback') && !battle.includes('enhanceFeedback') && !exists('frontend/src/services/aiFeedback.js'), 'Gemini feedback integration should be removed; local question feedback remains active');
must(exists('backend/feedbackBank.id.json') && exists('backend/feedbackBank.en.json') && singlePlayerGame.includes('feedbackMatch') && battle.includes('validateChapterAnswer'), 'Single-player answers and feedback must be resolved by the backend');
must(evaluation.includes('eval-detail') && evaluation.includes('eval-question-full') && evaluation.includes('eval-summary-block'), 'V105 evaluation accordion/detail layout is missing');
must(!read('frontend/src/services/solvoxEvaluation.js').includes("Keep Building"), 'Legacy English-only evaluation label remains');
must(!evaluation.includes('EVALUASI SOAL SOLVOX.docx'), 'Evaluation UI leaks source filename');
must(multi.includes('playVsBot') && multi.includes('create(true)') && multi.includes('isBot'), 'Multiplayer bot mode UI is missing');
must(apiServer.includes('botSubmitTurn') && apiServer.includes('botSubmitScore') && apiServer.includes('isBot'), 'Multiplayer bot backend is missing');
must(apiServer.includes('const cost=5*level') && apiServer.includes('HINT_NOT_ENOUGH_HP'), 'Multiplayer hint HP costs are missing');
must(battle.includes('[5, 10, 15]') && battlePanel.includes('hintCost,') || battlePanel.includes('hintCost'), 'Single-player hint cost progression is missing');
must(main.includes("import './styles/evaluation.css';") && main.includes("import './styles/responsive.css';"), 'V105 style layers are not wired');
must(!exists('frontend/src/styles/responsive-v102.css'), 'Retired responsive V102 stylesheet remains');

const playerAssets = read('frontend/src/data/playerAssets.js');
const playerData = read('frontend/src/data/player.js');
must(playerAssets.includes("base: '/assets/characters/kazura'"), 'Traveler asset registry missing');
must(playerAssets.includes("idle: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png']"), 'Traveler idle registry incomplete');
must(playerAssets.includes("attack: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png','07.png']"), 'Traveler attack registry incomplete');
must(playerData.includes("id: ACTIVE_PLAYER_ID") && playerData.includes("name: 'Kazura'"), 'Active player identity missing');
must(!exists('frontend/src/data/wanderer.js'), 'Legacy Wanderer player data module remains');

const expectedPlayerFrames = {
  idle: 6,
  attack: 7,
  hurt: 5,
  die: 6,
};
for (const [state, expected] of Object.entries(expectedPlayerFrames)) {
  const stateDir = path.join(root, 'frontend/public/assets/characters/kazura', state);
  const frames = fs.existsSync(stateDir)
    ? fs.readdirSync(stateDir).filter((file) => file.endsWith('.png')).sort()
    : [];
  must(
    frames.length === expected,
    `traveler ${state} pack incomplete: expected ${expected} PNG frames, found ${frames.length}`,
  );
}

const bossMonster = read('frontend/src/components/battle/BossMonster.jsx');

/* -------------------------------------------------------------------------- */
/* Boss renderer syntax regression guard                                     */
/* -------------------------------------------------------------------------- */
function checkBalancedDelimiters(source, fileName) {
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  let state = 'code';
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; i += 1; continue; }
      if (ch === '/' && next === '*') { state = 'block'; i += 1; continue; }
      if (ch === '\"' || ch === "'" || ch === '`') { state = ch; continue; }
      if ('([{'.includes(ch)) stack.push(ch);
      else if (')]}'.includes(ch)) {
        if (stack[stack.length - 1] !== pairs[ch]) {
          throw new Error(`${fileName}: mismatched delimiter '${ch}' near character ${i}`);
        }
        stack.pop();
      }
      continue;
    }

    if (state === 'line') {
      if (ch === '\n') state = 'code';
      continue;
    }

    if (state === 'block') {
      if (ch === '*' && next === '/') { state = 'code'; i += 1; }
      continue;
    }

    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === state) state = 'code';
  }

  must(stack.length === 0, `${fileName}: unclosed delimiter(s): ${stack.join(' ')}`);
}

checkBalancedDelimiters(bossMonster, 'frontend/src/components/battle/BossMonster.jsx');
must(
  (bossMonster.match(/useImperativeHandle\(ref, \(\) => \({/g) || []).length === 2 &&
    bossMonster.includes('}), [boss]);') &&
    !bossMonster.includes('}, [boss]);'),
  'Boss renderer imperative-handle syntax is malformed',
);

const spriteCharacter = read('frontend/src/components/battle/SpriteCharacter.jsx');
checkBalancedDelimiters(spriteCharacter, 'frontend/src/components/battle/SpriteCharacter.jsx');
must(!combatStage.includes('vs-badge-v43') && !combatStage.includes('combat-center-v43'), 'Decorative VS arena marker still exists');
must(spriteCharacter.includes('visualScale') && spriteCharacter.includes('parentElement?.getBoundingClientRect().width'), 'Player canvas is not responsive to fighter wrapper width');
must(bossMonster.includes('visualScale') && bossMonster.includes('canvas.parentElement?.getBoundingClientRect()'), 'Boss canvas is not responsive to fighter wrapper dimensions');
must(responsive105.includes('.battle-reference-arena') && responsive105.includes('height: 27dvh') && responsive105.includes('@media (max-width: 420px)'), 'V99 mobile battle sizing rules are missing');
must(!responsive105.includes('.vs-badge-v43'), 'Responsive stylesheet still references removed VS badge');

must(main.includes("import './styles/visual-cohesion.css';") && exists('frontend/src/styles/visual-cohesion.css'), 'V93 visual refinement stylesheet is not wired');
  must(main.includes("import './styles/typography-modals.css';") && exists('frontend/src/styles/typography-modals.css'), 'V96 polish stylesheet is not wired');
must(exists('frontend/src/styles/responsive.css') && !exists('frontend/src/styles/responsive-v102.css') && !exists('frontend/src/styles/responsive-v101.css') && !exists('frontend/src/styles/responsive-v94.css') && !exists('frontend/src/styles/responsive-v93.css'), 'Responsive source cleanup is incomplete');
must(multi.includes('home-background-v83.mp4') && multi.includes('multi-home-bg'), 'Multiplayer Home background video is not wired');
must(profile.includes('profile-screen-back" type="button" onClick={onClose}') && profile.includes('profile-screen-close profile-close-btn" type="button" onClick={onClose}') && profile.includes("if(e.key==='Escape')onClose()"), 'Profile back, close, or Escape dismissal is missing');
must(settings.includes('settings-about-row') && settings.includes('settings-close-btn') && !settings.includes('success'), 'Settings V96 about/close cleanup is incomplete');
must(battlePanel.includes('is-story-chapter'), 'Story chapter class is missing');
must(exists('frontend/src/components/menu/AboutDevelopers.jsx') && main.includes("import './styles/typography-modals.css';"), 'About Us page/style is not wired');
must(app.includes("screen==='about'&&<AboutDevelopers") && app.includes('onAboutUs'), 'About Us navigation is not wired through App');
must(utilityArt.includes("back: '/assets/ui/utility/icons/back-v82.webp'") && utilityArt.includes("close: '/assets/ui/utility/icons/close-v96.png'"), 'Back/close icon routing is incorrect');
must(exists('frontend/public/assets/ui/utility/icons/back-v82.webp') && exists('frontend/public/assets/ui/utility/icons/close-v96.png') && !exists('frontend/public/assets/ui/utility/icons/back-v94.png') && !exists('frontend/public/assets/ui/utility/icons/close-v94.png'), 'Back/close assets are not cleaned correctly');
must(!settings.includes('developer-team-v94') && !settings.includes('success'), 'Legacy developer/success block remains in Settings');
must(i18n.includes("homeMain:'Main'") && i18n.includes("homeMain:'Play'"), 'Home Main/Play bilingual labels are not configured');
  must(settings.includes('openAboutUs') && app.includes('onAboutUs'), 'About Us action is not wired');
  must(!settings.includes('success'), 'Legacy Settings success markup remains');
  must(!settings.includes('developer-team-v94'), 'Legacy developer team block remains in Settings');
  must(utilityArt.includes('close-v96.png'), 'Close artwork does not use the compact V96 asset');


const bossAssets = read('frontend/src/data/bossAssets.js');
const bossData = read('frontend/src/data/bosses.js');
must(bossAssets.includes("base: '/assets/characters/wolf'"), 'Wolf WebP asset manifest missing');
must(bossAssets.includes("base: '/assets/characters/equation-drake'"), 'Chapter 3 Equation Drake asset manifest missing');
must(bossAssets.includes("base: '/assets/characters/wraith'"), 'Wraith WebP asset manifest missing');
must(bossData.includes("id: 'wolf'") && bossData.includes("id: 'wraith'"), 'Chapter 1/2 boss data missing');
must(bossData.includes("3: {") && bossData.includes("4: {") && bossData.includes("5: {"), 'Chapter 3–5 boss slots missing');
must(bossData.includes("id: 'equation-drake'") && bossData.includes("renderer: 'webp'"), 'Chapter 3 WebP boss data missing');
must(bossMonster.includes('getBossAsset'), 'Shared boss asset renderer missing');
must(bossMonster.includes('state.pending') && bossMonster.includes('attackElement') && bossMonster.includes('logicalW = Math.round(size * (centered ? 1 : 1.42))'), 'Chapter 3 boss preload/element attack guard missing');
must(read('frontend/src/components/battle/CombatStage.jsx').includes('levelId={levelId}'), 'Boss level ID is not passed to renderer');
must(!exists('frontend/src/data/shadowWolfAssets.js'), 'Obsolete Shadow Wolf manifest remains');

const bossAssetRoot = path.join(root, 'frontend/public/assets/characters');
const expectedBossFrames = {
  wolf: { idle: 6, attack: 6, hurt: 5, die: 5 },
  wraith: { idle: 6, attack: 7, hurt: 5, die: 6 },
};
for (const [bossId, states] of Object.entries(expectedBossFrames)) {
  for (const [state, expected] of Object.entries(states)) {
    const stateDir = path.join(bossAssetRoot, bossId, state);
    const frames = fs.existsSync(stateDir)
      ? fs.readdirSync(stateDir).filter((file) => file.endsWith('.webp')).sort()
      : [];
    must(
      frames.length === expected,
      `${bossId} ${state} pack incomplete: expected ${expected} WebP frames, found ${frames.length}`,
    );
  }
}


const equationDrakeRoot = path.join(bossAssetRoot, 'equation-drake');
const equationDrakeFrames = { idle: 6, attack: 9, hurt: 6, die: 5 };
for (const [state, expected] of Object.entries(equationDrakeFrames)) {
  const stateDir = path.join(equationDrakeRoot, state);
  const frames = fs.existsSync(stateDir)
    ? fs.readdirSync(stateDir).filter((file) => file.endsWith('.webp')).sort()
    : [];
  must(frames.length === expected, `equation-drake ${state} pack incomplete: expected ${expected}, found ${frames.length}`);
}
const attackElementDir = path.join(equationDrakeRoot, 'effects', 'attackElement');
const attackElementFrames = fs.existsSync(attackElementDir)
  ? fs.readdirSync(attackElementDir).filter((file) => file.endsWith('.webp')).sort()
  : [];
must(attackElementFrames.length === 3, `equation-drake attack element pack incomplete: expected 3, found ${attackElementFrames.length}`);

for (const legacyPath of [
  'frontend/public/assets/characters/shadow-wolf',
  'frontend/src/data/shadowWolfAssets.js',
]) {
  must(!exists(legacyPath), `Legacy boss asset path remains: ${legacyPath}`);
}


/* -------------------------------------------------------------------------- */
/* V62 motion / multiplayer polish regression guard                           */
/* -------------------------------------------------------------------------- */
const spriteV62 = read('frontend/src/components/battle/SpriteCharacter.jsx');
const bossV62 = read('frontend/src/components/battle/BossMonster.jsx');
const multiV62 = read('frontend/src/components/multiplayer/Multiplayer.jsx');
const ui34V62 = read('frontend/src/styles/feedback-diagnostics.css');
must(spriteV62.includes('requestAnimationFrame(tick)') && spriteV62.includes('motionX') && spriteV62.includes('drawImage(image'), 'Traveler smoothing layer is missing');
must(!spriteV62.includes('setInterval('), 'Traveler animation regressed to interval-based frame stepping');
must(bossV62.includes('requestAnimationFrame(tick)') && bossV62.includes('asset-boss-canvas') && bossV62.includes('drawImage(image'), 'WebP boss smoothing layer is missing');
must(!bossV62.includes('setInterval('), 'WebP boss animation regressed to interval-based frame stepping');
must(multiV62.includes('multiplayer-arena') && multiV62.includes('MultiplayerFighter') && multiV62.includes('data-combat-seq'), 'Multiplayer selected-fighter motion hooks are missing');
must(ui34V62.includes('.multi-page{height:100dvh') && ui34V62.includes('overflow-y:auto') && ui34V62.includes('scroll-behavior:smooth'), 'Multiplayer scroll container is missing');
must(ui34V62.includes('@keyframes mpAttack') && ui34V62.includes('@keyframes mpHit') && ui34V62.includes('@keyframes mpDamage'), 'Multiplayer combat animation layer is incomplete');

checkBalancedDelimiters(battle, 'frontend/src/components/battle/Battle.jsx');
const combatV62 = read('frontend/src/components/battle/CombatStage.jsx');
checkBalancedDelimiters(combatV62, 'frontend/src/components/battle/CombatStage.jsx');
must(spriteV62.includes('One-shot states return to idle in the same render tick') && spriteV62.includes("state.mode = 'idle';") && spriteV62.includes('canvas.style.transform = `translate3d(') && spriteV62.includes('const x = baseX;'), 'Traveler one-shot/attack render guard failed');
  must(!spriteV62.includes('drawImage(nextImage'), 'Traveler attack renderer still cross-fades frames');
  must(!bossV62.includes('drawImage(nextImage'), 'WebP boss renderer still cross-fades frames');
must(!read('frontend/src/styles/battle.css').includes('.asset-boss-seq-attack-v40{animation:'), 'Battle stylesheet still overrides boss WebP transform animation');
  must(read('frontend/src/styles/battle.css').includes('text-wrap: balance') && read('frontend/src/styles/battle.css').includes('focus-within') && read('frontend/src/styles/battle.css').includes('grid-template-columns: minmax(0, 1.62fr)'), 'Battle question panel polish is missing');
must(read('frontend/src/styles/battle.css').includes('.hp-card') && read('frontend/src/styles/battle.css').includes('.fighter-slot'), 'V62 HUD/anchor styling is missing');

must(!multi.includes('multi-toolbar-v25') && !multi.includes('multi-toolbar-v26'), 'Retired multiplayer toolbar markup remains');
for (const file of ['frontend/src/styles/base.css','frontend/src/styles/ui-tokens.css','frontend/src/styles/feedback-diagnostics.css','frontend/src/styles/responsive.css']) {
  must(!read(file).includes('multi-toolbar-v25') && !read(file).includes('multi-toolbar-v26'), `Retired multiplayer toolbar CSS remains in ${file}`);
}
must(!read('frontend/src/components/menu/Settings.jsx').includes('<span>{t(\'languageIndonesia\')}</span>') && !read('frontend/src/components/menu/Settings.jsx').includes('<span>{t(\'languageEnglish\')}</span>'), 'Language selector labels should be icon-only');
must(!exists('frontend/public/assets/ui/brand/solvox-logo-v84.svg') && !exists('frontend/src/styles/solvox-brand-v84.css') && !exists('frontend/src/styles/brand-v83.css'), 'Retired V83/V84 brand assets/styles remain');
must(exists('frontend/public/assets/ui/brand/solvox-logo-v89.png'), 'V89 logo asset is missing');


// V98 Chapter 3 background + mobile conflict guards.
must(backgrounds.includes("level3/chapter3-arena-4x1.mp4"), 'Chapter 3 4:1 video background is not configured');
must(!backgrounds.includes('chapter3-battle-4x1.png'), 'Legacy Chapter 3 image background is still configured');
must(exists('frontend/public/assets/backgrounds/level3/chapter3-arena-4x1.mp4'), 'Chapter 3 video asset is missing');
must(exists('frontend/public/assets/backgrounds/level3/chapter3-video-poster-4x1.jpg'), 'Chapter 3 video poster is missing');
must(!exists('frontend/public/assets/backgrounds/level3/chapter3-battle-4x1.png'), 'Legacy Chapter 3 background asset remains');
must(!main.includes("responsive-v96.css") && !exists('frontend/src/styles/responsive-v96.css'), 'Legacy V96 responsive source remains active');
must(responsive105.includes('overflow: visible !important') && responsive105.includes('touch-action: pan-y') && responsive105.includes('fighter-player .sprite-wrap'), 'V101 mobile conflict fixes are incomplete');
must(responsive105.includes('bg-mobile-object-position') && responsive105.includes('object-fit: cover !important') && responsive105.includes('transform: none !important'), 'Responsive arena background contract is missing');
must(!main.includes('responsive-v98.css') && !exists('frontend/src/styles/responsive-v98.css'), 'Legacy V98 responsive source remains active');
must(battle.includes('battle-answer-input') && !battle.includes('battle-answer-input-v23'), 'Battle focus selector still points at retired V23 input');

console.log('V61 QA STATIC + REGRESSION PASS');
console.log('V62 QA MOTION + MULTIPLAYER PASS');

must(settings.includes('settings-v101.webp') && settings.includes('settings-head-art'), 'Settings must use the supplied V101 settings icon with the V103 header layout');
must(!feedback.includes('SolvoxUtilityArt name=\"feedback\"'), 'Feedback modal must not render the decorative feedback utility artwork');
must(!profile.includes('PixelIcon name=\"pixelNinja\"') && !profile.includes('pixel-icon-raster'), 'Profile must not render the retired pixel/raster profile artwork');
must(exists('frontend/public/assets/ui/utility/icons/settings-v101.webp'), 'V101 settings icon asset is missing');
must(!exists('frontend/public/assets/ui/reference/avatar-medallion-clean.png'), 'Retired profile avatar asset still exists');
console.log('V103: settings icon polish, Home tutorial guide, V91 mobile reference geometry, chapter-aware question themes, visible mobile feedback, icon-only language selector');
console.log('Battle: one dedicated V43 stylesheet, full-width HUD, continuous question/hint/keypad dock, real attack-distance calculation');
console.log('Cleanup: legacy V23/V24 layout roots removed from app/ui-v42, dead Battle helper/prop removed');
console.log('Content: bilingual i18n, profile API, multiplayer hint tracking, Traveler player pack, Wolf + Wraith + Equation Drake WebP boss packs');

const v94StaleRefs=[['frontend/src/components/menu/ModeSelect.jsx',['single-player-hero.png','multiplayer-hero.png']],['frontend/src/components/multiplayer/Multiplayer.jsx',['AJM-XXXX']],['frontend/src/services/i18n.js',['AJM-XXXX']]];
for(const [rel,badRefs] of v94StaleRefs){
  const text=read(rel);
  for(const bad of badRefs){ must(!text.includes(bad), `V94 stale reference: ${rel} -> ${bad}`); }
}
for(const asset of ['single-mode-v94.webp','multi-mode-v94.webp']) must(exists(`frontend/public/assets/ui/modes/${asset}`), `V94 missing mode asset: ${asset}`);
for(const asset of ['flag-id-v94.png','flag-en-v94.png','back-v82.webp','close-v96.png']) must(exists(`frontend/public/assets/ui/utility/icons/${asset}`), `V96 missing utility asset: ${asset}`);
must(exists('frontend/public/assets/ui/modes/single-mode-v94.webp') && exists('frontend/public/assets/ui/modes/multi-mode-v94.webp'), 'V94 mode artwork is missing');
must(!exists('frontend/public/assets/ui/modes/single-player-hero.png') && !exists('frontend/public/assets/ui/modes/multiplayer-hero.png'), 'Old mode artwork assets remain');
must(!exists('frontend/public/assets/ui/utility/icons/back.webp'), 'Old back icon asset remains');
must(battle.includes('bossDieDurationMs + 140') && battle.includes('bossAttackImpactMs') && battle.includes('playBossAttack(levelId)'), 'Battle animations must remain synchronized with boss assets');
must(settings.includes('flag-id-v94.png') && settings.includes('flag-en-v94.png') && settings.includes('settings-about-row'), 'V96 Settings flags/about routing are missing');

// V104 multiplayer arena guard
const mp104 = read('frontend/src/components/multiplayer/Multiplayer.jsx');
must(mp104.includes('MultiplayerFighter') && mp104.includes('multiplayer-arena'), 'V120 multiplayer arena does not use the selected registered fighter sprites');
must(mp104.includes("room-card multi-room--legacy multi-room ${room.status==='battle'?'is-battling':''}"), 'Battle room wrapper is missing its original layout classes');
must(!mp104.includes('mp-fighter-v34') && !mp104.includes('mp-clash-v34'), 'Retired pixel multiplayer arena markup remains');
must(exists('frontend/src/styles/multiplayer-arena.css') && main.includes("import './styles/multiplayer-arena.css';"), 'V104 multiplayer arena CSS is not wired');

// V114 single-player character selection + supplied Asuka asset integration.
const playerAssetsV114 = read('frontend/src/data/playerAssets.js');
const chapterV114 = read('frontend/src/components/menu/ChapterSelect.jsx');
const appV114 = read('frontend/src/App.jsx');
const battleV114 = read('frontend/src/components/battle/Battle.jsx');
const spriteV114 = read('frontend/src/components/battle/SpriteCharacter.jsx');
const combatV114 = read('frontend/src/components/battle/CombatStage.jsx');
must(playerAssetsV114.includes("asuka:") && playerAssetsV114.includes("/assets/characters/asuka"), 'V114 Asuka player asset is not registered');
must(playerAssetsV114.includes("attack-asuka_12.webp") && playerAssetsV114.includes("hurt-asuka_08.webp") && playerAssetsV114.includes("die-asuka_05.webp"), 'V114 Asuka animation sequences are incomplete');
const characterShowcaseV118 = read('frontend/src/components/character/CharacterShowcase.jsx');
const multiplayerPickerV118 = read('frontend/src/components/character/CharacterPicker.jsx');
must(characterShowcaseV118.includes('character-showcase-roster') && characterShowcaseV118.includes('character-showcase-stage') && characterShowcaseV118.includes('character-showcase-details'), 'Character showcase roster, spotlight, or profile panel is missing');
must(multiplayerPickerV118.includes('...Object.values(BOSSES)') && multiplayerPickerV118.includes('kind: \'boss\'') && multiplayerPickerV118.includes('CharacterShowcase'), 'Multiplayer character showcase must offer registered boss characters');
const characterScreenV118 = read('frontend/src/components/character/SinglePlayerCharacterSelect.jsx');
const translationsV118 = read('frontend/src/services/i18n.js');
must(characterScreenV118.includes('CHOOSE YOUR CHARACTER') && !characterScreenV118.includes('character-start-panel') && characterScreenV118.includes('await onStart(chapterId, character.id)') && characterScreenV118.includes('SinglePlayerCharacterDetail'), 'Cinematic selection must preview details before committing START');
must(translationsV118.includes("characterSelectTitle:'PILIH KARAKTER'") && translationsV118.includes("characterSelectTitle:'CHARACTER SELECT'") && translationsV118.includes("gameStartPrompt:'GAME START'"), 'V118 bilingual character select labels are missing');
must(chapterV114.includes('onSelectChapter') && chapterV114.includes('onClick={() => onSelectChapter?.(level.id)}'), 'V116 chapter selection handler is incomplete');
must(appV114.includes("screen==='character'") && appV114.includes('<SinglePlayerCharacterSelect'), 'V116 character selection route wiring missing');
const characterSelectV116 = read('frontend/src/components/character/SinglePlayerCharacterSelect.jsx');
must(characterSelectV116.includes('await onStart(chapterId, character.id)') && appV114.includes("setScreen('battle')"), 'V116 character-to-battle transition wiring missing');
must(!chapterV114.includes('pendingLevel') && !chapterV114.includes('single-character-modal-v114'), 'V116 legacy nested chapter modal flow still present');
must(appV114.includes('PLAYER_STORAGE') && appV114.includes('onPlayerChange={setPlayerId}') && appV114.includes('playerId={playerId}'), 'V114 selected player is not persisted or passed into battle');
must(battleV114.includes('getPlayerAsset(playerId)') && battleV114.includes('playerCharacter: playerAsset.id'), 'V114 Battle does not use/log the selected character');
must(spriteV114.includes('getPlayerAsset(playerId)') && spriteV114.includes('resolvePlayerSequence(mode, playerId)'), 'V114 sprite renderer is not character-aware');
must(combatV114.includes('playerId={playerId}'), 'V114 combat stage does not receive selected player');
for (const [dir, file] of [
  ['frontend/public/assets/characters/asuka/idle-asuka','idle-asuka_01.webp'],
  ['frontend/public/assets/characters/asuka/attack-asuka','attack-asuka_12.webp'],
  ['frontend/public/assets/characters/asuka/hurt-asuka','hurt-asuka_08.webp'],
  ['frontend/public/assets/characters/asuka/die-asuka','die-asuka_05.webp'],
]) must(exists(`${dir}/${file}`), `V114 missing supplied Asuka asset: ${dir}/${file}`);
console.log('V114: single-player character select + Asuka sprite animation integration PASS');


// V117 campaign lock, supplied Asuka folders, feedback timing and multiplayer reliability.
const appV117 = read('frontend/src/App.jsx');
const assetsV117 = read('frontend/src/data/playerAssets.js');
const spriteV117 = read('frontend/src/components/battle/SpriteCharacter.jsx');
const battleV117 = read('frontend/src/components/battle/Battle.jsx');
const battlePanelV117 = read('frontend/src/components/battle/BattleQuestionPanel.jsx');
const multiplayerV117 = read('frontend/src/components/multiplayer/Multiplayer.jsx');
const viteV117 = read('frontend/vite.config.js');
const chapterCssV117 = read('frontend/src/styles/chapter-select.css');
must(appV117.includes('PLAYER_LOCK_STORAGE') && appV117.includes('allChaptersCompleted') && appV117.includes("if(chapterId===1&&(!playerSelectionLocked||allChaptersCompleted))"), 'V117 one-time Chapter 1 character selection lock is missing');
must(appV117.includes("localStorage.setItem(PLAYER_LOCK_STORAGE,'1')") && appV117.includes('localStorage.removeItem(PLAYER_LOCK_STORAGE)') && appV117.includes('if(allChaptersCompleted)setState(current=>({...current,completedLevels:[]}))'), 'V117 character lock persistence/reset/new-campaign flow is incomplete');
must(appV117.includes('save(next);') && appV117.includes('LEGACY_STORAGES.forEach') && appV117.includes('setSettings(false);') && appV117.includes("setScreen('home');"), 'Reset must clear legacy progress, close overlays, and return to a playable home screen');
must(assetsV117.includes("idle: 'idle-asuka'") && assetsV117.includes("attack: 'attack-asuka'") && assetsV117.includes("hurt: 'hurt-asuka'") && assetsV117.includes("die: 'die-asuka'"), 'V117 Asuka supplied folder mappings are missing');
must(spriteV117.includes('activeAsset.sequenceFolders?.[mode] || mode'), 'V117 sprite loader ignores character-specific animation folders');
must(battleV117.includes('value - hintCost') && battleV117.includes('const handleWrongAnswer = () =>') && battleV117.includes('setBusy(false);') && !battleV117.includes('hp - 8') && multi.includes('match-evaluation'), 'Single-player retry, hint HP cost, or multiplayer evaluation is missing');
must(battlePanelV117.includes(`{t('attempt')}: {attempts}`), 'Single-player attempt counter is missing');
must(viteV117.includes("'/socket.io'") && viteV117.includes('ws: true') && viteV117.includes('http://127.0.0.1:3000'), 'V117 Vite Socket.IO proxy target is missing or may resolve to the wrong localhost interface');
must(multiplayerV117.includes("socket.on('connect_error',onConnectError)") && multiplayerV117.includes('SOCKET_CONNECTION') && multiplayerV117.includes('socket.emit(\'room:join\'') && multiplayerV117.includes('pendingActionRef.current=action') && multiplayerV117.includes('pendingAction();'), 'V120 multiplayer connection/token recovery or queued click handling is incomplete');
const multiplayerFighterV120 = read('frontend/src/components/battle/MultiplayerFighter.jsx');
const characterPickerV120 = read('frontend/src/components/character/CharacterPicker.jsx');
must(characterPickerV120.includes('PLAYER_ASSETS.traveler.portrait') && characterPickerV120.includes('...Object.values(BOSSES)') && characterPickerV120.includes('getBossPreviewSrc'), 'Multiplayer picker is missing real player and boss sprite choices');
must(multiplayerFighterV120.includes('PLAYER_ASSETS[characterId]') && multiplayerFighterV120.includes('getBossAsset(characterId)') && multiplayerV117.includes('findCharacter(battlePlayers.player?.character)') && multiplayerV117.includes('findCharacter(battlePlayers.opponent?.character)'), 'Multiplayer character lookup/renderer wiring is incomplete');
must(multiplayerFighterV120.includes('attackDirection') && multiplayerV117.includes('attackDirection={1}') && multiplayerV117.includes('attackDirection={-1}'), 'Multiplayer fighter facing direction is not tied to P1/P2 sides');
must(multiplayerV117.includes('className="primary-btn multi-bot-btn"') && !multiplayerV117.includes('secondary-btn multi-bot-btn'), 'Play vs bot button should use the shared primary action styling');
const multiplayerButtonStyles = read('frontend/src/styles/multiplayer-arena.css');
must(multiplayerButtonStyles.includes('.multi-bot-btn:hover:not(:disabled)') && multiplayerButtonStyles.includes('grid-template-columns:1fr'), 'Play vs bot button hover or mobile styling is missing');
must(read('frontend/src/data/playerAssets.js').includes('base: \'/assets/characters/kazura/mirror\'') && bossAssets.includes('base: \'/assets/characters/wolf/mirror\''), 'Supplied mirrored character animation packs are not registered');
must(apiServer.includes('currentTurnPlayerId') && !apiServer.includes('token:player.token') && apiServer.includes('function findPlayer(room,socket){return room?.players.find(p=>p.id===socket.id);}'), 'Multiplayer room state leaks reconnect tokens or authorizes stale sockets');
must(multiplayerV117.includes("socket.timeout(750).emit('room:leave'") && apiServer.includes("socket.on('room:leave',(ack)=>{leaveRoom(socket,true);ack?.({ok:true});})"), 'Leaving multiplayer does not close a room cleanly');
must(apiServer.includes('const second=room.players[1];') && apiServer.includes("if(room.status==='battle'){const winner=room.players.find(x=>x.token!==p.token)?.token;finishRoom(room,winner);}room.players=room.players.filter(x=>x.token!==p.token);"), 'Leaving during a battle can crash the room before the opponent is declared winner');
must(main.includes("import './styles/multiplayer-characters.css';"), 'V120 multiplayer character polish is not wired');
must(read('scripts/dev.js').includes("launch(process.execPath, ['server.js'])") && read('package.json').includes('node scripts/dev.js'), 'V117 development command does not start the multiplayer backend');
must(!chapterCssV117.includes('single-character-modal-v114') && !chapterCssV117.includes('single-character-panel-v114'), 'V117 obsolete nested character modal styles remain');
console.log('V120: multiplayer player/boss roster, synchronized sprite selection, private reconnect tokens, room exit and reconnect PASS');

const { evaluateAttempt } = require('./backend/singlePlayerGame');
must(evaluateAttempt({questionId:7,answer:'2.5',lang:'en'}).correct, 'Decimal form of a multi-answer question should be accepted');
must(evaluateAttempt({questionId:7,answer:'5/2',lang:'en'}).correct, 'Fraction form of a multi-answer question should be accepted');
must(!evaluateAttempt({questionId:7,answer:'2.5,5/2',lang:'en'}).correct, 'A joined list of acceptable answers must not count as one answer');
console.log('Single-player answer variants PASS');
