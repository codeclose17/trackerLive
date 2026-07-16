# Cadence — ADHD Time & Focus Tracker

A 14-day × 24-hour pixel-painting time tracker, rebuilt with a cohesive ADHD-helper identity. Paint hours by category (Sleep/Work/Learn/Social/Exercise), add daily reflections, track binge sessions, and learn from a built-in knowledge base.

**Live:** https://codeclose17.github.io/trackerLive/

## Features

- **Time Grid:** Paint 24-hour days across 14 days with click-and-drag
- **Daily Notes:** Reflections and insights for each day
- **Binge Counter:** Track distraction/impulse sessions
- **Stats & Insights:** ADHD-aware metrics with actionable feedback
- **Learn Tab:** 19-chapter ADHD knowledge base (genetics, neurochemistry, interventions)
- **Light/Dark Mode:** Single cohesive identity in both themes
- **Cloud Sync:** Optional Supabase real-time sync
- **Backup/Import:** Export and restore your data

## Development

```bash
# Install dependencies
npm install

# Dev server (auto-reload)
ng serve --port 4200

# Production build
npm run build

# Deploy to GitHub Pages
npx angular-cli-ghpages --dir=dist/trackerlive/browser
```

## Deployment

The app is deployed to GitHub Pages via `gh-pages` branch. After building, use:

```bash
npx angular-cli-ghpages --dir=dist/trackerlive/browser
```

This creates a commit on the `gh-pages` branch and pushes it. GitHub Pages then serves https://codeclose17.github.io/trackerLive/.

## Tech Stack

- **Angular 18** (standalone components)
- **Supabase** (optional real-time sync)
- **TypeScript**
- **CSS** (design tokens, light/dark)

## ADHD-First Design

The app centers ADHD neurobiology:
- Executive function tracking (categorize time to build self-awareness)
- Dopamine-aware insights (binge frequency, sleep quality, focus patterns)
- Low-friction UI (keyboard shortcuts, minimal clicks)
- Embedded knowledge base (understand the "why" behind recommendations)
