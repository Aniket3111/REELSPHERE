import "./TilePoster.css";

export default function TilePoster({ item }) {
  const poster = item?.poster || "/1.jpg";
  const isFallback = poster === "/1.jpg";
  if (isFallback) {
    return (
      <div className="tile-poster tile-poster-fallback">
        <img src={poster} alt="Default movie artwork" loading="lazy" />
        <span>{item?.title || "Movie"}</span>
      </div>
    );
  }
  return (
    <div className="tile-poster">
      <img src={poster} alt={item?.title || "Movie poster"} loading="lazy" />
    </div>
  );
}
