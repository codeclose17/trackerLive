import { KB_CHAPTERS, KbChapter } from '../services/kb.service';

// A short "try it now" action paired with each chapter — grounded in that
// chapter's actual content, not generic filler. [step 45]
const TRY_IT_NOW: Record<string, string> = {
  definition: 'Notice one moment today where "I should be able to just do this" shows up — that\'s the misnomer talking, not a character flaw.',
  epidemiology: 'If you\'ve ever felt like an outlier, remember: this affects ~5-7% of children and ~2.5% of adults worldwide. You are not rare.',
  genetics: 'Ask a parent or sibling one question about their own focus/organization patterns growing up — heritability runs ~74%.',
  neuroanatomy: 'Next time you lose track of time, that\'s the cerebellum\'s timing role, not laziness. Set one visible clock nearby today.',
  networks: 'Notice one moment your mind wanders mid-task — that\'s networks failing to hand off control, not a lack of trying.',
  neurochemistry: 'Before your next boring task, do 2 minutes of movement — it nudges the same dopamine system stimulants target.',
  executive: 'Pick today\'s ONE task and write its first physical action before starting — that\'s externalizing working memory.',
  hormones: 'If today feels harder than usual, check: did you sleep enough? Cortisol dysregulation from short sleep hits focus hardest.',
  'sex-lifespan': 'If you\'re diagnosed later in life, know it\'s common — symptoms often internalize and get missed for years.',
  comorbidity: 'Notice if anxiety or low mood is riding along with today\'s distraction — they often travel together with ADHD.',
  modern: 'Try one 10-minute window today with your phone in another room before you reach for it.',
  pharmacology: 'Whatever your treatment path, psychoeducation (understanding this mechanism) is itself an active ingredient — you\'re doing it right now.',
  behavioural: 'Pick ONE tiny environmental change today (move your phone charger across the room) rather than trying to fix everything.',
  cheatcodes: 'Try the cheatcode you\'ve used least this week — sunlight, movement, or the physiological sigh.',
  targeted: 'If task initiation feels impossible today, shrink it: what\'s the smallest 2-minute version of the first step?',
  'comorbid-fixes': 'If sleep, mood, or anxiety are also in the picture today, treating those often improves focus as a side effect.',
  myths: 'Notice one ADHD myth you catch yourself half-believing today — even about yourself.',
  glossary: 'Pick one term from the glossary you\'ve heard but never fully understood, and read just that one entry.',
  references: 'This whole knowledge base is referenced — if something surprised you today, you can go verify it yourself.'
};

export interface DailyLesson {
  chapter: KbChapter;
  tryItNow: string;
}

const EPOCH = new Date(2024, 0, 1); // arbitrary fixed epoch, just needs to be stable

// Deterministic day-index cycle through all 19 chapters: day N mod 19
// picks the chapter. Guarantees zero repeats within any 19-day window,
// needs no stored state, and is stable across devices/reinstalls since
// it's purely a function of the calendar date. [step 45]
export function getDailyLesson(today: Date = new Date()): DailyLesson {
  const daysSinceEpoch = Math.floor((today.getTime() - EPOCH.getTime()) / 86400000);
  const index = ((daysSinceEpoch % KB_CHAPTERS.length) + KB_CHAPTERS.length) % KB_CHAPTERS.length;
  const chapter = KB_CHAPTERS[index];
  return {
    chapter,
    tryItNow: TRY_IT_NOW[chapter.id] || 'Read this chapter and notice one thing that resonates.'
  };
}
