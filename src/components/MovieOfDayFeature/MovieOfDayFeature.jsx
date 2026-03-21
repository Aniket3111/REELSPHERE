import TilePoster from "../TilePoster/TilePoster";
import FallbackNotice from "../FallbackNotice/FallbackNotice";
import { normalizeArray } from "../../utils/helpers";
import "./MovieOfDayFeature.css";

export default function MovieOfDayFeature({ item }) {
  const streamingPlatforms = normalizeArray(item?.streamingPlatforms);
  const highlights = normalizeArray(item?.highlights).slice(0, 3);
  const vibe = normalizeArray(item?.vibe);
  const hasStreaming = streamingPlatforms.length > 0;
  const watchLabel = item?.watchStatus || "No streaming platforms found";
  const watchRegion = item?.watchRegion ? ` in ${item.watchRegion}` : "";

  return (
    <div className="movie-of-day-layout">
      <div className="movie-of-day-poster-shell">
        <TilePoster item={item} />
      </div>
      <div className="movie-of-day-body">
        {item?.notice ? <FallbackNotice message={item.notice} /> : null}
        <div className="movie-of-day-heading">
          <div className="movie-of-day-topline">
            <span className="tile-year">{item?.year || "?"}</span>
            <span className="tile-tag">Daily pick</span>
          </div>
          <h2>{item?.title || "Unknown title"}</h2>
          <p className="movie-of-day-hook">{item?.hook || ""}</p>
        </div>
        <p className="movie-of-day-overview">{item?.overview || ""}</p>
        <div className="movie-of-day-why">
          <span>Why today</span>
          <p>{item?.whyToday || ""}</p>
        </div>
        {highlights.length ? (
          <div className="movie-of-day-highlights">
            {highlights.map((h) => <div key={h} className="movie-of-day-highlight">{h}</div>)}
          </div>
        ) : null}
        {vibe.length ? (
          <div className="meta movie-of-day-meta">
            {vibe.map((tag) => <span key={tag} className="chip">{tag}</span>)}
          </div>
        ) : null}
        <div className="movie-of-day-streaming">
          <div className="movie-of-day-streaming-copy">
            <span className="streaming-label">Streaming</span>
            {hasStreaming ? (
              <div className="streaming-chips">
                {streamingPlatforms.slice(0, 5).map((p) => <span key={p} className="chip chip-provider">{p}</span>)}
              </div>
            ) : (
              <p className="movie-of-day-streaming-empty">No streaming platforms found{watchRegion}.</p>
            )}
          </div>
          <div className="movie-of-day-actions">
            <span className={`watch-status ${hasStreaming && item?.watchLink ? "watch-status-live" : "watch-status-muted"}`}>
              {watchLabel}{watchRegion}
            </span>
            {hasStreaming && item?.watchLink ? (
              <a className="watch-link" href={item.watchLink} target="_blank" rel="noreferrer">Watch now</a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
