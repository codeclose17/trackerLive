# Cadence — Working Rules for AI Sessions

Angular 18 standalone app (ADHD time/focus tracker) being reformed per **ADHD-KILLER-PLAN.md** (50 steps).
Progress is tracked in **PROGRESS.md**. These rules are non-negotiable in every session.

## Before writing any code
1. Read `ADHD-KILLER-PLAN.md` and `PROGRESS.md`.
2. Work ONLY on the step numbers named in the user's prompt. Do not start other steps. Do not re-do checked steps.
3. Read `public/adhd-knowledge-base.html` styles (lines 1–300) before any UI work — it is the visual source of truth.

## Design rules (apply to every UI change)
- Visual identity = the knowledge base: Charter serif body, system-sans headings, mono eyebrow/labels,
  violet grounds (`--ground/--surface/--line`), magenta→amber `--grad-hot`, teal `--cool`. Use existing
  tokens in `src/styles.css`; never invent new colors or import fonts.
- Mobile-first: primary target is 412×925 (OnePlus 11R). Desktop 1280×800 (MacBook Air) must also work.
- NOTHING scrolls horizontally on mobile. Chips, badges, rows, button groups must `flex-wrap`.
- Touch targets ≥44px. One primary action per screen. Max 3 choices per decision point. No infinite scroll.
- Support `prefers-reduced-motion` and both dark (default) and light themes.

## Data rules
- Never break existing localStorage data. Any `DayRecord`/`Settings` shape change needs a versioned,
  backward-compatible migration. Keep records date-keyed (`YYYY-MM-DD` local time).
- Supabase sync is optional — every feature must work fully offline with sync disabled.

## Definition of done (per step)
A step is done only when ALL of these hold:
1. Its "Done when" criteria in `PROGRESS.md` are met.
2. `npm run build` passes with no errors.
3. You checked the box in `PROGRESS.md` and filled its `Evidence:` line with the files you touched.
4. Nothing that previously worked was removed unless the plan explicitly retires it.

If you cannot complete a step, leave its box unchecked and write `BLOCKED: <reason>` on its Evidence line.
Never report a phase complete while any of its boxes are unchecked.

## Commands
- Dev server: `ng serve --port 4200`
- Build (required before claiming done): `npm run build`
- Deploy (only when the user asks): `npx angular-cli-ghpages --dir=dist/trackerlive/browser`
