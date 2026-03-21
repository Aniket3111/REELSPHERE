import TilePoster from "../TilePoster/TilePoster";
import FallbackNotice from "../FallbackNotice/FallbackNotice";
import { normalizeArray } from "../../utils/helpers";
import "./AnalysisResults.css";

export default function AnalysisResults({ data }) {
  const signals = Array.isArray(data.signals) ? data.signals : [];
  const nextPicks = Array.isArray(data.nextPicks) ? data.nextPicks : [];

  return (
    <div className="analysis-layout">
      {data.notice ? <FallbackNotice message={data.notice} /> : null}
      <article className="result-card">
        <h3>{data.profileName || "Taste profile"}</h3>
        <p>{data.overview || ""}</p>
      </article>
      <div className="signal-grid">
        {signals.map((signal, i) => (
          <div key={`${signal.label || "signal"}-${i}`} className="signal-item">
            <div className="signal-row">
              <span>{signal.label || "Signal"}</span>
              <span className="signal-score">{signal.score ?? 0}</span>
            </div>
            <div className="signal-bar-track">
              <div className="signal-bar-fill" style={{ width: `${Math.min(signal.score ?? 0, 100)}%` }} />
            </div>
            <p>{signal.explanation || ""}</p>
          </div>
        ))}
      </div>
      <div className="taste-zones">
        <article className="taste-zone-card">
          <h4>✓ Comfort Zone</h4>
          <div className="meta">
            {normalizeArray(data.comfortZone).map((item) => <span key={item} className="chip chip-comfort">{item}</span>)}
          </div>
        </article>
        <article className="taste-zone-card taste-zone-blind">
          <h4>◎ Blind Spots</h4>
          <div className="meta">
            {normalizeArray(data.blindSpots).map((item) => <span key={item} className="chip chip-blind">{item}</span>)}
          </div>
        </article>
      </div>
      <article className="result-card">
        <h4>Next Picks</h4>
        <div className="next-picks-grid">
          {nextPicks.map((pick, i) => (
            <div key={`${pick.title || "pick"}-${i}`} className="next-pick-item">
              <TilePoster item={pick} />
              <div className="next-pick-body">
                <strong>{pick.title || ""}</strong>
                <p>{pick.why || ""}</p>
                {normalizeArray(pick.streamingPlatforms).length > 0 && (
                  <div className="streaming-chips" style={{ marginTop: 8 }}>
                    {normalizeArray(pick.streamingPlatforms).slice(0, 3).map((p) => (
                      <span key={p} className="chip chip-provider">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
