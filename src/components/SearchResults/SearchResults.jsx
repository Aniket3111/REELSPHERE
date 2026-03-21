import MovieTile from "../MovieTile/MovieTile";
import FallbackNotice from "../FallbackNotice/FallbackNotice";
import { normalizeArray } from "../../utils/helpers";
import "./SearchResults.css";

export default function SearchResults({ data }) {
  const results = Array.isArray(data.results) ? data.results : [];
  return (
    <>
      <div className="section-lead">
        <p><strong>{data.summary || "Search results"}</strong></p>
        {data.notice ? <FallbackNotice message={data.notice} /> : null}
      </div>
      <div className="result-grid">
        {results.map((item, i) => (
          <MovieTile key={`${item.title || "result"}-${i}`} item={item} label="Match" description={item.whyItMatches} tags={[...normalizeArray(item.genres), ...normalizeArray(item.tone)]} />
        ))}
      </div>
    </>
  );
}
