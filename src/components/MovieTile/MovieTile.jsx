import TilePoster from "../TilePoster/TilePoster";
import { normalizeArray } from "../../utils/helpers";
import "./MovieTile.css";

export default function MovieTile({ item, label, description, tags }) {
  const streamingPlatforms = normalizeArray(item.streamingPlatforms);
  const hasStreaming = streamingPlatforms.length > 0;
  const region = item?.watchRegion ? ` in ${item.watchRegion}` : "";
  const status = item?.watchStatus || "No streaming platforms found";

  return (
    <article className="result-tile">
      <TilePoster item={item} />
      <div className="tile-body">
        <div className="tile-topline">
          <span className="tile-year">{item.year || "?"}</span>
          <span className="tile-tag">{label}</span>
        </div>
        <h3>{item.title || "Unknown title"}</h3>
        {hasStreaming ? (
          <div className="streaming-block">
            <span className="streaming-label">Streaming</span>
            <div className="streaming-chips">
              {streamingPlatforms.slice(0, 4).map((p) => <span key={p} className="chip chip-provider">{p}</span>)}
            </div>
          </div>
        ) : null}
        <div className="meta">
          {normalizeArray(tags).map((tag) => <span key={tag} className="chip">{tag}</span>)}
        </div>
        <p className="tile-desc">{description || ""}</p>
        <div className="watch-row">
          <span className={`watch-status ${hasStreaming && item?.watchLink ? "watch-status-live" : "watch-status-muted"}`}>
            {status}{region}
          </span>
          {hasStreaming && item?.watchLink ? (
            <a className="watch-link" href={item.watchLink} target="_blank" rel="noreferrer">Watch now</a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
