import { useEffect, useRef, useState } from "react";
import { initialChatMessages, TOOLS, HERO_WORDS, MOOD_BUTTONS } from "../../constants";
import { fetchJson, postJson } from "../../utils/api";
import { initRevealAnimations, initScrollScene, initCursorSpotlight, initTiltCards } from "../../utils/dom";
import CinemaIntro from "../CinemaIntro/CinemaIntro";
import SoundToggle from "../SoundToggle/SoundToggle";
import BackgroundScene from "../BackgroundScene/BackgroundScene";
import FeaturesShowcase from "../FeaturesShowcase/FeaturesShowcase";
import StreamingMarquee from "../StreamingMarquee/StreamingMarquee";
import MovieOfDayFeature from "../MovieOfDayFeature/MovieOfDayFeature";
import ToolPane from "../ToolPane/ToolPane";
import ResultPane from "../ResultPane/ResultPane";
import SearchResults from "../SearchResults/SearchResults";
import RecommendationResults from "../RecommendationResults/RecommendationResults";
import AnalysisResults from "../AnalysisResults/AnalysisResults";
import LoadingDots from "../LoadingDots/LoadingDots";
import "./App.css";

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
  const [trendingState, setTrendingState] = useState({ status: "loading", data: null });
  const [ledeText, setLedeText] = useState("");
  const [easterFlash, setEasterFlash] = useState(null);

  const heroRef = useRef(null);
  const spotlightRef = useRef(null);

  const LEDE_FULL = "Search by mood, get sharper recommendations, chat with a film brain, and decode your taste patterns in one cinematic workspace.";

  useEffect(() => { loadMovieOfDay(); loadTrending(); }, []);
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
                <div><strong>Live</strong><span>movie signals</span></div>
              </div>
            </aside>
          </div>
        </header>

        {/* ── FEATURES SHOWCASE ── */}
        <FeaturesShowcase trendingState={trendingState} movieOfDayState={movieOfDayState} />

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
            Built with AI. Streaming data powered by Watchmode. Film metadata sourced live.
          </p>
        </footer>
      </div>
    </>
  );
}
