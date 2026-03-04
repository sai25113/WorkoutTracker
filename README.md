## HomeGym - Home Workout Tracker

HomeGym is a full-stack home workout app tailored for workouts with **dumbbells**, **resistance bands**, and a **yoga mat**. It lets you:

- **Manage exercises** with categories, step-by-step instructions, breathing patterns, and equipment tags.
- **Log workouts** (exercise, reps, optional weight, RPE, and notes) per day/session.
- **View analytics**: exercise summaries (today/week/month) and a **strength progression chart** per exercise.

### Folder structure

```text
GApp/
  client/        # React SPA (HomeGym UI)
  server/        # Node.js + Express + SQLite API
```

### Quick start

1. **Server**

```bash
cd server
npm install
npm run dev   # or: npm start
```

This creates `homegym.db` (SQLite) on first run and sets up all tables.

2. **Client**

```bash
cd client
npm install
npm start
```

The client dev server will start (usually at `http://localhost:8080`) and talk to the API at `http://localhost:4000/api`.

### Example exercise JSON

```json
{
  "name": "Bicep Curl",
  "category": "Arms",
  "instructions": "Hold dumbbells, curl upward slowly...",
  "breathing": "Exhale on lift, inhale on lower"
}
```

### Core concepts

- **Exercises**
  - name, category (Arms, Legs, Core, Back, Chest, Shoulders, Full Body)
  - equipment (Dumbbells, Bands, Mat, Bodyweight)
  - instructions (step-by-step text)
  - breathing pattern
- **Workout logs**
  - date (per session)
  - exercise reference
  - reps
  - optional weight (for dumbbells or band difficulty note)
  - optional perceived exertion (RPE 1–10)
  - optional notes

### Extra home-friendly features

- **Equipment filters** so you can quickly see what you can do with dumbbells vs bands vs mat only.
- **Quick-start templates** in the UI (e.g., Full Body, Push, Pull, Core focus) using the same exercise catalog.
- **Notes + RPE** per set so you can track how hard a session felt without complicated metrics.

