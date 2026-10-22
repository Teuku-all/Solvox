import lore from '../../../lore.md?raw';

const ROUTES = Object.freeze([
  { id: 'traveler', chapter: 'Bagian 4', pov: 'kazura' },
  { id: 'asuka', chapter: 'Bagian 5', pov: 'asuna' },
]);

const SPEAKER_IDS = Object.freeze({
  axiom: 'axiom',
  asuna: 'asuna',
  drake: 'drake',
  'equation drake': 'drake',
  kazura: 'kazura',
  'naga persamaan': 'drake',
  narration: 'narrator',
  narasi: 'narrator',
  titan: 'titan',
  wolf: 'wolf',
  wraith: 'wraith',
});

const stripMarkdown = (text) => text
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\*([^*]+)\*/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .trim();

function normalizeSpeaker(label, pov) {
  const normalized = label.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
  if (normalized === '{pov}') return pov;
  return SPEAKER_IDS[normalized] || 'narrator';
}

function parseDialogues(markdown, pov) {
  const dialogues = [];
  const dialogueLine = /^\s*>?\s*-\s*\*\*(ID|EN) · ([^:*]+):\*\*\s*(.*)$/;

  for (const line of markdown.split('\n')) {
    const match = line.match(dialogueLine);
    if (!match) continue;
    const [, language, label, rawText] = match;
    const speaker = normalizeSpeaker(label, pov);
    const text = stripMarkdown(rawText)
      .replaceAll('{KAZURA/ASUNA}', pov === 'kazura' ? 'Kazura' : 'Asuna');

    if (language === 'ID') {
      dialogues.push({ speaker, id: text });
      continue;
    }

    const previous = [...dialogues].reverse().find((dialogue) => dialogue.speaker === speaker && !dialogue.en);
    if (previous) previous.en = text;
  }

  return dialogues;
}

function extractSection(title, nextTitle) {
  const start = lore.indexOf(title);
  if (start < 0) throw new Error(`Story section is missing: ${title}`);
  const end = nextTitle ? lore.indexOf(nextTitle, start + title.length) : lore.length;
  if (nextTitle && end < 0) throw new Error(`Story section is missing: ${nextTitle}`);
  return lore.slice(start, end);
}

function parseRoute({ chapter: sectionTitle, pov }) {
  const section = extractSection(`## ${sectionTitle}`, sectionTitle === 'Bagian 4' ? '## Bagian 5' : '## Bagian 6');
  const chapterMatches = [...section.matchAll(/^### Bab (\d+)\b.*$/gm)];
  const chapters = {};

  chapterMatches.forEach((match, index) => {
    const chapterId = Number(match[1]);
    const chapterStart = match.index + match[0].length;
    const nextChapterStart = chapterMatches[index + 1]?.index ?? section.length;
    const chapterText = section.slice(chapterStart, nextChapterStart);
    const segments = [...chapterText.matchAll(/^#### `(intro|win|lose)`[^\n]*$/gm)];
    const parsed = { intro: [], win: [], lose: [] };

    segments.forEach((segment, segmentIndex) => {
      const segmentStart = segment.index + segment[0].length;
      const nextSegmentStart = segments[segmentIndex + 1]?.index ?? chapterText.length;
      parsed[segment[1]].push(...parseDialogues(chapterText.slice(segmentStart, nextSegmentStart), pov));
    });

    chapters[chapterId] = parsed;
  });

  if (Object.keys(chapters).length !== 5) {
    throw new Error(`Expected five story chapters in ${sectionTitle}.`);
  }
  return chapters;
}

const routes = Object.fromEntries(ROUTES.map(({ id, ...route }) => [id, parseRoute(route)]));
const chapters = Object.fromEntries(
  Array.from({ length: 5 }, (_, index) => {
    const chapterId = index + 1;
    return [chapterId, {
      intro: {
        traveler: routes.traveler[chapterId].intro,
        asuka: routes.asuka[chapterId].intro,
      },
      win: {
        traveler: routes.traveler[chapterId].win,
        asuka: routes.asuka[chapterId].win,
      },
      lose: {
        traveler: routes.traveler[chapterId].lose,
        asuka: routes.asuka[chapterId].lose,
      },
    }];
  }),
);

const epilogueSection = extractSection('## Bagian 6', '## Bagian 7');
const epilogueSegment = epilogueSection.match(/^#### `epilogue`[^\n]*\n([\s\S]*?)(?=^---$|^## Bagian 7)/m);
if (!epilogueSegment) throw new Error('Story epilogue is missing.');

const epilogue = {
  traveler: parseDialogues(epilogueSegment[1], 'kazura'),
  asuka: parseDialogues(epilogueSegment[1], 'asuna'),
};

export const storyScript = Object.freeze({ chapters, epilogue });

export const CUTSCENE_ASSETS = Object.freeze({
  players: Object.freeze({
    traveler: '/assets/characters/kazura/splash/kazura-selection.webp',
    asuka: '/assets/characters/asuka/splash/asuna-selection.webp',
  }),
  speakers: Object.freeze({
    axiom: { id: 'Axiom', en: 'Axiom', splash: '/assets/characters/axiom/axiom-splash.webp' },
    asuna: { id: 'Asuna', en: 'Asuna', splash: '/assets/characters/asuka/splash/asuna-selection.webp' },
    drake: { id: 'Naga Persamaan', en: 'Equation Drake', splash: '/assets/characters/equation-drake/equation-drake-splash.webp' },
    kazura: { id: 'Kazura', en: 'Kazura', splash: '/assets/characters/kazura/splash/kazura-selection.webp' },
    narrator: { id: 'Narator', en: 'Narrator', splash: null },
    titan: { id: 'Titan', en: 'Titan', splash: '/assets/characters/titan/titan-splash.webp' },
    wolf: { id: 'Wolf', en: 'Wolf', splash: '/assets/characters/wolf/wolf-splash.webp' },
    wraith: { id: 'Wraith', en: 'Wraith', splash: '/assets/characters/wraith/wraith-splash.webp' },
  }),
  chapterOpponents: Object.freeze({
    1: 'wolf',
    2: 'wraith',
    3: 'drake',
    4: 'titan',
    5: 'axiom',
  }),
});
