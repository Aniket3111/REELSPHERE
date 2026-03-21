import { useEffect, useRef, useState } from "react";
import { fetchJson } from "../../utils/api";
import "./FeaturesShowcase.css";

export default function FeaturesShowcase({ movieOfDayState }) {
  const fallbackSpots = [
    { film: "Interstellar", track: "Cornfield Chase", composer: "Hans Zimmer", vibe: "Cosmic awe", environment: "Late-night stargazing" },
    { film: "Inception", track: "Time", composer: "Hans Zimmer", vibe: "Build-up tension", environment: "Deep focus work" },
    { film: "Blade Runner 2049", track: "2049", composer: "Zimmer & Wallfisch", vibe: "Neon melancholy", environment: "Rainy city night" },
    { film: "The Dark Knight", track: "Why So Serious?", composer: "Hans Zimmer", vibe: "Grit + chaos", environment: "High-intensity sprint" },
    { film: "Dune", track: "Paul's Dream", composer: "Hans Zimmer", vibe: "Desert mystic", environment: "Epic worldbuilding mood" },
    { film: "La La Land", track: "Mia & Sebastian's Theme", composer: "Justin Hurwitz", vibe: "Romantic nostalgia", environment: "Evening unwind" },
  ];

  const [scoreState, setScoreState] = useState({ status: "loading", items: fallbackSpots });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let active = true;
    fetchJson("/api/theme-scores", { method: "GET" })
      .then((body) => {
        if (!active) return;
        const fetched = Array.isArray(body.data?.scores) ? body.data.scores : [];
        if (!fetched.length) {
          setScoreState({ status: "error", items: fallbackSpots });
          return;
        }

        const merged = fetched.map((item, i) => ({ ...fallbackSpots[i], ...item }));
        setScoreState({ status: "ready", items: merged });
      })
      .catch(() => {
        if (!active) return;
        setScoreState({ status: "error", items: fallbackSpots });
      });

    return () => {
      active = false;
    };
  }, []);

  const focusMoods = ["Space drift", "Neo-noir rain", "Epic rise", "Romantic calm", "Dark tension"];

  const featuredTitle = movieOfDayState.status === "ready" ? movieOfDayState.data?.title || "Interstellar" : "Interstellar";
  const autoIndex = scoreState.items.findIndex((s) => featuredTitle.toLowerCase().includes(String(s.film || "").toLowerCase()));

  useEffect(() => {
    if (autoIndex >= 0 && selectedIndex === 0) setSelectedIndex(autoIndex);
  }, [autoIndex]);

  const selected = scoreState.items[selectedIndex] || scoreState.items[0];
  const featuredPoster = selected?.artworkUrl || (movieOfDayState.status === "ready" ? movieOfDayState.data?.poster || "" : "") || "/1.jpg";
  const hasPreview = Boolean(selected?.previewUrl);
  const maxProgress = duration > 0 ? duration : 100;
  const safeProgress = Math.min(currentTime, maxProgress);

  useEffect(() => {
    const audio = playerRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnd);
    };
  }, [selected?.previewUrl]);

  useEffect(() => {
    const audio = playerRef.current;
    if (!audio) return;
    const shouldResume = !audio.paused && !audio.ended;

    audio.pause();
    audio.load();
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);

    if (shouldResume && hasPreview) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [selectedIndex, hasPreview]);

  function togglePlayback() {
    const audio = playerRef.current;
    if (!audio || !hasPreview) return;

    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
      return;
    }
    audio.pause();
  }

  function handleSeek(event) {
    const audio = playerRef.current;
    if (!audio || !hasPreview) return;
    const next = Number(event.target.value);
    audio.currentTime = Number.isFinite(next) ? next : 0;
    setCurrentTime(audio.currentTime || 0);
  }

  function formatTime(value) {
    const total = Math.max(0, Math.floor(value || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <section className="features-showcase theme-lounge reveal" data-reveal>
      <div className="features-header">
        <span className="features-kicker">Cinematic Theme Lounge</span>
        <h2 className="features-title">Listen to the movie mood</h2>
        <p className="features-subtitle">Iconic scores with in-page playback, environment tags, and real cover art.</p>
      </div>

      <div className="theme-grid">
        <article className="theme-featured">
          <span className="theme-featured-label">Now playing vibe</span>

          <div className="theme-featured-media">
            <img src={featuredPoster} alt={`${selected?.film || "Movie"} soundtrack`} className="theme-featured-image" loading="lazy" />
          </div>

          <h3>{selected?.film || "Interstellar"}</h3>
          <p className="theme-track">{selected?.track || "Theme"} — {selected?.artist || selected?.composer || "Composer"}</p>
          <p className="theme-featured-copy">Best for: {selected?.environment || "Evening mood"}. Tone: {selected?.vibe || "Cinematic"}.</p>

          <div className={`theme-player-shell${hasPreview ? "" : " theme-player-shell-disabled"}`}>
            <audio ref={playerRef} className="theme-player-audio" preload="none" src={hasPreview ? selected.previewUrl : undefined}>
              Your browser does not support the audio element.
            </audio>
            <div className="theme-player-controls">
              <button
                type="button"
                className={`theme-player-btn${isPlaying ? " is-playing" : ""}`}
                onClick={togglePlayback}
                disabled={!hasPreview}
                aria-label={isPlaying ? "Pause soundtrack" : "Play soundtrack"}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <input
                className="theme-player-progress"
                type="range"
                min="0"
                max={maxProgress}
                step="0.1"
                value={safeProgress}
                onChange={handleSeek}
                disabled={!hasPreview}
                aria-label="Scrub soundtrack"
              />
              <span className="theme-player-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className={`theme-wave${isPlaying ? " is-playing" : ""}${hasPreview ? "" : " is-disabled"}`} aria-hidden="true">
              {Array.from({ length: 20 }).map((_, i) => (
                <span key={`bar-${i}`} className="theme-wave-bar" />
              ))}
            </div>
          </div>
          {!hasPreview ? (
            <p className="theme-player-empty">Preview unavailable for this track.</p>
          ) : null}

          <div className="theme-mood-tags">
            {focusMoods.map((m) => <span key={m}>{m}</span>)}
          </div>
        </article>

        <div className="theme-list">
          {scoreState.items.map((s, i) => (
            <article key={`${s.film}-${s.track}`} className={`theme-item${selectedIndex === i ? " theme-item-active" : ""}`}>
              <div className="theme-item-top">
                <img src={s.artworkUrl || "/1.jpg"} alt={`${s.film} artwork`} className="theme-item-poster" loading="lazy" />
                <div className="theme-item-main">
                  <strong>{s.film}</strong>
                  <span>{s.track} — {s.artist || s.composer}</span>
                </div>
              </div>
              <div className="theme-item-meta">
                <span className="theme-chip">{s.vibe}</span>
                <span className="theme-chip">{s.environment}</span>
              </div>
              <div className="theme-item-actions">
                <button type="button" className="theme-load-btn" onClick={() => setSelectedIndex(i)}>
                  Load vibe
                </button>
                {s.storeUrl ? <a className="theme-item-link" href={s.storeUrl} target="_blank" rel="noreferrer">Source</a> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
