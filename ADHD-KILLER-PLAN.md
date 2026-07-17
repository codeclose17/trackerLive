# Cadence 2.0 — The ADHD-Killer Reform Plan (50 Steps)

Reform trackerLive from a passive time-painter into an active ADHD-management system.
Every feature is grounded in a mechanism from `public/adhd-knowledge-base.html` (chapter refs in brackets).
**Constraints:** no medication/therapist dependencies (all tools self-administered), KB visual identity everywhere,
mobile-first for OnePlus 11R (~412×925 CSS px, 20:9 OLED), fully usable on MacBook Air M1 (1280×800+).

---

## Phase A — Design system & responsive shell (Steps 1–8)

1. **Unify tokens with the KB.** Make `styles.css` match the KB stylesheet exactly: Charter serif body,
   system-sans headings, mono eyebrow/labels, `--grad-hot` magenta→amber, teal `--cool`, violet grounds.
   Remove the Outfit Google-Fonts import (offline-friendly, faster first paint, no FOUT).
2. **Mobile-first shell rebuild.** Bottom tab bar on phone (thumb reach on a 20:9 screen), KB-style left
   sidebar nav on ≥1000px (MacBook). Safe-area insets, all touch targets ≥44px.
   **Global wrap rule:** on narrow screens nothing overflows horizontally — chips, badges, stat rows,
   button groups all `flex-wrap`; the page never scrolls sideways.
3. **Shared KB component library.** Port the KB's visual vocabulary into Angular shared components:
   `tldr-card`, `cheat-card`, `fix-card` (problem→why→fixes), `meter`, `evidence-dots`, `eyebrow`,
   section numbers. All new features use these.
4. **Repurpose the KB progress bar as a "day progress" bar** — a thin gradient bar pinned to the top showing
   % of the waking day elapsed. Constant passive time-exposure fights time blindness [Ch 7, 15].
5. **PWA setup.** Manifest, icons, service worker → installable full-screen on the OnePlus 11R home screen,
   offline-first (village internet friendly).
6. **Motion & focus polish.** KB reveal animations, `prefers-reduced-motion`, hot-pink `::selection`,
   cool-teal `:focus-visible`. Nothing blinks or loops (distraction hygiene).
7. **Kill the 14-day grid — new time architecture.** Three altitudes, matched to the ADHD time horizon:
   - **Today** (full detail): a 24-hour vertical timeline you paint/log, with a live "now" marker.
   - **Week** (rhythm): 7 compact day-strips — enough to see sleep-anchor drift and binge clusters,
     small enough to never overwhelm. Swipe/arrow back one week at a time if ever needed.
   - **Long range**: aggregates only (trends, heatmaps, records) inside Insights — never a pixel wall.
   Pointer-events unify mouse drag + touch paint on the Today timeline.
8. **Single theme source.** Dark default + light parity from one token sheet shared by app and KB page.

## Phase B — Restructure around "Today" (Steps 9–14)

ADHD time horizon is "now vs not-now" [Ch 7]. The old 14-day grid and Daily Glance tabs are retired;
navigation becomes **Today · Week · Insights · Learn**. (Data stays date-keyed, so nothing is lost —
old records simply render in the new views.)

9. **New "Today" home tab:** all **24 hours of today** rendered as the trackable surface — every hour
   paintable/loggable from this one screen (vertical timeline on phone, no horizontal scroll; roomier
   two-column 00–11 / 12–23 layout allowed on desktop). Current hour highlighted with a live "now" marker,
   next planned block, day-progress dial, ONE primary CTA.
   The Week tab absorbs Daily Glance: 7 day-strips + tap-through to any day's detail.
10. **Externalized time dial** — elapsed vs remaining waking hours as a visual arc [Cheatcode 06: externalise time].
11. **Hourly quick-log:** on app open (and via optional notification) ask "last hour = ?" answered with one
    category-chip tap. Truthful capture beats end-of-day guessing (working memory offload) [Ch 15].
12. **Now + Next planner:** plan max 1–3 blocks ahead, phrased as implementation intentions —
    "At ⟨time⟩, I will ⟨action⟩ at ⟨place⟩" [Cheatcode 04: IF→THEN, doubles follow-through].
13. **Morning launch ritual (≤30s, 3 taps):** confirm sleep, pick the one "today wins if…" priority,
    schedule the first block. Removes morning decision paralysis [Ch 15: overwhelm].
14. **Evening shutdown ritual:** 2 reflection prompts + pre-decide tomorrow's first block. Directly attacks
    revenge bedtime procrastination [Ch 15] and morning task-initiation failure.

## Phase C — Task system built for executive dysfunction (Steps 15–21)

15. **Brain-dump inbox:** an always-reachable capture button (FAB) → one text line, zero required fields.
    The externalized working memory [Ch 15: forgetfulness — "your head is a terrible office"].
16. **Task shredder:** every task must get a "first physical action ≤10 min" before it can be scheduled.
    Shrinks the Wall of Awful to a crack [Ch 15: task initiation].
17. **2-minute lane:** tasks flagged ≤2 min surface as instant-win chips on Today (fast dopamine, momentum).
18. **Focus timer:** fullscreen visual ring (25/5 default), phone becomes a focus object; **hyperfocus guard**
    fires a hard sensory cue at 90 min [Ch 15: hyperfocus & the inability to switch].
19. **Energy-matched tasks:** tag tasks low/med/high activation; app suggests by current self-rated energy
    (inverted-U arousal — right task for the arousal state) [Ch 6].
20. **Temptation bundling:** completing a focus block unlocks banked "reward minutes" chosen in advance
    [Cheatcode 07: gamify & temptation-bundle].
21. **Deadline scaffolding:** dated tasks auto-generate backwards milestones with nudges
    (externalized deadlines beat time blindness) [Ch 15].

## Phase D — Dopamine-aware motivation layer (Steps 22–27)

22. **Shame-proof streaks:** count "days engaged," a miss dims but never resets the chain; "never miss twice"
    nudge. Avoids the streak-break → abandonment spiral [Ch 16: depression & demoralisation].
23. **XP & levels:** paint hours, blocks, rituals grant XP; frequent small level-ups (steep early curve) —
    frequent phasic dopamine hits without slot-machine dark patterns [Ch 6, 11].
24. **Win log:** auto + manual wins feed; resurfaced during low-mood check-ins (counters negativity bias).
25. **Binge counter → Impulse log:** log *urge vs acted*, trigger tag (bored/anxious/tired/phone), and start a
    **10-minute urge-surf timer** — the delay is the intervention [Ch 15: impulsivity].
26. **Friction cards:** when logging a phone-binge, show the user's own pre-written "why I'm doing this" card +
    countdown before "continue anyway" [Ch 11: the modern digital trap; Cheatcode 05: design the environment].
27. **Boredom first-aid kit:** user-defined menu of 5 dopamine-safe 5-minute activities (walk, music, cold
    water on face, 20 push-ups…) surfaced on "I'm bored" tap [Ch 15: boredom intolerance].

## Phase E — Body-based regulators, village-friendly (Steps 28–34)

28. **Sleep anchor module:** fixed wake-time target, wind-down alarm, consistency score (not just duration)
    [Cheatcode 02; Ch 16: insomnia & delayed sleep phase].
29. **Morning sunlight chip:** one-tap "10 min outdoor light before 9am" + mechanism microcopy
    (melatonin phase advance, cortisol pulse) [Cheatcode 03]. Free, and villages have plenty of it.
30. **Exercise = the natural stimulant:** log movement (walking/farm work counts); app then shows the
    "focus window open for ~90 min" hint (post-exercise catecholamines) [Cheatcode 01].
31. **Protein breakfast check-in:** single chip, no calorie counting (avoid restriction framing —
    binge-eating comorbidity) [Cheatcode 08; Ch 16].
32. **Caffeine timing helper:** log tea/coffee; warn past a 14:00 cutoff computed from the sleep target
    (adenosine half-life) [Cheatcode 10].
33. **Stress reset:** 60-second guided physiological-sigh animation + optional cold-water chip
    [Cheatcodes 11–12: protect the PFC from cortisol].
34. **Optional cycle-aware mode:** overlay symptom severity by cycle phase (estrogen–dopamine link) [Ch 8–9].

## Phase F — Emotional regulation & overwhelm tools (Steps 35–38)

35. **Overwhelm SOS button:** one tap → screen collapses to a single smallest next action + breathing guide.
    Choice reduced to one kills decision paralysis [Ch 15: overwhelm & shutdown].
36. **RSD first-aid flow:** 3-question self-guided reframe ("What happened / the story I'm telling /
    a kinder read"), stored privately — CBT-style tool with no therapist required [Ch 15: RSD].
37. **Mood + energy check-ins:** 2 taps, max 3×/day, feeding the insight engine.
38. **Thought parking lot:** one-line capture inside the focus timer so intrusive thoughts get written,
    not chased [Ch 15: working memory].

## Phase G — Insight engine that bites (Steps 39–43)

39. **Rewrite insights as mechanism-citing rules:** correlate sleep consistency × binges × exercise × mood ×
    focus blocks; every insight links to its exact KB chapter anchor (psychoeducation is an active
    ingredient) [Ch 13].
40. **Weekly review ritual (lives in the Week tab):** auto Sunday review — "best day autopsy" (what made it
    work) + ONE experiment for next week. Single-variable change, never an overhaul.
41. **Time-truth view:** planned vs actual overlay on the Today timeline and Week strips; "this week you
    traded ⟨X⟩h Learn for ⟨Y⟩h Social" — delay-discounting made visible, non-shaming copy [Ch 6].
42. **Trigger heatmap:** hour × weekday matrix of impulses/binges → app proposes pre-commitment blocks at the
    hot cells [Ch 11].
43. **Personal records board:** longest focus streak, most consistent wake week, lowest-binge week —
    compete with yourself (safe dopamine).

## Phase H — Knowledge integration (Steps 44–45)

44. **Kill the iframe:** serve the KB natively; every "why this works" button in the app opens the relevant
    KB section as a bottom sheet (phone) / side panel (desktop), deep-linked to anchors.
45. **Daily micro-lesson:** one 30-second KB fact on the Today screen, cycling through all 19 chapters,
    each with a "try it now" action.

## Phase I — Nudges, data, hardening, ship (Steps 46–50)

46. **Notification system:** wind-down, hourly log, block start, hyperfocus guard — all opt-in, gentle
    defaults, via service worker (works on Android Chrome / OnePlus 11R).
47. **Data model + migration:** extend `DayRecord` (mood, energy, sleep, movement, impulses, rituals, tasks),
    versioned localStorage migration, Supabase schema update, export/import updated.
48. **Performance & offline hardening:** lazy-loaded tabs, IndexedDB for event logs, 60fps paint on mobile,
    bundle budgets.
49. **ADHD-UX audit:** one primary action per screen, max 3 choices per decision point, no infinite scroll
    anywhere, ≥44px targets, reduced-motion support, focus states.
50. **QA on both targets + release:** test at 412×925 and 1280×800, Lighthouse PWA pass, production build,
    deploy to GitHub Pages, tag **Cadence 2.0**.

---

### Suggested execution order
A (shell) → B (Today) → C (tasks) → E (body) → D (motivation) → F (emotion) → G (insights) → H (KB) → I (ship).
Each phase is shippable on its own; deploy after every phase, not at the end.
