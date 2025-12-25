Perfect. Below is a **FULL, SERIOUS PRD** for **BrainSprint** — written like something you’d hand to a **design + engineering team** or use yourself as a solo founder.

This is **not** a generic test app. This is a **game-first exam-prep platform**.

---

# 🧠 BrainSprint – Product Requirements Document (PRD)

## 1. Product Overview

### Product Name

**BrainSprint**

### Tagline

**Think Faster. Solve Smarter. Win Exams.**

### Product Type

Interactive Web Application (Game-based Learning Platform)

### Target Platform

* Web (Desktop + Mobile-first)
* Built with **Next.js**
* Backend with **Supabase**

---

## 2. Problem Statement

Most exam-prep apps today suffer from:

* Boring MCQ-only formats
* Long text-based questions
* Low retention & burnout
* No real engagement or dopamine loop

Students **know what to study**, but:

* They struggle with **speed**
* They fail under **time pressure**
* They can’t *visualize* reasoning problems

---

## 3. BrainSprint Solution

BrainSprint transforms **Reasoning & Maths** into:

* Interactive games
* Visual puzzles
* Timed brain sprints
* XP-driven progression

👉 Users don’t “practice questions”
👉 They **play**, **compete**, and **level up**

---

## 4. Target Users

### Primary

* SSC (CGL, CHSL, MTS)
* IBPS (PO, Clerk, RRB)
* Railway (NTPC, Group D)

### Secondary

* College students
* Anyone wanting to improve mental ability

---

## 5. Core Product Philosophy (Very Important)

BrainSprint is **NOT**:
❌ A mock test site
❌ A PDF-based practice app
❌ A coaching replacement

BrainSprint **IS**:
✅ A skill-building engine
✅ A daily brain gym
✅ A competitive game

---

## 6. App Structure (High Level)

```
Home
├── Reasoning
│   ├── Seating Arrangement
│   ├── Direction Sense
│   ├── Coding-Decoding
│   ├── Blood Relations
│   ├── Inequality
│   └── Puzzles
│
├── Maths
│   ├── Simplification
│   ├── Percentage
│   ├── Ratio & Proportion
│   ├── Profit & Loss
│   └── Time & Work
│
├── Sprint Mode
├── Leaderboard
├── Profile
└── Store / Premium
```

Each **subject has its own dedicated page**
Each **topic has its own mini-game system**

---

## 7. Core Features (MVP)

### 7.1 Topic-wise Interactive Games (🔥 USP)

Each topic is a **game**, not a test.

#### Example: Seating Arrangement

* Drag & drop people
* Rotate circular tables
* Highlight left/right/opposite
* Lock constraints visually
* Auto-detect conflicts
* Step-by-step replay

#### Example: Simplification (Maths)

* Falling expressions
* Choose correct result before time runs out
* Combo streaks
* Speed multipliers

---

### 7.2 XP & Level System

* Every action gives XP
* Wrong answer still gives learning XP
* Levels unlock:

  * New game modes
  * Higher difficulty
  * Advanced tricks

**XP Formula (example):**

```
XP = BaseXP + SpeedBonus + AccuracyBonus
```

---

### 7.3 Leaderboard System

Leaderboards:

* Daily
* Weekly
* Monthly
* Topic-wise

Filters:

* Friends
* Global
* Exam-specific (SSC / IBPS)

Purpose:
👉 Competitive pressure
👉 Daily return habit

---

### 7.4 Sprint Mode (🔥 Addiction Engine)

* 10 questions
* 10 minutes
* Mixed Reasoning + Maths
* No pause
* Exam pressure simulation

Rewards:

* High XP
* Special badges
* Leaderboard rank boost

---

### 7.5 AI Explain Mode (Phase 1.5)

Using Gemini API:

* Explain *why* answer is wrong
* Show shortcut methods
* Suggest which topic to practice next
* Generate similar practice instantly

---

## 8. UI / UX Design Principles

### Core Feel

* Clean
* Fast
* Energetic
* Minimal text
* High contrast

### Interaction Rules

* Every click = feedback
* Animations are short & snappy
* No page should feel static

---

## 9. Color Theme (Based on Your Logo)

### Primary Colors

* **Coral / Neon Orange** → `#FF6B5E`

  * Energy
  * Speed
  * Brain activity

* **Deep Teal / Cyan** → `#0D9488`

  * Focus
  * Intelligence
  * Calm contrast

### Background

* **Near Black** → `#0B0F14`
* **Dark Navy** → `#0F172A`

### Accent

* Electric Yellow → `#FACC15` (XP, highlights)
* Soft White → `#E5E7EB` (text)

### Usage Rule

* Dark background always
* Bright colors only for actions & rewards
* XP, streaks, lightning = glow effect

---

## 10. Typography

* **Primary Font:** Inter / Poppins
* **Numbers:** JetBrains Mono (for maths clarity)

Hierarchy:

* Headings: Bold
* Game text: Medium
* Explanations: Regular

---

## 11. Tech Stack

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Framer Motion
* Canvas / SVG (games)

### Backend

* Supabase

  * Auth
  * Database
  * Realtime leaderboards

### AI

* Gemini API

  * Explanation
  * Adaptive difficulty
  * Question generation

---

## 12. Database Schema (Simplified)

### Users

* id
* name
* xp
* level
* streak
* created_at

### Progress

* user_id
* subject
* topic
* accuracy
* speed
* attempts

### Leaderboard

* user_id
* score
* timeframe
* category

---

## 13. Monetization Strategy

### Free

* Daily limits
* Basic games
* Community leaderboard

### Premium

* Unlimited play
* AI explanations
* Advanced Sprint Mode
* Exam-specific packs

### Institutions (Future)

* White-labeled access
* Coaching dashboards

---

## 14. Roadmap

### Phase 1 (0–30 days)

* Core UI
* Reasoning + Maths basics
* XP + leaderboard

### Phase 2 (30–60 days)

* Sprint Mode
* AI explanations
* More games

### Phase 3 (60–90 days)

* Multiplayer duels
* Creator challenges
* Community events

---

## 15. Success Metrics

* Daily Active Users (DAU)
* Avg session time (target: 15+ min)
* Retention (D7, D30)
* Sprint completion rate
* XP earned per user/day

---

## 16. Final Vision

**BrainSprint is not an exam app.**
It’s a **mental performance engine**.

If done right:

* Users open it daily
* They *feel* smarter
* Exams become a side-effect

---

### 🔥 What do you want next?

1️⃣ Landing page copy
2️⃣ Next.js folder + starter code
3️⃣ Seating Arrangement game engine (core USP)
4️⃣ XP + leaderboard logic

Say the number and we go deep.
