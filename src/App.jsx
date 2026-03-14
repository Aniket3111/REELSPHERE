import { useEffect, useState } from "react";

const initialChatMessages = [
  {
    role: "assistant",
    content:
      "Ask about films, directors, genres, watch orders, or what to watch based on your mood.",
  },
];

const TOOL_NAV_ITEMS = [
  { id: "movie-of-day", index: "00", label: "Movie of the Day", description: "Daily spotlight pick" },
  { id: "search-tool", index: "01", label: "Natural Search", description: "Mood-led discovery" },
  { id: "recommendations-tool", index: "02", label: "Recommendations", description: "Pattern-based picks" },
  { id: "film-brain-tool", index: "03", label: "Film Brain", description: "Conversation mode" },
  { id: "taste-decoder-tool", index: "04", label: "Taste Decoder", description: "Profile your taste" },
];

export default function App() {
  const [movieOfDayState, setMovieOfDayState] = useState({
    status: "loading",
    data: null,
    error: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendQuery, setRecommendQuery] = useState("");
  const [analyzeQuery, setAnalyzeQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [searchState, setSearchState] = useState({ status: "idle", data: null, error: "" });
  const [recommendState, setRecommendState] = useState({ status: "idle", data: null, error: "" });
  const [analyzeState, setAnalyzeState] = useState({ status: "idle", data: null, error: "" });
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [chatLoading, setChatLoading] = useState(false);
  const [runtimeState, setRuntimeState] = useState({ status: "loading", data: null, error: "" });

  useEffect(() => {
    loadRuntimeStatus();
    loadMovieOfDay();
  }, []);
  useEffect(() => {
    initRevealAnimations();
  }, []);

  useEffect(() => {
    return initScrollScene();
  }, []);

  useEffect(() => {
    const thread = document.getElementById("chat-thread");
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  async function loadRuntimeStatus() {
    try {
      const body = await fetchJson("/api/health", { method: "GET" });
      setRuntimeState({ status: "ready", data: body, error: "" });
    } catch (error) {
      setRuntimeState({
        status: "error",
        data: null,
        error: error.message || "Health check failed.",
      });
    }
  }

  async function loadMovieOfDay() {
    try {
      const body = await fetchJson("/api/movie-of-day", { method: "GET" });
      setMovieOfDayState({
        status: "ready",
        data: { ...body.data, notice: body.notice || "", limited: Boolean(body.limited) },
        error: "",
      });
    } catch (error) {
      setMovieOfDayState({
        status: "error",
        data: null,
        error: error.message || "Movie of the day failed to load.",
      });
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      return;
    }

    setSearchState({ status: "loading", data: null, error: "" });
    try {
      const result = await postJson("/api/search", { query });
      setSearchState({
        status: "ready",
        data: { ...result.data, notice: result.notice || "", limited: Boolean(result.limited) },
        error: "",
      });
    } catch (error) {
      setSearchState({ status: "error", data: null, error: error.message });
    }
  }

  async function handleRecommendationSubmit(event) {
    event.preventDefault();
    const query = recommendQuery.trim();
    if (!query) {
      return;
    }

    setRecommendState({ status: "loading", data: null, error: "" });
    try {
      const result = await postJson("/api/recommendations", { query });
      setRecommendState({
        status: "ready",
        data: { ...result.data, notice: result.notice || "", limited: Boolean(result.limited) },
        error: "",
      });
    } catch (error) {
      setRecommendState({ status: "error", data: null, error: error.message });
    }
  }

  async function handleAnalyzeSubmit(event) {
    event.preventDefault();
    const query = analyzeQuery.trim();
    if (!query) {
      return;
    }

    setAnalyzeState({ status: "loading", data: null, error: "" });
    try {
      const result = await postJson("/api/analyze-taste", { query });
      setAnalyzeState({
        status: "ready",
        data: { ...result.data, notice: result.notice || "", limited: Boolean(result.limited) },
        error: "",
      });
    } catch (error) {
      setAnalyzeState({ status: "error", data: null, error: error.message });
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatLoading) {
      return;
    }

    const nextMessages = [...chatMessages, { role: "user", content }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const result = await postJson("/api/chat", { messages: nextMessages });
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: result.data.answer },
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      <BackgroundScene />

      <div className="ambient ambient-left"></div>
      <div className="ambient ambient-right"></div>

      <div className="page-shell">
        <header className="hero reveal" data-reveal>
          <div className="hero-nav">
            <div>
              <p className="eyebrow">ReelSphere</p>
              <span className="nav-subtitle">AI cinema discovery engine</span>
            </div>
            <div className="nav-pill">5 featured stops</div>
          </div>

          <div className="hero-main">
            <div className="hero-copy">
              <h1>Find your next obsession before the credits even roll.</h1>
              <p className="lede">
                Search by mood, get tighter recommendations, talk to a film
                brain, and decode the patterns behind your taste in one
                streaming-style workspace.
              </p>
              <div className="hero-actions">
                <span className="hero-chip">Natural search</span>
                <span className="hero-chip">Taste decoder</span>
                <span className="hero-chip">Movie of the day</span>
                <span className="hero-chip">Gemini powered</span>
              </div>
            </div>

            <aside className="hero-spotlight">
              <span className="spotlight-label">Now running</span>
              <strong>Search. Recommend. Chat. Analyze.</strong>
              <p>
                Built like a modern streaming dashboard, tuned for movie people.
              </p>
              <div className="spotlight-list">
                <div className="spotlight-item">
                  <span>01</span>
                  <p>
                    Describe a vibe and surface films with tighter thematic
                    matches.
                  </p>
                </div>
                <div className="spotlight-item">
                  <span>02</span>
                  <p>
                    Use recommendation logic that reacts to patterns, not just
                    genre tags.
                  </p>
                </div>
                <div className="spotlight-item">
                  <span>03</span>
                  <p>
                    Switch into conversational mode for film knowledge and watch
                    guidance.
                  </p>
                </div>
                <div className="spotlight-item">
                  <span>04</span>
                  <p>
                    Decode your viewing profile and push beyond your comfort
                    zone.
                  </p>
                </div>
              </div>
              <div className="spotlight-metrics">
                <div>
                  <strong>4</strong>
                  <span>core tools</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>shared taste graph</span>
                </div>
                <div>
                  <strong>Live</strong>
                  <span>runtime model status</span>
                </div>
              </div>
            </aside>
          </div>
        </header>

        <ToolNavbar movieOfDayState={movieOfDayState} />
        <RuntimeBanner runtimeState={runtimeState} />

        <main className="grid tool-grid">
          <MovieOfDaySection movieOfDayState={movieOfDayState} />

          <section id="search-tool" className="panel panel-search reveal" data-reveal>
            <PanelMedia image="/natural_search.jpg" alt="Natural search visual" />
            <PanelHeader
              index="01"
              title="Natural Search"
              description="Describe atmosphere, pacing, genre, era, or what should be excluded."
            />
            <form className="stack" onSubmit={handleSearchSubmit}>
              <textarea
                id="search-query"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Neo-noir crime films with rain, restraint, and moral tension. No superheroes."
              ></textarea>
              <button type="submit">Find titles</button>
            </form>
            <ResultArea state={searchState} emptyText="Results will appear here.">
              {searchState.data && <SearchResults data={searchState.data} />}
            </ResultArea>
          </section>

          <section id="recommendations-tool" className="panel panel-recs reveal" data-reveal>
            <PanelMedia image="/recommendation.jpg" alt="Recommendation visual" />
            <PanelHeader
              index="02"
              title="Recommendations"
              description="Tell ReelSphere what works for you and let it connect the dots."
            />
            <form className="stack" onSubmit={handleRecommendationSubmit}>
              <textarea
                id="recommend-query"
                value={recommendQuery}
                onChange={(event) => setRecommendQuery(event.target.value)}
                placeholder="I like Heat, Zodiac, Collateral, and quiet thrillers with precision. Skip broad comedy."
              ></textarea>
              <button type="submit">Get recommendations</button>
            </form>
            <ResultArea state={recommendState} emptyText="Recommendations will appear here.">
              {recommendState.data && (
                <RecommendationResults data={recommendState.data} />
              )}
            </ResultArea>
          </section>

          <section id="film-brain-tool" className="panel panel-chat reveal" data-reveal>
            <PanelMedia
              image="/film_brain.jpg"
              alt="Film brain visual"
              tall={true}
            />
            <PanelHeader
              index="03"
              title="Film Brain"
              description="Ask about directors, filmographies, hidden links, watch orders, or double features."
            />
            <div id="chat-thread" className="chat-thread">
              {chatMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                  <p>{message.content}</p>
                </div>
              ))}
              {chatLoading ? (
                <div className="chat-bubble assistant">
                  <LoadingDots />
                </div>
              ) : null}
            </div>
            <form className="chat-form" onSubmit={handleChatSubmit}>
              <input
                id="chat-input"
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask a movie question..."
              />
              <button type="submit">Send</button>
            </form>
          </section>

          <section id="taste-decoder-tool" className="panel panel-analyzer reveal" data-reveal>
            <PanelMedia image="/taste_decoder.jpg" alt="Taste decoder visual" />
            <PanelHeader
              index="04"
              title="Taste Decoder"
              description="Paste favorite titles, filmmakers, genres, and hard no's to map your viewing profile."
            />
            <form className="stack" onSubmit={handleAnalyzeSubmit}>
              <textarea
                id="analyze-query"
                value={analyzeQuery}
                onChange={(event) => setAnalyzeQuery(event.target.value)}
                placeholder="Favorites: In the Mood for Love, Arrival, The Social Network, Before Sunrise. I like precision and melancholy."
              ></textarea>
              <button type="submit">Analyze taste</button>
            </form>
            <ResultArea
              state={analyzeState}
              emptyText="Your taste profile will appear here."
            >
              {analyzeState.data && <AnalysisResults data={analyzeState.data} />}
            </ResultArea>
          </section>
        </main>
      </div>
    </>
  );
}

function ToolNavbar({ movieOfDayState }) {
  const movieReady = movieOfDayState.status === "ready";
  const featuredTitle = movieReady ? movieOfDayState.data?.title || "Daily pick" : "Loading daily pick";

  return (
    <nav className="tool-navbar reveal is-visible" aria-label="Tool navigation" data-reveal>
      <div className="tool-navbar-copy">
        <span className="tool-navbar-label">Explore</span>
        <strong>Jump between the daily spotlight and every tool.</strong>
        <p>{movieReady ? `${featuredTitle} is live in Movie of the Day.` : "Movie of the Day is loading alongside the core tools."}</p>
      </div>
      <div className="tool-navbar-links">
        {TOOL_NAV_ITEMS.map((item) => (
          <a key={item.id} className={`tool-nav-link`} href={`#${item.id}`}>
            <span className="tool-nav-index">{item.index}</span>
            <span className="tool-nav-text">
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function MovieOfDaySection({ movieOfDayState }) {
  return (
    <section id="movie-of-day" className="movie-of-day movie-of-day-full reveal" data-reveal>
      <div className="movie-of-day-copy">
        <span className="movie-of-day-kicker">Movie of the Day</span>
        {movieOfDayState.status === "loading" ? (
          <>
            <h2>Curating today&apos;s spotlight.</h2>
            <p>
              Pulling one strong daily pick with context, tone, and streaming
              availability.
            </p>
            <LoadingDots />
          </>
        ) : null}

        {movieOfDayState.status === "error" ? (
          <>
            <h2>Today&apos;s spotlight is unavailable.</h2>
            <p>{movieOfDayState.error}</p>
          </>
        ) : null}

        {movieOfDayState.status === "ready" ? (
          <MovieOfDayFeature item={movieOfDayState.data} />
        ) : null}
      </div>
    </section>
  );
}

function MovieOfDayFeature({ item }) {
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
            {highlights.map((highlight) => (
              <div key={highlight} className="movie-of-day-highlight">
                {highlight}
              </div>
            ))}
          </div>
        ) : null}

        {vibe.length ? (
          <div className="meta movie-of-day-meta">
            {vibe.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="movie-of-day-streaming">
          <div className="movie-of-day-streaming-copy">
            <span className="streaming-label">Streaming</span>
            {hasStreaming ? (
              <div className="streaming-chips">
                {streamingPlatforms.slice(0, 5).map((platform) => (
                  <span key={platform} className="chip chip-provider">
                    {platform}
                  </span>
                ))}
              </div>
            ) : (
              <p className="movie-of-day-streaming-empty">
                No streaming platforms found{watchRegion}.
              </p>
            )}
          </div>

          <div className="movie-of-day-actions">
            <span
              className={`watch-status ${
                hasStreaming && item?.watchLink
                  ? "watch-status-live"
                  : "watch-status-muted"
              }`}
            >
              {watchLabel}
              {watchRegion}
            </span>
            {hasStreaming && item?.watchLink ? (
              <a
                className="watch-link"
                href={item.watchLink}
                target="_blank"
                rel="noreferrer"
              >
                Watch now
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundScene() {
  return (
    <div className="bg-video-shell" aria-hidden="true">
      <video
        className="bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/bg_video.mp4" type="video/mp4" />
      </video>
      <div className="bg-video-overlay"></div>
      <div className="bg-video-vignette"></div>
    </div>
  );
}

function PanelMedia({ image, alt, tall = false }) {
  return (
    <div className={`panel-media${tall ? " panel-media-tall" : ""}`}>
      <img src={image} alt={alt} />
      <div className="panel-media-overlay"></div>
    </div>
  );
}

function PanelHeader({ index, title, description }) {
  return (
    <div className="panel-header">
      <div>
        <span className="panel-kicker">{index}</span>
        <h2>{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
}

function ResultArea({ state, emptyText, children }) {
  let className = "result-area";
  if (state.status === "idle") {
    className += " empty";
  }

  return (
    <div className={className}>
      {state.status === "idle" ? emptyText : null}
      {state.status === "loading" ? <LoadingDots /> : null}
      {state.status === "error" ? (
        <p>
          <strong>Error</strong>: {state.error}
        </p>
      ) : null}
      {state.status === "ready" ? children : null}
    </div>
  );
}

function FallbackNotice({ message }) {
  return <p className="fallback-note">{message}</p>;
}

function SearchResults({ data }) {
  const results = Array.isArray(data.results) ? data.results : [];
  return (
    <>
      <div className="section-lead">
        <p>
          <strong>{data.summary || "Search results"}</strong>
        </p>
        {data.notice ? <FallbackNotice message={data.notice} /> : null}
      </div>
      <div className="result-rail">
        {results.map((item, index) => (
          <MovieTile
            key={`${item.title || "result"}-${index}`}
            item={item}
            label="Match"
            description={item.whyItMatches}
            tags={[...normalizeArray(item.genres), ...normalizeArray(item.tone)]}
          />
        ))}
      </div>
    </>
  );
}

function RecommendationResults({ data }) {
  const recommendations = Array.isArray(data.recommendations)
    ? data.recommendations
    : [];

  return (
    <>
      <div className="section-lead">
        <p>
          <strong>{data.tasteRead || "Recommendation read"}</strong>
        </p>
        {data.notice ? <FallbackNotice message={data.notice} /> : null}
      </div>
      <div className="result-rail">
        {recommendations.map((item, index) => (
          <MovieTile
            key={`${item.title || "recommendation"}-${index}`}
            item={item}
            label="Recommended"
            description={item.reason}
            tags={normalizeArray(item.vibe)}
          />
        ))}
      </div>
    </>
  );
}

function AnalysisResults({ data }) {
  const signals = Array.isArray(data.signals) ? data.signals : [];
  const nextPicks = Array.isArray(data.nextPicks) ? data.nextPicks : [];

  return (
    <>
      {data.notice ? <FallbackNotice message={data.notice} /> : null}
      <article className="result-card">
        <h3>{data.profileName || "Taste profile"}</h3>
        <p>{data.overview || ""}</p>
      </article>

      <div className="signal-grid">
        {signals.map((signal, index) => (
          <div key={`${signal.label || "signal"}-${index}`} className="signal-item">
            <div className="signal-row">
              <span>{signal.label || "Signal"}</span>
              <span>{String(signal.score || 0)}</span>
            </div>
            <p>{signal.explanation || ""}</p>
          </div>
        ))}
      </div>

      <article className="result-card">
        <h4>Comfort Zone</h4>
        <div className="meta">
          {normalizeArray(data.comfortZone).map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
        <h4>Blind Spots</h4>
        <div className="meta">
          {normalizeArray(data.blindSpots).map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
      </article>

      <article className="result-card">
        <h4>Next Picks</h4>
        {nextPicks.map((pick, index) => (
          <p key={`${pick.title || "pick"}-${index}`}>
            <strong>{pick.title || ""}</strong>: {pick.why || ""}
          </p>
        ))}
      </article>
    </>
  );
}

function MovieTile({ item, label, description, tags }) {
  const streamingPlatforms = normalizeArray(item.streamingPlatforms);
  const hasStreaming = streamingPlatforms.length > 0;
  const region = item?.watchRegion ? ` in ${item.watchRegion}` : "";
  const status = item?.watchStatus || "No streaming platforms found";

  return (
    <article className="result-tile">
      <TilePoster item={item} />
      <div className="tile-topline">
        <span className="tile-year">{item.year || "?"}</span>
        <span className="tile-tag">{label}</span>
      </div>
      <h3>{item.title || "Unknown title"}</h3>
      {hasStreaming ? (
        <div className="streaming-block">
          <span className="streaming-label">Streaming</span>
          <div className="streaming-chips">
            {streamingPlatforms.slice(0, 4).map((platform) => (
              <span key={platform} className="chip chip-provider">
                {platform}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="meta">
        {normalizeArray(tags).map((tag) => (
          <span key={tag} className="chip">
            {tag}
          </span>
        ))}
      </div>
      <p>{description || ""}</p>
      <div className="watch-row">
        <span
          className={`watch-status ${
            hasStreaming && item?.watchLink
              ? "watch-status-live"
              : "watch-status-muted"
          }`}
        >
          {status}
          {region}
        </span>
        {hasStreaming && item?.watchLink ? (
          <a
            className="watch-link"
            href={item.watchLink}
            target="_blank"
            rel="noreferrer"
          >
            Watch now
          </a>
        ) : null}
      </div>
    </article>
  );
}

function TilePoster({ item }) {
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

function RuntimeBanner({ runtimeState }) {
  if (runtimeState.status === "error") {
    return (
      <section
        id="runtime-banner"
        className="runtime-banner runtime-banner-warning reveal is-visible"
        aria-live="polite"
        data-reveal
      >
        <div className="runtime-copy">
          <div className="runtime-head">
            <span className="runtime-label">Now Running</span>
            <span className="runtime-dot"></span>
          </div>
          <strong>Runtime status unavailable</strong>
          <p>{runtimeState.error}</p>
        </div>
        <div className="runtime-side">
          <div className="runtime-chips">
            <span className="status-chip status-chip-warn">Health check failed</span>
          </div>
        </div>
      </section>
    );
  }

  if (runtimeState.status !== "ready") {
    return (
      <section
        id="runtime-banner"
        className="runtime-banner runtime-banner-loading reveal"
        aria-live="polite"
        data-reveal
      >
        <div className="runtime-copy">
          <div className="runtime-head">
            <span className="runtime-label">Now Running</span>
            <span className="runtime-dot"></span>
          </div>
          <strong>Checking active model...</strong>
          <p>Loading live server health and fallback chain.</p>
        </div>
        <div className="runtime-side">
          <div className="runtime-chips"></div>
        </div>
      </section>
    );
  }

  const health = runtimeState.data;
  const model = health.model || "unknown";
  const backupModels = Array.isArray(health.backupModels) ? health.backupModels : [];
  const apiKeyConfigured = Boolean(health.apiKeyConfigured);
  const looksStale = model === "gemini-2.5-flash";
  const watchmodeConfigured = Boolean(health.watchmode?.configured);

  return (
    <section
      id="runtime-banner"
      className={`runtime-banner ${looksStale ? "runtime-banner-warning" : "runtime-banner-ready"} reveal is-visible`}
      aria-live="polite"
      data-reveal
    >
      <div className="runtime-copy">
        <div className="runtime-head">
          <span className="runtime-label">Now Running</span>
          <span className="runtime-dot"></span>
        </div>
        <strong>{`Active model is ${model}`}</strong>
        <p>
          {apiKeyConfigured
            ? looksStale
              ? "This server is still running the older high-quota model. Restart it if that is not intentional."
              : "Live runtime looks healthy. Backup models are armed if quota gets tight."
            : "Gemini API key is not configured."}
        </p>
      </div>
      <div className="runtime-side">
        <div className="runtime-chips">
          <span className={`status-chip ${looksStale ? "status-chip-warn" : "status-chip-ok"}`}>
            {`Primary: ${model}`}
          </span>
          {backupModels.map((backup) => (
            <span key={backup} className="status-chip status-chip-neutral">
              {`Backup: ${backup}`}
            </span>
          ))}
          <span
            className={`status-chip ${
              apiKeyConfigured ? "status-chip-ok" : "status-chip-warn"
            }`}
          >
            {apiKeyConfigured ? "API key set" : "API key missing"}
          </span>
          <span
            className={`status-chip ${
              watchmodeConfigured ? "status-chip-ok" : "status-chip-neutral"
            }`}
          >
            {watchmodeConfigured
              ? `Watchmode ${health.watchmode.region}`
              : "Watchmode off"}
          </span>
        </div>
      </div>
    </section>
  );
}

function LoadingDots() {
  return (
    <div className="loading">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

async function postJson(url, payload) {
  return fetchJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Request failed.");
  }

  return body;
}

function normalizeArray(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function initRevealAnimations() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompactScreen = window.matchMedia("(max-width: 768px)").matches;

  if (!("IntersectionObserver" in window) || reduceMotion || isCompactScreen) {
    nodes.forEach((node) => {
      node.style.transitionDelay = "0ms";
      node.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  nodes.forEach((node, index) => {
    node.style.transitionDelay = `${index * 90}ms`;
    observer.observe(node);
  });
}

function initScrollScene() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompactScreen = window.matchMedia("(max-width: 768px)").matches;

  if (reduceMotion || isCompactScreen) {
    document.body.style.setProperty("--scroll-progress", "0");
    document.body.classList.remove("is-scrolled", "is-deep-scrolled");
    return () => {};
  }

  let ticking = false;

  const updateScene = () => {
    const maxDistance = Math.max(window.innerHeight * 0.9, 1);
    const progress = Math.min(window.scrollY / maxDistance, 1);

    document.body.style.setProperty("--scroll-progress", progress.toFixed(3));
    document.body.classList.toggle("is-scrolled", progress > 0.22);
    document.body.classList.toggle("is-deep-scrolled", progress > 0.68);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScene);
      ticking = true;
    }
  };

  updateScene();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScene);

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", updateScene);
  };
}
