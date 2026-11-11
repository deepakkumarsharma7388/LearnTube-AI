
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Automatically load admin token (no login screen)
const TOKEN =
  import.meta.env.VITE_ADMIN_TOKEN ||
  localStorage.getItem("token") ||
  "";

function App() {
  const [recs, setRecs] = useState([]);
  const [paste, setPaste] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [msg, setMsg] = useState("");
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  const headers = {
    "X-Admin-Token": TOKEN
  };

  const load = async () => {
    if (!TOKEN) {
      setMsg("Admin token is not configured. Check frontend .env.");
      return;
    }

    try {
      const r = await fetch(`${API}/api/recordings`, {
        headers
      });

      const j = await r.json();

      if (r.ok) {
        setRecs(j);
        setMsg("");
      } else {
        setMsg(j.message || "Unable to load lectures.");
      }
    } catch {
      setMsg("Cannot connect to backend. Start Node.js first.");
    }
  };

  useEffect(() => {
    load();

    const t = setInterval(load, 4000);

    return () => clearInterval(t);
  }, []);

  const imp = async () => {
    if (!paste.trim()) {
      setMsg("Please paste your YouTube or Drive links.");
      return;
    }

    try {
      const r = await fetch(`${API}/api/import`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: paste })
      });

      const j = await r.json();

      setMsg(
        r.ok
          ? `Added ${j.added}. AI notes are processing automatically.`
          : j.message || "Import failed"
      );

      if (r.ok) {
        setPaste("");
        setTab("classes");
        load();
      }
    } catch {
      setMsg("Import failed. Check backend.");
    }
  };

  const process = async id => {
    try {
      setMsg("AI processing started...");

      const r = await fetch(
        `${API}/api/recordings/${id}/process`,
        {
          method: "POST",
          headers
        }
      );

      const j = await r.json();

      if (!r.ok) {
        setMsg(j.message || "AI processing failed.");
      }

      load();
    } catch {
      setMsg("Could not connect to backend.");
    }
  };

  const del = async id => {
    if (!confirm("Delete this lecture?")) return;

    try {
      const r = await fetch(`${API}/api/recordings/${id}`, {
        method: "DELETE",
        headers
      });

      if (!r.ok) {
        const j = await r.json();
        setMsg(j.message || "Delete failed.");
        return;
      }

      setSelected(null);
      setMsg("Lecture deleted successfully.");
      load();
    } catch {
      setMsg("Could not delete lecture.");
    }
  };

  const delAll = async () => {
    if (!confirm(`Delete all ${recs.length} lectures?`)) return;

    try {
      const r = await fetch(`${API}/api/recordings`, {
        method: "DELETE",
        headers
      });

      if (!r.ok) {
        setMsg("Unable to delete lectures.");
        return;
      }

      setMsg("All lectures deleted.");
      load();
    } catch {
      setMsg("Could not connect to backend.");
    }
  };

  const ask = async e => {
    e?.preventDefault();

    if (!question.trim()) return;

    setAsking(true);
    setAnswer(null);

    try {
      const r = await fetch(`${API}/api/ask`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
      });

      const j = await r.json();

      setAnswer(j);
    } catch {
      setAnswer({
        answer: "Could not connect to the AI service."
      });
    } finally {
      setAsking(false);
    }
  };

  const shown = useMemo(
    () =>
      recs.filter(r =>
        `${r.title} ${r.original} ${r.source} ${(r.topics || []).join(" ")}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [recs, q]
  );

  const ready = recs.filter(r => r.status === "ready").length;

  return (
    <div className="app">

      <aside>
        <div className="brand">
          LearnTube <span>AI</span>
        </div>

        <p className="side-title">AI LEARNING WORKSPACE</p>

        {[
          "dashboard",
          "import",
          "classes",
          "ai chat",
          "revision",
          "roadmap"
        ].map(x => (
          <button
            key={x}
            className={tab === x ? "on" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}

        <small>Node.js · MongoDB Atlas · AI</small>
      </aside>

      <main>

        <header>
          <div>
            <label>AI-POWERED VIDEO LEARNING WORKSPACE</label>
            <h1>LearnTube AI</h1>
            <p>
              Import lectures, generate notes automatically,
              and ask questions across your entire course.
            </p>
          </div>

          <div className="avatar">AI</div>
        </header>

        {msg && <div className="notice">{msg}</div>}

        {tab === "dashboard" && (
          <>
            <div className="stats">

              <div>
                <small>Days Covered</small>
                <b>{new Set(recs.map(x => x.day)).size} / 90</b>
              </div>

              <div>
                <small>Lectures</small>
                <b>{recs.length}</b>
              </div>

              <div>
                <small>AI Ready</small>
                <b>{ready}</b>
              </div>

              <div>
                <small>Pending AI</small>
                <b>
                  {recs.filter(r => r.status !== "ready").length}
                </b>
              </div>

            </div>

            <section className="grid">

              <div className="card">
                <h2>Recent Lectures</h2>

                {recs.slice(-6).reverse().map(r => (
                  <Row
                    key={r._id}
                    r={r}
                    onOpen={setSelected}
                    onDelete={del}
                    onProcess={process}
                  />
                ))}
              </div>

              <div className="card">
                <h2>Import Lectures</h2>

                <p>
                  Paste WhatsApp text containing one or more
                  YouTube/Drive links. AI processing starts automatically.
                </p>

                <textarea
                  value={paste}
                  onChange={e => setPaste(e.target.value)}
                  placeholder={"Day 21\nSEO Strategy\nhttps://youtu.be/..."}
                />

                <button onClick={imp}>
                  Import + Generate AI Notes
                </button>
              </div>

            </section>
          </>
        )}

        {tab === "import" && (
          <section className="card">
            <h2>Import Lectures</h2>

            <p>
              Paste your complete WhatsApp message.
              Multiple links are supported.
            </p>

            <textarea
              value={paste}
              onChange={e => setPaste(e.target.value)}
              placeholder={"Day 21\nSEO Strategy\nhttps://youtu.be/..."}
            />

            <button onClick={imp}>
              Import + Generate AI Notes
            </button>
          </section>
        )}

        {tab === "classes" && (
          <section className="card">

            <div className="toolbar">
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search lectures, topics, titles..."
              />

              <button className="danger" onClick={delAll}>
                Delete All
              </button>
            </div>

            {shown.map(r => (
              <Row
                key={r._id}
                r={r}
                onOpen={setSelected}
                onDelete={del}
                onProcess={process}
              />
            ))}

          </section>
        )}

        {tab === "ai chat" && (
          <section className="card chat">

            <h2>Ask Across All Lectures</h2>

            <p>
              Ask anything. The assistant searches your
              AI-processed lecture notes and transcript material
              before answering.
            </p>

            <form onSubmit={ask} className="ask">

              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What did the lectures teach about keyword research?"
              />

              <button disabled={asking}>
                {asking ? "Thinking..." : "Ask AI"}
              </button>

            </form>

            {answer && (
              <div className="answer">

                <h3>Answer</h3>

                <div className="markdown">
                  {answer.answer}
                </div>

                {answer.sources?.length > 0 && (
                  <>
                    <h4>Sources from your lectures</h4>

                    {answer.sources.map(s => (
                      <div className="source" key={s.id}>
                        Day {s.day} — {s.title}
                      </div>
                    ))}
                  </>
                )}

              </div>
            )}

          </section>
        )}

        {tab === "revision" && (
          <section className="card">

            <h2>AI Revision Hub</h2>

            <p>
              Open any processed lecture to review its generated notes.
            </p>

            {recs.map(r => (
              <div className="revision" key={r._id}>

                <div>
                  <b>Day {r.day} — {r.title}</b>

                  <span>
                    {r.status} · {(r.topics || []).join(" · ")}
                  </span>
                </div>

                <button onClick={() => setSelected(r)}>
                  View Notes
                </button>

              </div>
            ))}

          </section>
        )}

        {tab === "roadmap" && (
          <section className="card">

            <h2>90-Day Roadmap</h2>

            {[
              ["Phase 1", "1–15", "Strategy & foundations"],
              ["Phase 2", "16–30", "SEO, content & social"],
              ["Phase 3", "31–45", "Social & branding"],
              ["Phase 4", "46–60", "Paid advertising"],
              ["Phase 5", "61–75", "AI & automation"],
              ["Phase 6", "76–85", "Analytics & CRO"],
              ["Phase 7", "86–90", "Capstone & certification"]
            ].map(p => (
              <div className="phase" key={p[0]}>
                <b>{p[0]} · Days {p[1]}</b>
                <span>{p[2]}</span>
              </div>
            ))}

          </section>
        )}

      </main>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >

          <div
            className="modal"
            onClick={e => e.stopPropagation()}
          >

            <div className="modal-head">

              <div>
                <small>DAY {selected.day}</small>
                <h2>{selected.title}</h2>
              </div>

              <button onClick={() => setSelected(null)}>
                ×
              </button>

            </div>

            <div className="actions">

              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
              >
                Open Original Lecture ↗
              </a>

              {selected.status !== "ready" && (
                <button onClick={() => process(selected._id)}>
                  Process AI
                </button>
              )}

              <button
                className="danger"
                onClick={() => del(selected._id)}
              >
                Delete
              </button>

            </div>

            {selected.status === "ready" ? (
              <div className="notes">
                {selected.notes}
              </div>
            ) : (
              <div className="processing">

                <b>
                  {selected.status === "processing"
                    ? "AI is processing this lecture..."
                    : selected.status === "error"
                    ? "AI processing failed."
                    : "Waiting for AI processing..."}
                </b>

                <p>
                  {selected.aiError || "Refresh after a few seconds."}
                </p>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

function Row({ r, onOpen, onDelete, onProcess }) {
  return (
    <div className="row">

      <div>
        <b>Day {r.day} — {r.title}</b>

        <small>
          {r.source} · {r.status}
        </small>

        <em>
          {(r.topics || []).join(" · ")}
        </em>
      </div>

      <div className="row-actions">

        <a
          href={r.url}
          target="_blank"
          rel="noreferrer"
        >
          Open
        </a>

        <button onClick={() => onOpen(r)}>
          Notes
        </button>

        {r.status !== "ready" && (
          <button onClick={() => onProcess(r._id)}>
            AI
          </button>
        )}

        <button
          className="danger"
          onClick={() => onDelete(r._id)}
        >
          Delete
        </button>

      </div>

    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
