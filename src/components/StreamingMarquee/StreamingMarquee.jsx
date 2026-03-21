import { useEffect, useState } from "react";
import { MARQUEE_PLATFORMS, MOVIE_QUOTES, TRENDING_TITLES } from "../../constants";
import "./StreamingMarquee.css";

export default function StreamingMarquee({ trendingState }) {
  const doubled = [...MARQUEE_PLATFORMS, ...MARQUEE_PLATFORMS];
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % MOVIE_QUOTES.length);
        setVisible(true);
      }, 450);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const q = MOVIE_QUOTES[quoteIdx];

  return (
    <section className="marquee-section reveal" data-reveal>
      <div className="marquee-header">
        <span className="section-eyebrow marquee-eyebrow">As seen on screen</span>
        <div className="quote-rotator" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}>
          <span className="quote-open-mark">"</span>
          <blockquote className="quote-text">{q.quote}</blockquote>
          <cite className="quote-attribution">— {q.film}, {q.year}</cite>
        </div>
      </div>

      <div className="cinema-bento">
        {/* Panel A — Editorial statement */}
        <div className="bento-panel bento-statement">
          <div className="bento-film-grain" />
          <span className="bento-kicker">Why ReelSphere</span>
          <p className="bento-headline">
            The only discovery engine that reads between the lines — mood, tone, texture, not just genre tags.
          </p>
          <div className="bento-rule-lines">
            <div /><div /><div />
          </div>
        </div>

        {/* Panel B — Big numbers */}
        <div className="bento-panel bento-stats">
          {[
            { num: "4", label: "AI-powered tools" },
            { num: "9", label: "Streaming platforms" },
            { num: "∞", label: "Titles indexed" },
          ].map(({ num, label }, i) => (
            <div key={label} className="bento-stat-row">
              {i > 0 && <div className="bento-stat-divider" />}
              <strong className="bento-stat-num">{num}</strong>
              <span className="bento-stat-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Panel C — Trending titles (live from Watchmode) */}
        {(() => {
          const list = trendingState.status === "ready" && Array.isArray(trendingState.data?.titles) && trendingState.data.titles.length > 0
            ? trendingState.data.titles
            : TRENDING_TITLES.map((t) => ({ title: t.title, year: t.year, type: t.tag, poster: null, streamingPlatforms: [], desc: t.desc || "" }));
          const sel = list[selectedIdx] || list[0];
          return (
            <div className="bento-panel bento-titles">
              <div className="bento-titles-header">
                <span className="bento-kicker">Trending Now</span>
                <span className="bento-trending-dot" />
              </div>

              {trendingState.status === "loading" ? (
                <div className="bento-title-loading">Loading…</div>
              ) : (
                <>
                  {/* ── Desktop: poster strip + detail card ── */}
                  <div className="bento-poster-strip-wrap bento-desktop-only">
                    <div className="bento-poster-strip">
                      {list.map((t, i) => (
                        <button
                          key={t.title}
                          type="button"
                          className={`bento-poster-card${selectedIdx === i ? " bento-poster-card-active" : ""}`}
                          onClick={() => setSelectedIdx(i)}
                          aria-label={t.title}
                        >
                          {t.poster && t.poster !== "/1.jpg" ? (
                            <img src={t.poster} alt={t.title} className="bento-poster-img" loading="lazy" />
                          ) : (
                            <div className="bento-poster-placeholder">
                              <span className="bento-poster-placeholder-rank">#{i + 1}</span>
                              <span className="bento-poster-placeholder-title">{t.title}</span>
                            </div>
                          )}
                          <div className="bento-poster-overlay">
                            <span className="bento-poster-rank">#{i + 1}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bento-trending-detail bento-desktop-only" key={selectedIdx}>
                    <div className="bento-trending-detail-top">
                      <div className="bento-trending-detail-info">
                        <span className="bento-trending-detail-tag">{sel.type || sel.tag}</span>
                        <strong className="bento-trending-detail-title">{sel.title}</strong>
                        <span className="bento-trending-detail-year">{sel.year}</span>
                      </div>
                      <div className="bento-trending-detail-actions">
                        {Array.isArray(sel.streamingPlatforms) && sel.streamingPlatforms.length > 0 && (
                          <div className="bento-trending-detail-platforms">
                            {sel.streamingPlatforms.slice(0, 3).map((p) => (
                              <span key={p} className="chip chip-provider">{p}</span>
                            ))}
                          </div>
                        )}
                        <a
                          className="bento-trending-detail-watch"
                          href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(sel.title)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>&#9654;</span> Watch Now
                        </a>
                      </div>
                    </div>
                    {sel.desc && <p className="bento-trending-detail-desc">{sel.desc}</p>}
                  </div>

                  {/* ── Mobile: vertical tap-to-expand list ── */}
                  <div className="bento-trending-mobile">
                    {list.map((t, i) => (
                      <div key={t.title} className={`bento-trending-row${selectedIdx === i ? " bento-trending-row-active" : ""}`}>
                        <button
                          type="button"
                          className="bento-trending-row-btn"
                          onClick={() => setSelectedIdx(i)}
                        >
                          <span className="bento-trending-row-rank">#{i + 1}</span>
                          <div className="bento-trending-row-meta">
                            <strong className="bento-trending-row-title">{t.title}</strong>
                            <span className="bento-trending-row-sub">{t.type || t.tag} · {t.year}</span>
                          </div>
                          <span className="bento-trending-row-chevron">{selectedIdx === i ? "▾" : "›"}</span>
                        </button>
                        {selectedIdx === i && (
                          <div className="bento-trending-row-detail">
                            {t.desc && <p className="bento-trending-detail-desc">{t.desc}</p>}
                            <a
                              className="bento-trending-detail-watch"
                              href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(t.title)}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>&#9654;</span> Watch Now
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>
    </section>
  );
}
