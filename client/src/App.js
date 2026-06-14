import React, { useEffect, useMemo, useState } from "react";
import api from "./api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

const CATEGORIES = [
  "Arms",
  "Legs",
  "Core",
  "Back",
  "Chest",
  "Shoulders",
  "Full Body",
];

const EQUIPMENT = ["Dumbbells", "Bands", "Mat", "Bodyweight"];

function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`tab-button ${active ? "active" : ""}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ExerciseForm({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    category: "Arms",
    equipment: "Dumbbells",
    instructions: "",
    breathing: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.instructions || !form.breathing) {
      setError("Please fill out name, instructions, and breathing.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/exercises", form);
      onCreated(res.data);
      setForm({
        name: "",
        category: "Arms",
        equipment: "Dumbbells",
        instructions: "",
        breathing: "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to save exercise.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Add Exercise</h2>
      {error && <div className="error">{error}</div>}
      <div className="form-row">
        <label>
          Name
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Bicep Curl"
          />
        </label>
      </div>
      <div className="form-row two-col">
        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Equipment
          <select
            name="equipment"
            value={form.equipment}
            onChange={handleChange}
          >
            {EQUIPMENT.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Instructions
          <textarea
            name="instructions"
            value={form.instructions}
            onChange={handleChange}
            rows={4}
            placeholder="Hold dumbbells at your sides, curl upward slowly..."
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Breathing Pattern
          <input
            type="text"
            name="breathing"
            value={form.breathing}
            onChange={handleChange}
            placeholder="Exhale on lift, inhale on lower"
          />
        </label>
      </div>
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Exercise"}
      </button>
    </form>
  );
}

function ExerciseList({
  exercises,
  onSelect,
  selectedId,
  filters,
  setFilters,
}) {
  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (filters.category && ex.category !== filters.category) return false;
      if (filters.equipment && ex.equipment !== filters.equipment) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        return (
          ex.name.toLowerCase().includes(s) ||
          ex.instructions.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [exercises, filters]);

  return (
    <div className="card">
      <h2>Exercises</h2>
      <div className="filters">
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category: e.target.value }))
          }
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filters.equipment}
          onChange={(e) =>
            setFilters((f) => ({ ...f, equipment: e.target.value }))
          }
        >
          <option value="">All equipment</option>
          {EQUIPMENT.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name or cue"
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
        />
      </div>
      <div className="exercise-list">
        {filtered.length === 0 && (
          <div className="muted">No exercises yet. Add one on the left.</div>
        )}
        {filtered.map((ex) => (
          <button
            key={ex._id}
            type="button"
            className={`exercise-item ${
              selectedId === ex._id ? "selected" : ""
            }`}
            onClick={() => onSelect(ex)}
          >
            <div className="exercise-header">
              <span className="exercise-name">{ex.name}</span>
              <span className="exercise-pill">
                {ex.category} • {ex.equipment}
              </span>
            </div>
            <div className="exercise-breathing">{ex.breathing}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkoutLogForm({ exercises, onLogged }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    exercise_id: "",
    reps: "",
    weight: "",
    rpe: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.date || !form.exercise_id || !form.reps) {
      setError("Please select exercise, date, and reps.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        date: form.date,
        exercise_id: form.exercise_id,
        reps: Number(form.reps),
        weight: form.weight ? Number(form.weight) : null,
        rpe: form.rpe ? Number(form.rpe) : null,
        notes: form.notes || null,
      };
      const res = await api.post("/logs", payload);
      onLogged(res.data);
      setForm((prev) => ({
        ...prev,
        reps: "",
        weight: "",
        rpe: "",
        notes: "",
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to save workout log.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Log Workout</h2>
      {error && <div className="error">{error}</div>}
      <div className="form-row two-col">
        <label>
          Date
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
        </label>
        <label>
          Exercise
          <select
            name="exercise_id"
            value={form.exercise_id}
            onChange={handleChange}
          >
            <option value="">Select exercise</option>
            {exercises.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row two-col">
        <label>
          Reps
          <input
            type="number"
            name="reps"
            min="1"
            value={form.reps}
            onChange={handleChange}
          />
        </label>
        <label>
          Weight (kg) / Band Level
          <input
            type="number"
            name="weight"
            min="0"
            step="0.5"
            value={form.weight}
            onChange={handleChange}
          />
        </label>
      </div>
      <div className="form-row two-col">
        <label>
          RPE (1–10)
          <input
            type="number"
            name="rpe"
            min="1"
            max="10"
            value={form.rpe}
            onChange={handleChange}
          />
        </label>
        <label>
          Notes
          <input
            type="text"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Tempo, form cues, band color..."
          />
        </label>
      </div>
      <button className="primary" type="submit" disabled={loading}>
        {loading ? "Logging..." : "Log Set"}
      </button>
    </form>
  );
}

function AnalyticsView({ exercises }) {
  const [period, setPeriod] = useState("today");
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [progression, setProgression] = useState([]);
  const [loadingProg, setLoadingProg] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        const res = await api.get("/analytics/summary", {
          params: { period },
        });
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [period]);

  useEffect(() => {
    const fetchProgression = async () => {
      if (!selectedExerciseId) {
        setProgression([]);
        return;
      }
      try {
        setLoadingProg(true);
        const res = await api.get(
          `/analytics/progression/${selectedExerciseId}`,
        );
        setProgression(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProg(false);
      }
    };
    fetchProgression();
  }, [selectedExerciseId]);

  const progressionChartData = useMemo(() => {
    const labels = progression.map((p) => p.date);
    const repsData = progression.map((p) => p.total_reps);
    const weightData = progression.map((p) => p.max_weight || 0);

    return {
      labels,
      datasets: [
        {
          label: "Total Reps",
          data: repsData,
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.2)",
        },
        {
          label: "Max Weight (kg)",
          data: weightData,
          borderColor: "#16a34a",
          backgroundColor: "rgba(22, 163, 74, 0.2)",
        },
      ],
    };
  }, [progression]);

  return (
    <div className="card analytics-card">
      <h2>Analytics</h2>
      <div className="analytics-top">
        <div className="period-toggle">
          {["today", "week", "month"].map((p) => (
            <button
              key={p}
              type="button"
              className={period === p ? "chip active" : "chip"}
              onClick={() => setPeriod(p)}
            >
              {p === "today"
                ? "Today"
                : p === "week"
                  ? "Last 7 days"
                  : "Last 30 days"}
            </button>
          ))}
        </div>
        {loadingSummary && <div className="muted small">Loading summary…</div>}
        {summary && (
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Category</th>
                <th>Equipment</th>
                <th>Sessions</th>
                <th>Total Reps</th>
              </tr>
            </thead>
            <tbody>
              {summary.exercises.length === 0 && (
                <tr>
                  <td colSpan="5" className="muted">
                    No logs yet for this period.
                  </td>
                </tr>
              )}
              {summary.exercises.map((row) => (
                <tr key={row.exercise_id}>
                  <td>{row.name}</td>
                  <td>{row.category}</td>
                  <td>{row.equipment}</td>
                  <td>{row.sessions}</td>
                  <td>{row.total_reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="analytics-bottom">
        <div className="form-row">
          <label>
            Strength progression exercise
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
            >
              <option value="">Select exercise</option>
              {exercises.map((ex) => (
                <option key={ex._id} value={ex._id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loadingProg && (
          <div className="muted small">Loading progression data…</div>
        )}
        {!loadingProg && progression.length === 0 && selectedExerciseId && (
          <div className="muted small">
            No progression data yet. Log a few sessions first.
          </div>
        )}
        {progression.length > 0 && (
          <div className="chart-wrapper">
            <Line
              data={progressionChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TemplatesPanel() {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get("/templates");
        setTemplates(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <div className="card">
      <h2>Quick Start Plans</h2>
      <p className="muted small">
        Use these as inspiration with your current exercise list. Tap into
        dumbbells, bands, and your mat without needing a full gym.
      </p>
      <div className="templates-grid">
        {templates.map((tpl) => (
          <div key={tpl._id} className="template-card">
            <div className="template-title">{tpl.name}</div>
            <div className="template-focus">{tpl.focus}</div>
            <p className="template-description">{tpl.description}</p>
            <ul className="template-list">
              {tpl.suggestedExercises.map((ex) => (
                <li key={ex}>{ex}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [exercises, setExercises] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    equipment: "",
    search: "",
  });
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [activeTab, setActiveTab] = useState("train");

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await api.get("/exercises");
        setExercises(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchLogs = async () => {
      try {
        const res = await api.get("/logs");
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExercises();
    fetchLogs();
  }, []);

  const handleExerciseCreated = (exercise) => {
    setExercises((prev) => [exercise, ...prev]);
  };

  const handleLogCreated = (log) => {
    setLogs((prev) => [log, ...prev]);
  };

  const recentLogs = logs.slice(0, 10);

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1>HomeGym</h1>
          <p className="muted">
            Smart tracking for dumbbells, bands, and your mat — all at home.
          </p>
        </div>
        <nav className="tabs">
          <TabButton
            active={activeTab === "train"}
            onClick={() => setActiveTab("train")}
          >
            Train
          </TabButton>
          <TabButton
            active={activeTab === "manage"}
            onClick={() => setActiveTab("manage")}
          >
            Exercises
          </TabButton>
          <TabButton
            active={activeTab === "insights"}
            onClick={() => setActiveTab("insights")}
          >
            Insights
          </TabButton>
        </nav>
      </header>
      <main className="app-main">
        {activeTab === "manage" && (
          <div className="layout-grid">
            <ExerciseForm onCreated={handleExerciseCreated} />
            <ExerciseList
              exercises={exercises}
              selectedId={selectedExercise?._id || null}
              onSelect={setSelectedExercise}
              filters={filters}
              setFilters={setFilters}
            />
          </div>
        )}
        {activeTab === "train" && (
          <div className="layout-grid">
            <WorkoutLogForm exercises={exercises} onLogged={handleLogCreated} />
            <div className="card">
              <h2>Recent Sets</h2>
              {recentLogs.length === 0 && (
                <div className="muted">No workouts logged yet.</div>
              )}
              <ul className="logs-list">
                {recentLogs.map((log) => (
                  <li key={log._id} className="log-item">
                    <div className="log-header">
                      <span className="log-exercise">{log.exercise_name}</span>
                      <span className="log-date">{log.date}</span>
                    </div>
                    <div className="log-meta">
                      <span>{log.reps} reps</span>
                      {log.weight != null && log.weight !== 0 && (
                        <span>{log.weight} kg</span>
                      )}
                      {log.rpe && <span>RPE {log.rpe}</span>}
                    </div>
                    {log.notes && (
                      <div className="log-notes">Notes: {log.notes}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {activeTab === "insights" && (
          <div className="layout-grid">
            <AnalyticsView exercises={exercises} />
            <TemplatesPanel />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
