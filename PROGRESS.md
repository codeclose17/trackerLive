# Cadence 2.0 — Progress Tracker

Rules: see CLAUDE.md. A box may only be checked when its "Done when" criteria are ALL true,
`npm run build` passes, and Evidence lists the files touched. Blocked steps get `BLOCKED: <reason>`.

## Phase A — Design system & responsive shell

- [ ] **1. Unify tokens with KB.** Done when: `styles.css` body uses Charter serif, headings sans, labels mono; Outfit `@import` removed; app visually matches KB tokens in dark and light.
  Evidence:
- [ ] **2. Mobile-first shell.** Done when: bottom tab bar ≤999px with safe-area insets, sidebar nav ≥1000px; all targets ≥44px; no horizontal page scroll at 412px on any tab (chips/rows wrap).
  Evidence:
- [ ] **3. Shared KB components.** Done when: `tldr-card`, `cheat-card`, `fix-card`, `meter`, `evidence-dots`, `eyebrow` exist as standalone components/styles and render correctly in both themes.
  Evidence:
- [ ] **4. Day-progress bar.** Done when: thin `--grad-hot` bar pinned at top shows % of waking day elapsed, updates at least every minute, visible on every tab.
  Evidence:
- [ ] **5. PWA.** Done when: manifest + icons + service worker registered; app installable; previously visited tabs load with network off.
  Evidence:
- [ ] **6. Motion & focus polish.** Done when: reveal animations on cards, `prefers-reduced-motion` honored, hot `::selection`, cool `:focus-visible` app-wide.
  Evidence:
- [ ] **7. New time architecture.** Done when: 14-day grid removed; Today 24h timeline + Week 7-strip views exist; paint works via mouse drag AND touch; long-range data only in Insights.
  Evidence:
- [ ] **8. Single theme source.** Done when: app and KB page read identical token values; theme toggle flips both together.
  Evidence:

## Phase B — Today cockpit

- [ ] **9. Today home tab.** Done when: all 24 hours of today paintable on one screen (vertical on phone, optional 2-col desktop); live now-marker on current hour; next block card; ONE primary CTA; Week tab shows 7 strips with tap-through detail.
  Evidence:
- [ ] **10. Time dial.** Done when: visual arc of elapsed vs remaining waking hours renders on Today and updates live.
  Evidence:
- [ ] **11. Hourly quick-log.** Done when: on app open, unlogged past hours since last visit prompt "last hour = ?" answerable by one category-chip tap each; dismissible; writes to the day record.
  Evidence:
- [ ] **12. Now+Next planner.** Done when: user can plan max 3 upcoming blocks, each stored as "At ⟨time⟩ I will ⟨action⟩ at ⟨place⟩"; shown on Today; a 4th block is not allowed.
  Evidence:
- [ ] **13. Morning ritual.** Done when: first open of the day offers 3-tap flow (confirm sleep hours → pick one "today wins if…" → schedule first block); skippable; completable in <30s.
  Evidence:
- [ ] **14. Evening ritual.** Done when: after a configurable evening hour, Today offers shutdown flow: 2 reflection prompts + pre-decide tomorrow's first block; stored on tomorrow's record.
  Evidence:

## Phase C — Task system

- [ ] **15. Brain-dump inbox.** Done when: FAB visible on every tab opens a single text input; saving requires zero other fields; items land in an Inbox list; works offline.
  Evidence:
- [ ] **16. Task shredder.** Done when: a task cannot be scheduled into a block until it has a "first physical action" ≤10 min defined; UI prompts for it.
  Evidence:
- [ ] **17. 2-minute lane.** Done when: tasks flagged ≤2min render as instant-win chips on Today; tapping completes them with a satisfying animation + XP.
  Evidence:
- [ ] **18. Focus timer + hyperfocus guard.** Done when: fullscreen ring timer (default 25/5, editable); at 90 min continuous a hard visual+audio cue fires; timer survives tab switch/reload.
  Evidence:
- [ ] **19. Energy matching.** Done when: tasks taggable low/med/high activation; current energy self-rating filters/sorts suggested tasks.
  Evidence:
- [ ] **20. Temptation bundling.** Done when: user pre-defines reward minutes; completing a focus block banks them; Today shows banked balance; spending logs it.
  Evidence:
- [ ] **21. Deadline scaffolding.** Done when: a dated task auto-generates ≥2 backwards milestones; milestones appear on their days on Today/Week.
  Evidence:

## Phase D — Motivation layer

- [ ] **22. Shame-proof streaks.** Done when: streak counts "days engaged"; a missed day dims but does not zero the count; "never miss twice" nudge appears after exactly one missed day.
  Evidence:
- [ ] **23. XP & levels.** Done when: painting hours, blocks, rituals, instant-wins grant XP; level shown in header; early levels come fast; XP persists and syncs with records.
  Evidence:
- [ ] **24. Win log.** Done when: block/ritual completions auto-append wins; manual win add exists; feed viewable; low mood check-in (≤2/5) resurfaces 3 past wins.
  Evidence:
- [ ] **25. Impulse log.** Done when: binge counter replaced by urge log capturing urge-vs-acted + trigger tag; "surf it" starts a 10-min countdown; surfed urges celebrated.
  Evidence:
- [ ] **26. Friction cards.** Done when: user writes their own "why" card in settings; logging a phone-binge shows it + countdown before "continue anyway" is tappable.
  Evidence:
- [ ] **27. Boredom kit.** Done when: user defines up to 5 quick activities; "I'm bored" button on Today shows them; picking one logs it.
  Evidence:

## Phase E — Body regulators

- [ ] **28. Sleep anchor.** Done when: wake-time target settable; wind-down alarm time derived from it; Week shows wake-consistency score computed from painted Sleep hours.
  Evidence:
- [ ] **29. Sunlight chip.** Done when: one-tap "morning light ✓" on Today (only before noon); streak visible; mechanism microcopy links KB #cheatcodes.
  Evidence:
- [ ] **30. Exercise = stimulant.** Done when: movement loggable (type+minutes, walking/farm work listed); logging shows "focus window open ~90 min" hint with timestamp.
  Evidence:
- [ ] **31. Protein check-in.** Done when: single breakfast-protein chip on Today mornings; no calorie fields anywhere.
  Evidence:
- [ ] **32. Caffeine helper.** Done when: caffeine loggable; logging after cutoff (sleep-target − 8h, default 14:00) shows a gentle warning with the mechanism.
  Evidence:
- [ ] **33. Stress reset.** Done when: 60-second guided physiological-sigh animation runs from Today; optional cold-water chip logs alongside.
  Evidence:
- [ ] **34. Cycle-aware mode (opt-in).** Done when: off by default; when enabled, cycle-day loggable and Insights can overlay phase vs symptoms.
  Evidence:

## Phase F — Emotion tools

- [ ] **35. Overwhelm SOS.** Done when: one tap collapses UI to a single smallest queued action + breathing guide; exit returns to normal; SOS use logged privately.
  Evidence:
- [ ] **36. RSD first-aid.** Done when: 3-question flow (what happened / story I'm telling / kinder read) savable; entries private, listed, deletable.
  Evidence:
- [ ] **37. Mood/energy check-ins.** Done when: 2-tap check-in (mood 1–5, energy 1–5) available max 3×/day; stored on day record; feeds insights.
  Evidence:
- [ ] **38. Thought parking lot.** Done when: one-line capture inside focus timer; saved to Inbox without stopping the timer.
  Evidence:

## Phase G — Insight engine

- [ ] **39. Mechanism-citing insights.** Done when: stats-dashboard insight rules replaced by correlations across sleep/exercise/impulses/mood/blocks; every insight names its mechanism and deep-links a KB anchor.
  Evidence:
- [ ] **40. Weekly review.** Done when: Week tab generates Sunday review (best-day autopsy + pick ONE experiment); chosen experiment pinned on Today all week.
  Evidence:
- [ ] **41. Time-truth view.** Done when: planned blocks overlay actual painted hours on Today + Week; weekly trade summary sentence renders with non-shaming copy.
  Evidence:
- [ ] **42. Trigger heatmap.** Done when: hour×weekday impulse heatmap in Insights; hot cells offer "pre-commit a block here" action.
  Evidence:
- [ ] **43. Records board.** Done when: personal bests (focus streak, wake consistency, lowest-impulse week) computed and shown; new records celebrated once.
  Evidence:

## Phase H — Knowledge integration

- [ ] **44. Native KB.** Done when: iframe removed; KB content served natively; "why this works" buttons open the exact KB section as bottom sheet (phone) / side panel (desktop); theme follows app.
  Evidence:
- [ ] **45. Daily micro-lesson.** Done when: one KB fact card/day on Today cycling all 19 chapters with a "try it now" action; no repeats until cycle completes.
  Evidence:

## Phase I — Ship

- [ ] **46. Notifications.** Done when: opt-in notifications for wind-down, hourly log, block start, hyperfocus guard; each individually toggleable; all off by default.
  Evidence:
- [ ] **47. Data migration.** Done when: extended models (mood, sleep, movement, impulses, rituals, tasks, XP) behind a versioned migration; old backups import cleanly; export includes everything; Supabase schema documented.
  Evidence:
- [ ] **48. Perf & offline.** Done when: tabs lazy-loaded; event logs in IndexedDB; no jank painting on mobile; initial bundle within Angular budget warnings.
  Evidence:
- [ ] **49. ADHD-UX audit.** Done when: every screen passes: one primary action, ≤3 choices per decision, no infinite scroll, ≥44px targets, reduced-motion, both themes, no horizontal scroll at 412px.
  Evidence:
- [ ] **50. QA + release.** Done when: manually verified at 412×925 and 1280×800; Lighthouse PWA passes; production build deployed to GitHub Pages; tagged v2.0.
  Evidence:
