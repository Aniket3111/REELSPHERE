import { useEffect, useRef, useState } from "react";

const initialChatMessages = [
  { role: "assistant", content: "Ask about films, directors, genres, watch orders, or what to watch based on your mood." },
];

const TOOLS = [
  { id: "search", index: "01", label: "Natural Search", description: "Mood-led discovery", icon: "🔍" },
  { id: "recommend", index: "02", label: "Recommendations", description: "Pattern-based picks", icon: "⭐" },
  { id: "chat", index: "03", label: "Film Brain", description: "Conversation mode", icon: "💬" },
  { id: "taste", index: "04", label: "Taste Decoder", description: "Profile your taste", icon: "🎭" },
];

const MARQUEE_PLATFORMS = [
  { id: "netflix", name: "Netflix", src: "/logos/netflix.svg" },
  { id: "disney", name: "Disney+", src: "/logos/disneyplus.svg" },
  { id: "prime", name: "Prime Video", src: "/logos/primevideo.svg" },
  { id: "apple", name: "Apple TV+", src: "/logos/appletv.svg" },
  { id: "max", name: "Max", src: "/logos/max.svg" },
  { id: "imdb", name: "IMDb", src: "/logos/imdb.svg" },
  { id: "rotten", name: "Rotten Tomatoes", src: "/logos/rottentomatoes.svg" },
  { id: "letterboxd", name: "Letterboxd", src: "/logos/letterboxd.svg" },
  { id: "youtube", name: "YouTube", src: "/logos/youtube.svg" },
];

const HERO_WORDS = ["obsession", "escape", "marathon", "masterpiece"];

const TRENDING_TITLES = [
  { title: "Oppenheimer", year: "2023", tag: "Drama", desc: "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II." },
  { title: "The Bear", year: "2022", tag: "Series", desc: "A young chef from the fine dining world returns home to run his family's sandwich shop in Chicago." },
  { title: "Past Lives", year: "2023", tag: "Romance", desc: "Two childhood sweethearts are reunited after 20 years apart, forced to reckon with love, choices, and destiny." },
  { title: "Dune: Part Two", year: "2024", tag: "Sci-Fi", desc: "Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family." },
  { title: "Shōgun", year: "2024", tag: "Series", desc: "A powerful lord of feudal Japan and an English navigator form an unlikely alliance to shift the balance of power." },
  { title: "Poor Things", year: "2023", tag: "Dark Comedy", desc: "The fantastical story of Bella Baxter, brought back to life by a brilliant surgeon and eager to learn about the world." },
];

const MOVIE_QUOTES = [
  { quote: "May the Force be with you.", film: "Star Wars", year: "1977" },
  { quote: "Here's looking at you, kid.", film: "Casablanca", year: "1942" },
  { quote: "You can't handle the truth!", film: "A Few Good Men", year: "1992" },
  { quote: "I'll be back.", film: "The Terminator", year: "1984" },
  { quote: "Why so serious?", film: "The Dark Knight", year: "2008" },
  { quote: "Life is like a box of chocolates.", film: "Forrest Gump", year: "1994" },
  { quote: "I see dead people.", film: "The Sixth Sense", year: "1999" },
  { quote: "To infinity and beyond!", film: "Toy Story", year: "1995" },
  { quote: "You is kind, you is smart, you is important.", film: "The Help", year: "2011" },
  { quote: "Just keep swimming.", film: "Finding Nemo", year: "2003" },
  { quote: "With great power comes great responsibility.", film: "Spider-Man", year: "2002" },
  { quote: "Hope is a good thing, maybe the best of things.", film: "The Shawshank Redemption", year: "1994" },
];

const MOOD_BUTTONS = [
  { label: "Dark & Moody", query: "Dark, moody films with heavy atmosphere and moral ambiguity", icon: "🌑" },
  { label: "Feel-good", query: "Feel-good uplifting movies that leave you smiling", icon: "☀️" },
  { label: "Mind-bending", query: "Mind-bending cerebral films with twists and layered narratives", icon: "🌀" },
  { label: "Edge of my seat", query: "Intense edge-of-your-seat thrillers with relentless pacing", icon: "⚡" },
  { label: "Visually stunning", query: "Visually stunning films with breathtaking cinematography", icon: "🎨" },
  { label: "Cry my eyes out", query: "Emotionally devastating films that will make you cry", icon: "💧" },
];

export default function App() {
  const [activeTool, setActiveTool] = useState("search");
  const [movieOfDayState, setMovieOfDayState] = useState({ status: "loading", data: null, error: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [recommendQuery, setRecommendQuery] = useState("");
  const [analyzeQuery, setAnalyzeQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [searchState, setSearchState] = useState({ status: "idle", data: null, error: "" });
  const [recommendState, setRecommendState] = useState({ status: "idle", data: null, error: "" });
  const [analyzeState, setAnalyzeState] = useState({ status: "idle", data: null, error: "" });
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const [chatLoading, setChatLoading] = useState(false);
  const [runtimeState, setRuntimeState] = useState({ status: "loading", data: null, error: "" });
  const [trendingState, setTrendingState] = useState({ status: "loading", data: null });
  const [ledeText, setLedeText] = useState("");
  const [easterFlash, setEasterFlash] = useState(null);

  const heroRef = useRef(null);
  const spotlightRef = useRef(null);

  const LEDE_FULL = "Search by mood, get sharper recommendations, chat with a film brain, and decode your taste patterns in one cinematic workspace.";

  useEffect(() => { loadRuntimeStatus(); loadMovieOfDay(); loadTrending(); }, []);
  useEffect(() => { initRevealAnimations(); }, []);
  useEffect(() => { return initScrollScene(); }, []);
  useEffect(() => {
    const id = setInterval(() => {
      setHeroWordIndex((prev) => (prev + 1) % HERO_WORDS.length);
    }, 2600);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { return initCursorSpotlight(heroRef, spotlightRef); }, []);
  useEffect(() => { return initTiltCards(); }, []);

  // Typewriter effect for lede - starts after cinema intro
  useEffect(() => {
    let i = 0;
    const delay = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setLedeText(LEDE_FULL.slice(0, i));
        if (i >= LEDE_FULL.length) clearInterval(id);
      }, 22);
      return () => clearInterval(id);
    }, 3200);
    return () => clearTimeout(delay);
  }, []);

  // Easter egg - listen for typed genre keywords anywhere on page
  useEffect(() => {
    let buffer = "";
    const TRIGGERS = {
      action: { color: "rgba(255, 140, 0, 0.25)", emoji: "💥" },
      horror: { color: "rgba(200, 0, 0, 0.3)", emoji: "👻" },
      romance: { color: "rgba(255, 80, 120, 0.25)", emoji: "💕" },
      scifi: { color: "rgba(0, 180, 255, 0.25)", emoji: "🚀" },
    };
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      buffer += e.key.toLowerCase();
      if (buffer.length > 12) buffer = buffer.slice(-12);
      for (const [word, fx] of Object.entries(TRIGGERS)) {
        if (buffer.endsWith(word)) {
          setEasterFlash(fx);
          buffer = "";
          setTimeout(() => setEasterFlash(null), 1200);
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const thread = document.getElementById("chat-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [chatMessages, chatLoading]);

  async function loadRuntimeStatus() {
    try {
      const body = await fetchJson("/api/health", { method: "GET" });
      setRuntimeState({ status: "ready", data: body, error: "" });
    } catch (error) {
      setRuntimeState({ status: "error", data: null, error: error.message || "Health check failed." });
    }
  }

  async function loadTrending() {
    try {
      const body = await fetchJson("/api/trending", { method: "GET" });
      setTrendingState({ status: "ready", data: body.data });
    } catch {
      setTrendingState({ status: "error", data: null });
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
      setMovieOfDayState({ status: "error", data: null, error: error.message || "Movie of the day failed to load." });
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchState({ status: "loading", data: null, error: "" });
    try {
      const result = await postJson("/api/search", { query });
      setSearchState({ status: "ready", data: { ...result.data, notice: result.notice || "", limited: Boolean(result.limited) }, error: "" });
    } catch (error) {
      setSearchState({ status: "error", data: null, error: error.message });
    }
  }

  async function handleRecommendationSubmit(event) {
    event.preventDefault();
    const query = recommendQuery.trim();
    if (!query) return;
    setRecommendState({ status: "loading", data: null, error: "" });
    try {
      const result = await postJson("/api/recommendations", { query });
      setRecommendState({ status: "ready", data: { ...result.data, notice: result.notice || "", limited: Boolean(result.limited) }, error: "" });
    } catch (error) {
      setRecommendState({ status: "error", data: null, error: error.message });
    }
  }

  async function handleAnalyzeSubmit(event) {
    event.preventDefault();
    const query = analyzeQuery.trim();
    if (!query) return;
    setAnalyzeState({ status: "loading", data: null, error: "" });
    try {
      const result = await postJson("/api/analyze-taste", { query });
      setAnalyzeState({ status: "ready", data: { ...result.data, notice: result.notice || "", limited: Boolean(result.limited) }, error: "" });
    } catch (error) {
      setAnalyzeState({ status: "error", data: null, error: error.message });
    }
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || chatLoading) return;
    const nextMessages = [...chatMessages, { role: "user", content }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const result = await postJson("/api/chat", { messages: nextMessages });
      setChatMessages((current) => [...current, { role: "assistant", content: result.data.answer }]);
    } catch (error) {
      setChatMessages((current) => [...current, { role: "assistant", content: `Error: ${error.message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleMoodClick(query) {
    setActiveTool("search");
    setSearchQuery(query);
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <CinemaIntro />
      <SoundToggle />
      {easterFlash && (
        <div className="easter-flash" style={{ background: easterFlash.color }}>
          <span className="easter-flash-emoji">{easterFlash.emoji}</span>
        </div>
      )}
      <BackgroundScene />
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <div className="page-shell">
        {/* ── HERO ── */}
        <header className="hero reveal" data-reveal ref={heroRef}>
          <div className="hero-spotlight-cursor" ref={spotlightRef} />
          <div className="hero-nav">
            <div className="brand-lockup">
              <img src="/logo.svg" alt="ReelSphere" className="brand-logo" />
              <div>
                <p className="eyebrow">ReelSphere</p>
                <span className="nav-subtitle">AI cinema discovery engine</span>
              </div>
            </div>
            <div className="hero-nav-right">
              <RuntimeDot runtimeState={runtimeState} />
              <div className="nav-pill">5 featured stops</div>
            </div>
          </div>

          <div className="hero-main">
            <div className="hero-copy">
              <span className="hero-title-kicker">Tonight's queue starts here</span>
              <h1 className="hero-title">
                <span>Find your next</span>
                <span className="hero-title-accent" key={heroWordIndex}>
                  {HERO_WORDS[heroWordIndex]}
                </span>
              </h1>
              <p className="lede">
                {ledeText}
              </p>
              <div className="hero-cta-row">
                <a href="#workspace" className="cta-btn">
                  <span className="cta-icon">&#9654;</span>
                  Start exploring
                </a>
                <a href="#movie-of-day" className="cta-btn-secondary">
                  Today's pick
                </a>
              </div>
              <div className="mood-selector">
                <div className="mood-selector-label">Quick moods</div>
                <div className="mood-grid">
                  {MOOD_BUTTONS.map((m) => (
                    <button key={m.label} type="button" className="mood-btn" onClick={() => handleMoodClick(m.query)}>
                      <span className="mood-btn-icon">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="easter-hint">
                <span className="easter-hint-label">Try typing</span>
                {["action", "horror", "romance", "scifi"].map((w) => (
                  <kbd key={w} className="easter-hint-key">{w}</kbd>
                ))}
              </div>
            </div>

            <aside className="hero-spotlight">
              <span className="spotlight-label">Now running</span>
              <strong>Search. Recommend. Chat. Analyze.</strong>
              <p>Built like a modern streaming dashboard, tuned for movie people.</p>
              <div className="spotlight-list">
                {[
                  "Describe a vibe and surface films with tighter thematic matches.",
                  "Recommendation logic that reacts to patterns, not just genre tags.",
                  "Conversational mode for film knowledge and watch guidance.",
                  "Decode your viewing profile and push beyond your comfort zone.",
                ].map((text, i) => (
                  <div key={i} className="spotlight-item">
                    <span>0{i + 1}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <div className="spotlight-metrics">
                <div><strong>4</strong><span>core tools</span></div>
                <div><strong>1</strong><span>shared taste graph</span></div>
                <div><strong>Live</strong><span>runtime status</span></div>
              </div>
            </aside>
          </div>
        </header>

        {/* ── FEATURES SHOWCASE ── */}
        <FeaturesShowcase />

        {/* ── STREAMING MARQUEE ── */}
        <StreamingMarquee trendingState={trendingState} />

        {/* ── MOVIE OF THE DAY ── */}
        <section id="movie-of-day" className="movie-of-day reveal" data-reveal>
          <div className="movie-of-day-copy">
            <span className="movie-of-day-kicker">Movie of the Day</span>
            {movieOfDayState.status === "loading" && (
              <><h2>Curating today's spotlight.</h2><p>Pulling one strong daily pick with context, tone, and streaming availability.</p><LoadingDots /></>
            )}
            {movieOfDayState.status === "error" && (
              <><h2>Today's spotlight is unavailable.</h2><p>{movieOfDayState.error}</p></>
            )}
            {movieOfDayState.status === "ready" && <MovieOfDayFeature item={movieOfDayState.data} />}
          </div>
        </section>

        {/* ── RUNTIME BANNER ── */}
        <RuntimeBanner runtimeState={runtimeState} />

        {/* ── WORKSPACE ── */}
        <section id="workspace" className="workspace reveal" data-reveal>
          <div className="workspace-header">
            <div>
              <span className="workspace-kicker">Your tools</span>
              <h2 className="workspace-title">Search. Recommend. Chat. Analyze.</h2>
            </div>
            <span className="workspace-count">4 tools</span>
          </div>
          <div className="tab-bar">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={`tab-btn${activeTool === tool.id ? " tab-btn-active" : ""}`}
                onClick={() => setActiveTool(tool.id)}
              >
                <span className="tab-icon">{tool.icon}</span>
                <span className="tab-text">
                  <strong>{tool.label}</strong>
                  <span>{tool.description}</span>
                </span>
                <span className="tab-index">{tool.index}</span>
              </button>
            ))}
          </div>

          <div className="split-panel">
            <div className="split-left">
              {activeTool === "search" && (
                <ToolPane image="/natural_search.jpg" index="01" title="Natural Search" description="Describe atmosphere, pacing, genre, era, or what should be excluded.">
                  <form className="stack" onSubmit={handleSearchSubmit}>
                    <textarea value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Neo-noir crime films with rain, restraint, and moral tension. No superheroes." />
                    <button type="submit">Find titles</button>
                  </form>
                </ToolPane>
              )}
              {activeTool === "recommend" && (
                <ToolPane image="/recommendation.jpg" index="02" title="Recommendations" description="Tell ReelSphere what works for you and let it connect the dots.">
                  <form className="stack" onSubmit={handleRecommendationSubmit}>
                    <textarea value={recommendQuery} onChange={(e) => setRecommendQuery(e.target.value)} placeholder="I like Heat, Zodiac, Collateral, and quiet thrillers with precision. Skip broad comedy." />
                    <button type="submit">Get recommendations</button>
                  </form>
                </ToolPane>
              )}
              {activeTool === "chat" && (
                <ToolPane image="/film_brain.jpg" index="03" title="Film Brain" description="Ask about directors, filmographies, hidden links, watch orders, or double features." tall>
                  <div id="chat-thread" className="chat-thread">
                    {chatMessages.map((msg, i) => (
                      <div key={`${msg.role}-${i}`} className={`chat-bubble ${msg.role}`}>
                        <p>{msg.content}</p>
                      </div>
                    ))}
                    {chatLoading && <div className="chat-bubble assistant"><LoadingDots /></div>}
                  </div>
                  <form className="chat-form" onSubmit={handleChatSubmit}>
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a movie question..." />
                    <button type="submit">Send</button>
                  </form>
                </ToolPane>
              )}
              {activeTool === "taste" && (
                <ToolPane image="/taste_decoder.jpg" index="04" title="Taste Decoder" description="Paste favorite titles, filmmakers, genres, and hard no's to map your viewing profile.">
                  <form className="stack" onSubmit={handleAnalyzeSubmit}>
                    <textarea value={analyzeQuery} onChange={(e) => setAnalyzeQuery(e.target.value)} placeholder="Favorites: In the Mood for Love, Arrival, The Social Network, Before Sunrise. I like precision and melancholy." />
                    <button type="submit">Analyze taste</button>
                  </form>
                </ToolPane>
              )}
            </div>

            <div className="split-right">
              <div className="results-header">
                <span className="results-label">Results</span>
                {activeTool === "search" && searchState.status === "ready" && (
                  <span className="results-count">{searchState.data?.results?.length ?? 0} titles</span>
                )}
                {activeTool === "recommend" && recommendState.status === "ready" && (
                  <span className="results-count">{recommendState.data?.recommendations?.length ?? 0} picks</span>
                )}
              </div>

              {activeTool === "search" && (
                <ResultPane state={searchState} emptyText="Describe a mood or vibe to surface matching films.">
                  {searchState.data && <SearchResults data={searchState.data} />}
                </ResultPane>
              )}
              {activeTool === "recommend" && (
                <ResultPane state={recommendState} emptyText="Tell us what you love and we'll find your next obsession.">
                  {recommendState.data && <RecommendationResults data={recommendState.data} />}
                </ResultPane>
              )}
              {activeTool === "chat" && (
                <div className="chat-hint-panel">
                  <div className="chat-hint-grid">
                    {[
                      { q: "What should I watch after Parasite?", icon: "🎬" },
                      { q: "Best Kubrick films ranked", icon: "🏆" },
                      { q: "Films like Arrival but more emotional", icon: "💫" },
                      { q: "Hidden gems from the 90s", icon: "💎" },
                      { q: "Double feature: Heat + ?", icon: "🎭" },
                      { q: "Best cinematography of the decade", icon: "📽" },
                    ].map((hint) => (
                      <button key={hint.q} type="button" className="hint-chip" onClick={() => { setChatInput(hint.q); document.querySelector(".chat-form input")?.focus(); }}>
                        <span>{hint.icon}</span>
                        <span>{hint.q}</span>
                      </button>
                    ))}
                  </div>
                  <p className="chat-hint-note">Click a suggestion or type your own question in the chat.</p>
                </div>
              )}
              {activeTool === "taste" && (
                <ResultPane state={analyzeState} emptyText="Paste your favorites and we'll decode your taste profile.">
                  {analyzeState.data && <AnalysisResults data={analyzeState.data} />}
                </ResultPane>
              )}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="site-footer reveal" data-reveal>
          <div className="footer-glow" />
          <div className="footer-brand">
            <img src="/logo.svg" alt="ReelSphere" className="footer-logo" />
            <div>
              <p className="eyebrow" style={{ fontSize: "1.4rem" }}>ReelSphere</p>
              <span className="nav-subtitle">AI cinema discovery engine</span>
            </div>
          </div>
          <div className="footer-links">
            <a href="#workspace" className="footer-link">Workspace</a>
            <a href="#movie-of-day" className="footer-link">Daily pick</a>
          </div>
          <div className="footer-divider" />
          <p className="footer-copy">
            Built with Gemini AI. Streaming data powered by Watchmode. Film metadata sourced live.
          </p>
        </footer>
      </div>
    </>
  );
}

/* ─── Sound Toggle ───────────────────────────────────────────── */

function SoundToggle() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  function toggle() {
    if (playing) {
      if (audioRef.current) audioRef.current.pause();
      setPlaying(false);
    } else {
      if (!audioRef.current) {
        const audio = new Audio("https://assets.mixkit.co/music/184/184.mp3");
        audio.loop = true;
        audio.volume = 0.35;
        audioRef.current = audio;
      }
      audioRef.current.play();
      setPlaying(true);
    }
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  return (
    <button type="button" className={`sound-toggle${playing ? " sound-on" : ""}`} onClick={toggle} title={playing ? "Mute ambience" : "Play cinema ambience"} aria-label={playing ? "Mute ambience" : "Play cinema ambience"}>
      <span className="sound-toggle-icon">{playing ? "🔊" : "🔇"}</span>
      <span className="sound-toggle-bars">
        <span /><span /><span />
      </span>
    </button>
  );
}

/* ─── Cinema Intro ───────────────────────────────────────────── */

function CinemaIntro() {
  const [count, setCount] = useState(3);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) { setDone(true); return; }

    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setCount(2), 850);
    const t2 = setTimeout(() => setCount(1), 1700);
    const t3 = setTimeout(() => setOpen(true), 2550);
    const t4 = setTimeout(() => {
      setDone(true);
      document.body.style.overflow = "";
    }, 3900);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      document.body.style.overflow = "";
    };
  }, []);

  if (done) return null;

  return (
    <div className={`cinema-intro${open ? " cinema-open" : ""}`}>
      {/* Film grain + scanlines */}
      <div className="cinema-scanlines" />
      {/* Film strip edges */}
      <div className="cinema-filmstrip cinema-filmstrip-left" />
      <div className="cinema-filmstrip cinema-filmstrip-right" />
      {/* Letterbox bars */}
      <div className="cinema-bar cinema-bar-top" />
      {/* Center content */}
      <div className="cinema-center">
        <div className="cinema-dust" />
        <span className="cinema-brand-label">ReelSphere</span>
        {/* Bare number — key re-mounts so entry animation fires each change */}
        <span className="cinema-countdown" key={count}>{count}</span>
        <span className="cinema-tagline">
          {count === 3 ? "Lights dimming…" : count === 2 ? "Screen awakening…" : "Your story begins."}
        </span>
      </div>
      <div className="cinema-bar cinema-bar-bottom" />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function ToolPane({ image, index, title, description, tall = false, children }) {
  return (
    <div className="tool-pane">
      <div className={`panel-media${tall ? " panel-media-tall" : ""}`}>
        <img src={image} alt={title} />
        <div className="panel-media-overlay" />
      </div>
      <div className="panel-header">
        <div>
          <span className="panel-kicker">{index}</span>
          <h2>{title}</h2>
        </div>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function ResultPane({ state, emptyText, children }) {
  if (state.status === "idle") {
    return (
      <div className="result-pane result-pane-empty">
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <p>{emptyText}</p>
        </div>
      </div>
    );
  }
  if (state.status === "loading") {
    return (
      <div className="result-pane result-pane-loading">
        <LoadingDots />
        <p className="loading-label">Thinking…</p>
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="result-pane result-pane-error">
        <p><strong>Error:</strong> {state.error}</p>
      </div>
    );
  }
  return <div className="result-pane">{children}</div>;
}

function RuntimeDot({ runtimeState }) {
  const ok = runtimeState.status === "ready" && runtimeState.data?.apiKeyConfigured;
  return (
    <div className="runtime-dot-wrap" title={ok ? "Runtime healthy" : "Checking runtime…"}>
      <span className={`runtime-dot-mini ${ok ? "dot-ok" : "dot-warn"}`} />
      <span className="runtime-dot-label">{ok ? runtimeState.data?.model || "Live" : "Checking…"}</span>
    </div>
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

function FeaturesShowcase() {
  const features = [
    { icon: "🔍", title: "Natural Search", desc: "Describe a vibe, mood, or cinematic texture. AI matches films that feel right, not just films that tag right.", accent: "rgba(229, 9, 20, 0.2)", border: "rgba(229, 9, 20, 0.3)" },
    { icon: "⭐", title: "Smart Recommendations", desc: "Feed it your favorites. The engine reads patterns across directors, pacing, tone, and era to find what's next.", accent: "rgba(255, 196, 0, 0.15)", border: "rgba(255, 196, 0, 0.3)" },
    { icon: "💬", title: "Film Brain Chat", desc: "Ask anything about cinema. Watch orders, double features, hidden connections, filmography deep dives.", accent: "rgba(0, 168, 255, 0.15)", border: "rgba(0, 168, 255, 0.3)" },
    { icon: "🎭", title: "Taste Decoder", desc: "Map your viewing profile. See your comfort zone, blind spots, and get pushed toward films you didn't know you needed.", accent: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)" },
  ];

  return (
    <section className="features-showcase reveal" data-reveal>
      <div className="features-header">
        <span className="features-kicker">What's inside</span>
        <h2 className="features-title">Four tools. One cinematic brain.</h2>
        <p className="features-subtitle">Each tool taps the same AI core but approaches film discovery from a different angle.</p>
      </div>
      <div className="features-grid">
        {features.map((f, i) => (
          <article key={f.title} className="feature-card" style={{ "--card-accent": f.accent, "--card-border": f.border }}>
            <div className="feature-card-number">0{i + 1}</div>
            <div className="feature-card-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <div className="feature-card-glow" />
          </article>
        ))}
      </div>
    </section>
  );
}

function StreamingMarquee({ trendingState }) {
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

function BackgroundScene() {
  return (
    <div className="bg-video-shell" aria-hidden="true">
      <video className="bg-video" autoPlay muted loop playsInline preload="metadata">
        <source src="/bg_video.mp4" type="video/mp4" />
      </video>
      <div className="bg-video-overlay" />
      <div className="bg-video-vignette" />
      <div className="bg-film-grain" />
    </div>
  );
}

function SearchResults({ data }) {
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

function RecommendationResults({ data }) {
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

function AnalysisResults({ data }) {
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
            {streamingPlatforms.slice(0, 4).map((p) => <span key={p} className="chip chip-provider">{p}</span>)}
          </div>
        </div>
      ) : null}
      <div className="meta">
        {normalizeArray(tags).map((tag) => <span key={tag} className="chip">{tag}</span>)}
      </div>
      <p>{description || ""}</p>
      <div className="watch-row">
        <span className={`watch-status ${hasStreaming && item?.watchLink ? "watch-status-live" : "watch-status-muted"}`}>
          {status}{region}
        </span>
        {hasStreaming && item?.watchLink ? (
          <a className="watch-link" href={item.watchLink} target="_blank" rel="noreferrer">Watch now</a>
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
      <section className="runtime-banner runtime-banner-warning reveal is-visible" aria-live="polite" data-reveal>
        <div className="runtime-copy">
          <div className="runtime-head"><span className="runtime-label">Now Running</span><span className="runtime-dot" /></div>
          <strong>Runtime status unavailable</strong>
          <p>{runtimeState.error}</p>
        </div>
        <div className="runtime-side">
          <div className="runtime-chips"><span className="status-chip status-chip-warn">Health check failed</span></div>
        </div>
      </section>
    );
  }
  if (runtimeState.status !== "ready") {
    return (
      <section className="runtime-banner runtime-banner-loading reveal" aria-live="polite" data-reveal>
        <div className="runtime-copy">
          <div className="runtime-head"><span className="runtime-label">Now Running</span><span className="runtime-dot" /></div>
          <strong>Checking active model...</strong>
          <p>Loading live server health and fallback chain.</p>
        </div>
        <div className="runtime-side"><div className="runtime-chips" /></div>
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
    <section className={`runtime-banner ${looksStale ? "runtime-banner-warning" : "runtime-banner-ready"} reveal is-visible`} aria-live="polite" data-reveal>
      <div className="runtime-copy">
        <div className="runtime-head"><span className="runtime-label">Now Running</span><span className="runtime-dot" /></div>
        <strong>{`Active model is ${model}`}</strong>
        <p>{apiKeyConfigured ? (looksStale ? "Running older high-quota model. Restart if unintentional." : "Live runtime looks healthy. Backup models armed if quota gets tight.") : "Gemini API key is not configured."}</p>
      </div>
      <div className="runtime-side">
        <div className="runtime-chips">
          <span className={`status-chip ${looksStale ? "status-chip-warn" : "status-chip-ok"}`}>{`Primary: ${model}`}</span>
          {backupModels.map((b) => <span key={b} className="status-chip status-chip-neutral">{`Backup: ${b}`}</span>)}
          <span className={`status-chip ${apiKeyConfigured ? "status-chip-ok" : "status-chip-warn"}`}>{apiKeyConfigured ? "API key set" : "API key missing"}</span>
          <span className={`status-chip ${watchmodeConfigured ? "status-chip-ok" : "status-chip-neutral"}`}>{watchmodeConfigured ? `Watchmode ${health.watchmode.region}` : "Watchmode off"}</span>
        </div>
      </div>
    </section>
  );
}

function FallbackNotice({ message }) {
  return <p className="fallback-note">{message}</p>;
}

function LoadingDots() {
  return (
    <div className="loading">
      <span /><span /><span /><span />
    </div>
  );
}

/* ─── Utilities ──────────────────────────────────────────────── */

async function postJson(url, payload) {
  return fetchJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

function normalizeArray(items) {
  return (Array.isArray(items) ? items : []).map((item) => String(item || "").trim()).filter(Boolean);
}

function initRevealAnimations() {
  const nodes = document.querySelectorAll("[data-reveal]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompact = window.matchMedia("(max-width: 768px)").matches;
  if (!("IntersectionObserver" in window) || reduceMotion || isCompact) {
    nodes.forEach((n) => { n.style.transitionDelay = "0ms"; n.classList.add("is-visible"); });
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); observer.unobserve(e.target); } }),
    { threshold: 0.16, rootMargin: "0px 0px -40px 0px" },
  );
  nodes.forEach((n, i) => { n.style.transitionDelay = `${i * 90}ms`; observer.observe(n); });
}

function initScrollScene() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCompact = window.matchMedia("(max-width: 768px)").matches;
  if (reduceMotion || isCompact) {
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
  const onScroll = () => { if (!ticking) { window.requestAnimationFrame(updateScene); ticking = true; } };
  updateScene();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateScene);
  return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", updateScene); };
}

function initCursorSpotlight(heroRef, spotlightRef) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return () => {};
  const onMove = (e) => {
    const hero = heroRef.current;
    const spot = spotlightRef.current;
    if (!hero || !spot) return;
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spot.style.opacity = "1";
    spot.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => { if (spotlightRef.current) spotlightRef.current.style.opacity = "0"; };
  const hero = heroRef.current;
  if (!hero) return () => {};
  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("mouseleave", onLeave);
  return () => { hero.removeEventListener("mousemove", onMove); hero.removeEventListener("mouseleave", onLeave); };
}

function initTiltCards() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return () => {};
  const selector = ".feature-card, .result-tile";

  const resetCard = (card) => {
    card.style.transition = "transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)";
    card.style.transform = "";
  };

  const onMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    // Remove transition during tracking so it follows cursor instantly
    card.style.transition = "box-shadow 0.18s ease";
    card.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) scale(1.015)`;
  };
  const onLeave = (e) => resetCard(e.currentTarget);
  // Reset on any click so Watch now / links don't leave card stuck mid-tilt
  const onDown = (e) => resetCard(e.currentTarget);

  const attach = () => {
    document.querySelectorAll(selector).forEach((card) => {
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", onLeave);
      card.addEventListener("mousedown", onDown);
    });
  };
  attach();
  const observer = new MutationObserver(attach);
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    document.querySelectorAll(selector).forEach((card) => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
      card.removeEventListener("mousedown", onDown);
    });
  };
}
