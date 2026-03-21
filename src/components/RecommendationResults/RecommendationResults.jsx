import MovieTile from "../MovieTile/MovieTile";
import FallbackNotice from "../FallbackNotice/FallbackNotice";
import { normalizeArray } from "../../utils/helpers";
import "./RecommendationResults.css";

export default function RecommendationResults({ data }) {
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
  return (
    <>
      <div className="section-lead">
        <p><strong>{data.tasteRead || "Recommendation read"}</strong></p>
        {data.notice ? <FallbackNotice message={data.notice} /> : null}
      </div>
      <div className="result-grid">
        {recommendations.map((item, i) => (
          <MovieTile key={`${item.title || "recommendation"}-${i}`} item={item} label="Recommended" description={item.reason} tags={normalizeArray(item.vibe)} />
        ))}
      </div>
    </>
  );
}
