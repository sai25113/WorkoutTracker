const express = require("express");
const cors = require("cors");
const dayjs = require("dayjs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB connection
// In production, move this connection string to an environment variable.
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://bssr841_db_user:wqkKyIXc3E1BJszS@homegymcluster.nncmrm6.mongodb.net/?appName=HomeGymCluster";
const DB_NAME = process.env.MONGO_DB_NAME || "homegym";

let db;
let Exercises;
let WorkoutLogs;

// Middleware
app.use(cors());
app.use(express.json());

async function initMongo() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  Exercises = db.collection("exercises");
  WorkoutLogs = db.collection("workout_logs");

  // Indexes for faster lookups
  await Exercises.createIndex({ name: 1, category: 1 });
  await WorkoutLogs.createIndex({ date: 1, exercise_id: 1 });

  // Seed a few default home-friendly exercises if the collection is empty
  const count = await Exercises.estimatedDocumentCount();
  if (count === 0) {
    const now = dayjs().toISOString();
    const seedExercises = [
      {
        name: "Dumbbell Goblet Squat",
        category: "Legs",
        equipment: "Dumbbells",
        instructions:
          "Stand with feet shoulder-width apart, hold a dumbbell vertically close to your chest. Sit your hips back and down into a squat while keeping your chest tall, then drive through your heels to stand back up.",
        breathing:
          "Inhale as you lower into the squat, exhale as you stand up.",
      },
      {
        name: "Dumbbell Romanian Deadlift",
        category: "Legs",
        equipment: "Dumbbells",
        instructions:
          "Stand tall holding dumbbells in front of your thighs. Hinge at the hips with a slight knee bend, sliding the dumbbells down your legs while keeping your back flat. Feel the stretch in your hamstrings, then squeeze your glutes to return to standing.",
        breathing:
          "Inhale as you hinge down, exhale as you return to standing.",
      },
      {
        name: "Resistance Band Row",
        category: "Back",
        equipment: "Bands",
        instructions:
          "Anchor the band at foot or door level. Sit or stand tall holding the handles, arms extended. Pull the handles toward your ribcage, squeezing your shoulder blades together, then slowly return to the start.",
        breathing: "Exhale as you pull the band, inhale as you return.",
      },
      {
        name: "Push-Up on Mat",
        category: "Chest",
        equipment: "Mat",
        instructions:
          "Place hands slightly wider than shoulder-width on the mat, body in a straight line from head to heels or knees. Lower your chest toward the mat while keeping elbows at about a 45-degree angle, then press back up.",
        breathing: "Inhale as you lower, exhale as you press up.",
      },
      {
        name: "Side Plank",
        category: "Core",
        equipment: "Mat",
        instructions:
          "Lie on your side with your elbow under your shoulder, legs stacked. Lift your hips off the mat, forming a straight line from head to feet. Hold while keeping your core tight, then switch sides.",
        breathing: "Breathe slowly and steadily throughout the hold.",
      },
      {
        name: "Banded Glute Bridge",
        category: "Legs",
        equipment: "Bands",
        instructions:
          "Lie on your back on the mat with knees bent and feet flat, band looped above your knees. Press your knees slightly out against the band and drive your hips up by squeezing your glutes, then lower under control.",
        breathing: "Exhale as you lift your hips, inhale as you lower them.",
      },
      {
        name: "Bicep Curl",
        category: "Arms",
        equipment: "Dumbbells",
        instructions:
          "Stand tall holding dumbbells at your sides, palms facing forward. Keep elbows close to your ribs and curl the weights up toward your shoulders, then slowly lower back down.",
        breathing: "Exhale as you curl up, inhale as you lower.",
      },
      {
        name: "Tricep Overhead Extension",
        category: "Arms",
        equipment: "Dumbbells",
        instructions:
          "Sit or stand tall holding one or two dumbbells overhead with arms straight. Bend your elbows to lower the weight behind your head, then extend your arms to return to the start.",
        breathing:
          "Inhale as you lower the weight, exhale as you extend your arms.",
      },
    ].map((ex) => ({ ...ex, created_at: now }));

    await Exercises.insertMany(seedExercises);
    console.log("Seeded default HomeGym exercises into MongoDB.");
  }
}

// Ensure DB is initialized before handling requests
// initMongo()
//   .then(() => {
//     console.log('Connected to MongoDB and initialized collections.');
//   })
//   .catch((err) => {
//     console.error('Failed to connect to MongoDB', err);
//   });

async function startServer() {
  try {
    await initMongo();

    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`HomeGym API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB startup failed:", err);
    process.exit(1);
  }
}

startServer();

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "HomeGym API running", db: !!db });
});

// EXERCISES CRUD
app.get("/api/exercises", async (req, res) => {
  try {
    const { category, equipment, search } = req.query;
    const query = {};

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }
    if (equipment) {
      query.equipment = { $regex: new RegExp(`^${equipment}$`, "i") };
    }
    if (search) {
      const s = search.toLowerCase();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { instructions: { $regex: s, $options: "i" } },
      ];
    }

    const rows = await Exercises.find(query).sort({ created_at: -1 }).toArray();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

app.post("/api/exercises", async (req, res) => {
  try {
    const { name, category, equipment, instructions, breathing } = req.body;

    if (!name || !category || !equipment || !instructions || !breathing) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const now = dayjs().toISOString();
    const doc = {
      name,
      category,
      equipment,
      instructions,
      breathing,
      created_at: now,
    };

    const result = await Exercises.insertOne(doc);
    const created = await Exercises.findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create exercise" });
  }
});

app.put("/api/exercises/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, equipment, instructions, breathing } = req.body;

    const updated = await Exercises.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          category,
          equipment,
          instructions,
          breathing,
        },
      },
      {
        returnDocument: "after",
      },
    );

    if (!updated) {
      return res.status(404).json({
        error: "Exercise not found",
      });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

app.delete("/api/exercises/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Exercises.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});

// WORKOUT LOGS
app.get("/api/logs", async (req, res) => {
  try {
    const { from, to, exerciseId } = req.query;
    const query = {};

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }
    if (exerciseId) {
      query.exercise_id = new ObjectId(exerciseId);
    }

    const rows = await WorkoutLogs.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "exercises",
          localField: "exercise_id",
          foreignField: "_id",
          as: "exercise",
        },
      },
      { $unwind: "$exercise" },
      {
        $addFields: {
          exercise_name: "$exercise.name",
          category: "$exercise.category",
          equipment: "$exercise.equipment",
        },
      },
      { $sort: { date: -1, created_at: -1 } },
    ]).toArray();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch workout logs" });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const { date, exercise_id, reps, weight, rpe, notes } = req.body;

    if (!date || !exercise_id || !reps) {
      return res
        .status(400)
        .json({ error: "date, exercise_id, reps required" });
    }

    const now = dayjs().toISOString();
    const doc = {
      date,
      exercise_id: new ObjectId(exercise_id),
      reps: Number(reps),
      weight: weight != null ? Number(weight) : null,
      rpe: rpe != null ? Number(rpe) : null,
      notes: notes || null,
      created_at: now,
    };

    const result = await WorkoutLogs.insertOne(doc);

    const created = await WorkoutLogs.aggregate([
      { $match: { _id: result.insertedId } },
      {
        $lookup: {
          from: "exercises",
          localField: "exercise_id",
          foreignField: "_id",
          as: "exercise",
        },
      },
      { $unwind: "$exercise" },
      {
        $addFields: {
          exercise_name: "$exercise.name",
          category: "$exercise.category",
          equipment: "$exercise.equipment",
        },
      },
    ]).toArray();

    res.status(201).json(created[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create workout log" });
  }
});

// ANALYTICS
app.get("/api/analytics/summary", async (req, res) => {
  try {
    const { period = "today" } = req.query;
    const today = dayjs().startOf("day");

    let from;
    if (period === "today") {
      from = today;
    } else if (period === "week") {
      from = today.subtract(6, "day");
    } else if (period === "month") {
      from = today.subtract(29, "day");
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }

    const fromStr = from.format("YYYY-MM-DD");
    const toStr = today.add(1, "day").format("YYYY-MM-DD");

    const rows = await WorkoutLogs.aggregate([
      {
        $match: {
          date: { $gte: fromStr, $lt: toStr },
        },
      },
      {
        $group: {
          _id: "$exercise_id",
          sessions: { $sum: 1 },
          total_reps: { $sum: "$reps" },
        },
      },
      {
        $lookup: {
          from: "exercises",
          localField: "_id",
          foreignField: "_id",
          as: "exercise",
        },
      },
      { $unwind: "$exercise" },
      {
        $project: {
          exercise_id: "$_id",
          sessions: 1,
          total_reps: 1,
          name: "$exercise.name",
          category: "$exercise.category",
          equipment: "$exercise.equipment",
          _id: 0,
        },
      },
      { $sort: { total_reps: -1 } },
    ]).toArray();

    res.json({ period, from: fromStr, to: toStr, exercises: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
});

app.get("/api/analytics/progression/:exerciseId", async (req, res) => {
  try {
    const { exerciseId } = req.params;

    const rows = await WorkoutLogs.aggregate([
      { $match: { exercise_id: new ObjectId(exerciseId) } },
      {
        $group: {
          _id: "$date",
          total_reps: { $sum: "$reps" },
          max_weight: { $max: "$weight" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          total_reps: 1,
          max_weight: 1,
        },
      },
      { $sort: { date: 1 } },
    ]).toArray();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch progression data" });
  }
});

// QUICK TEMPLATES (static for now)
app.get("/api/templates", (req, res) => {
  res.json([
    {
      id: "full_body_dumbbell",
      name: "Full Body (Dumbbells)",
      description: "Simple full-body routine using dumbbells.",
      focus: "Full Body",
      suggestedExercises: [
        "Goblet Squat",
        "Dumbbell Romanian Deadlift",
        "Dumbbell Bench Press or Floor Press",
        "One-Arm Dumbbell Row",
        "Standing Shoulder Press",
        "Bicep Curl",
        "Tricep Overhead Extension",
      ],
    },
    {
      id: "band_core_mobility",
      name: "Bands + Mat Core & Mobility",
      description: "Low-impact band and mat session for core and mobility.",
      focus: "Core / Mobility",
      suggestedExercises: [
        "Banded Glute Bridge",
        "Dead Bug on Mat",
        "Side Plank",
        "Banded Row",
        "Cat-Cow",
        "Child's Pose",
      ],
    },
  ]);
});

app.use((req, res, next) => {
  if (!Exercises || !WorkoutLogs) {
    return res.status(503).json({
      error: "Database not initialized",
    });
  }
  next();
});

// Serve built React app in production only
const clientBuildPath = path.join(__dirname, "..", "client", "dist");
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  app.use(express.static(clientBuildPath));

  // Catch-all for non-API routes (Express 5 compatible)
  app.get(/^\/(?!api).*/, (req, res) => {
    return res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`HomeGym API listening on http://localhost:${PORT}`);
});
