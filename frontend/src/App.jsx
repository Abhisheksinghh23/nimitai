import { useState } from "react";

const SAMPLE_TRANSCRIPT = `Rep: Thanks for hopping on. So, we've been looking at your team's workflow and I think there's a real fit here.
Prospect: Yeah, we've been exploring options. What does pricing look like?
Rep: Pricing is $499/seat/month. But given your team size, we can work something out.
Prospect: That seems steep. We pay under $200 currently.
Rep: If your team closes one extra deal per quarter, it pays for itself 10x. The ROI is significant.
Prospect: I suppose. But what exactly is different about your tool vs what we have?
Rep: We integrate directly with your CRM, give real-time call coaching, and auto-summarise every call.
Prospect: Hmm, we already have a tool that does summaries.
Rep: How accurate are those summaries? Ours are trained on 10 million sales calls.
Prospect: Not always great, honestly. Sometimes I have no idea what the next steps were.
Rep: Exactly — our system surfaces next steps automatically, with confidence scores.
Prospect: That actually sounds interesting. Can you send me a pricing deck? I'll get back to you after I review it with the team.`;

// Map signal types to colors and icons
const SIGNAL_META = {
  buying_interest:    { color: "#00c896", icon: "🟢", label: "Buying Interest" },
  objection:         { color: "#ff5c5c", icon: "🔴", label: "Objection" },
  confusion:         { color: "#ffa94d", icon: "🟠", label: "Confusion" },
  pricing_concern:   { color: "#ff6b9d", icon: "💰", label: "Pricing Concern" },
  competitor_mention:{ color: "#9b8afb", icon: "⚔️",  label: "Competitor Mention" },
  next_step:         { color: "#4fc3f7", icon: "➡️", label: "Next Step" },
  hesitation:        { color: "#ffd43b", icon: "⏸️", label: "Hesitation" },
};

function getSignalMeta(type) {
  return SIGNAL_META[type] || { color: "#aaa", icon: "📌", label: type.replace(/_/g, " ") };
}

function SignalCard({ signal, index }) {
  const meta = getSignalMeta(signal.type);
  return (
    <div
      className="signal-card"
      style={{ "--accent": meta.color, animationDelay: `${index * 80}ms` }}
    >
      <div className="signal-card__header">
        <span className="signal-card__icon">{meta.icon}</span>
        <span className="signal-card__type">{meta.label}</span>
      </div>
      <blockquote className="signal-card__quote">"{signal.quote}"</blockquote>
      <div className="signal-card__tip">
        <span className="tip-label">Coach tip</span>
        <span className="tip-text">{signal.tip}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [signals, setSignals]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [isMock, setIsMock]         = useState(false);

  async function handleAnalyse() {
    if (!transcript.trim()) {
      setError("Please paste a transcript before analysing.");
      return;
    }
    setLoading(true);
    setError(null);
    setSignals(null);
    setIsMock(false);

    try {
      const res = await fetch("http://localhost:5000/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setSignals(data.signals);
      setIsMock(!!data._mock);
    } catch (err) {
      setError(err.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function handleSample() {
    setTranscript(SAMPLE_TRANSCRIPT);
    setSignals(null);
    setError(null);
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app__header">
        <div className="header__badge">NimitAI</div>
        <h1 className="app__title">Meeting Transcript<br />Signal Analyzer</h1>
        <p className="app__subtitle">
          Paste any sales call transcript and instantly surface buying signals,
          objections, and coaching opportunities.
        </p>
      </header>

      {/* ── Input Panel ── */}
      <main className="app__main">
        <section className="input-section">
          <div className="input-section__toolbar">
            <label className="input-label">Transcript</label>
            <button className="btn-sample" onClick={handleSample} type="button">
              Load sample ↓
            </button>
          </div>

          <textarea
            className="transcript-input"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your sales call transcript here…"
            rows={12}
          />

          <button
            className={`btn-analyse ${loading ? "btn-analyse--loading" : ""}`}
            onClick={handleAnalyse}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" /> Analysing…
              </>
            ) : (
              "Analyse Transcript →"
            )}
          </button>
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Results ── */}
        {signals && (
          <section className="results-section">
            <div className="results-header">
              <h2 className="results-title">
                {signals.length} signal{signals.length !== 1 ? "s" : ""} detected
              </h2>
              {isMock && (
                <span className="mock-badge">Demo mode — add GEMINI_API_KEY for real analysis</span>
              )}
            </div>

            {signals.length === 0 ? (
              <p className="no-signals">No signals detected in this transcript.</p>
            ) : (
              <div className="signals-grid">
                {signals.map((s, i) => (
                  <SignalCard key={i} signal={s} index={i} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="app__footer">
        Built for NimitAI Intern Assignment
      </footer>
    </div>
  );
}
