const state = {
  chatMessages: [
    {
      role: "assistant",
      content: "Ask about films, directors, genres, watch orders, or what to watch based on your mood."
    }
  ]
};

const searchForm = document.getElementById("search-form");
const recommendForm = document.getElementById("recommend-form");
const analyzeForm = document.getElementById("analyze-form");
const chatForm = document.getElementById("chat-form");

const searchOutput = document.getElementById("search-output");
const recommendOutput = document.getElementById("recommend-output");
const analyzeOutput = document.getElementById("analyze-output");
const chatThread = document.getElementById("chat-thread");
const runtimeBanner = document.getElementById("runtime-banner");
const runtimeTitle = document.getElementById("runtime-title");
const runtimeDetail = document.getElementById("runtime-detail");
const runtimeChips = document.getElementById("runtime-chips");

renderChat();
initRevealAnimations();
initScrollScene();
loadRuntimeStatus();

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = document.getElementById("search-query").value.trim();
  if (!query) return;

  setLoading(searchOutput);
  try {
    const result = await postJson("/api/search", { query });
    renderSearch(result.data);
  } catch (error) {
    renderError(searchOutput, error.message);
  }
});

recommendForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = document.getElementById("recommend-query").value.trim();
  if (!query) return;

  setLoading(recommendOutput);
  try {
    const result = await postJson("/api/recommendations", { query });
    renderRecommendations(result.data);
  } catch (error) {
    renderError(recommendOutput, error.message);
  }
});

analyzeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = document.getElementById("analyze-query").value.trim();
  if (!query) return;

  setLoading(analyzeOutput);
  try {
    const result = await postJson("/api/analyze-taste", { query });
    renderAnalysis(result.data);
  } catch (error) {
    renderError(analyzeOutput, error.message);
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.getElementById("chat-input");
  const content = input.value.trim();
  if (!content) return;

  state.chatMessages.push({ role: "user", content });
  input.value = "";
  renderChat(true);

  try {
    const result = await postJson("/api/chat", {
      messages: state.chatMessages
    });
    state.chatMessages.push({
      role: "assistant",
      content: result.data.answer
    });
    renderChat();
  } catch (error) {
    state.chatMessages.push({
      role: "assistant",
      content: `Error: ${error.message}`
    });
    renderChat();
  }
});

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || "Request failed.");
  }

  return body;
}

async function loadRuntimeStatus() {
  try {
    const response = await fetch("/api/health");
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || "Health check failed.");
    }

    renderRuntimeStatus(body);
  } catch (error) {
    renderRuntimeError(error.message);
  }
}

function renderSearch(data) {
  const results = Array.isArray(data.results) ? data.results : [];
  searchOutput.classList.remove("empty");
  searchOutput.innerHTML = `
    <div class="section-lead">
      <p><strong>${escapeHtml(data.summary || "Search results")}</strong></p>
    </div>
    <div class="result-rail">
      ${results.map((item) => renderMovieTile(item, "Match", item.whyItMatches, [
        ...normalizeArray(item.genres),
        ...normalizeArray(item.tone)
      ])).join("")}
    </div>
  `;
}

function renderRecommendations(data) {
  const items = Array.isArray(data.recommendations) ? data.recommendations : [];
  recommendOutput.classList.remove("empty");
  recommendOutput.innerHTML = `
    <div class="section-lead">
      <p><strong>${escapeHtml(data.tasteRead || "Recommendation read")}</strong></p>
    </div>
    <div class="result-rail">
      ${items.map((item) => renderMovieTile(item, "Recommended", item.reason, normalizeArray(item.vibe))).join("")}
    </div>
  `;
}

function renderMovieTile(item, label, description, tags) {
  const streamingPlatforms = normalizeArray(item.streamingPlatforms);
  const watchAction = renderWatchAction(item, streamingPlatforms);
  const streamingSection = streamingPlatforms.length
    ? `
        <div class="streaming-block">
          <span class="streaming-label">Streaming</span>
          <div class="streaming-chips">${renderProviderChips(streamingPlatforms)}</div>
        </div>
      `
    : "";

  return `
    <article class="result-tile">
      ${renderTilePoster(item)}
      <div class="tile-topline">
        <span class="tile-year">${escapeHtml(item.year || "?")}</span>
        <span class="tile-tag">${escapeHtml(label)}</span>
      </div>
      <h3>${escapeHtml(item.title || "Unknown title")}</h3>
      ${streamingSection}
      <div class="meta">${renderChips(tags)}</div>
      <p>${escapeHtml(description || "")}</p>
      ${watchAction}
    </article>
  `;
}

function renderWatchAction(item, streamingPlatforms) {
  const hasStreaming = Array.isArray(streamingPlatforms) && streamingPlatforms.length > 0;
  const status = item?.watchStatus || "No streaming platforms found";
  const region = item?.watchRegion ? ` in ${item.watchRegion}` : "";

  if (hasStreaming && item?.watchLink) {
    return `
      <div class="watch-row">
        <span class="watch-status watch-status-live">${escapeHtml(status)}${escapeHtml(region)}</span>
        <a class="watch-link" href="${escapeHtml(item.watchLink)}" target="_blank" rel="noreferrer">Watch now</a>
      </div>
    `;
  }

  return `
    <div class="watch-row">
      <span class="watch-status watch-status-muted">${escapeHtml(status)}${escapeHtml(region)}</span>
    </div>
  `;
}

function renderAnalysis(data) {
  const signals = Array.isArray(data.signals) ? data.signals : [];
  const nextPicks = Array.isArray(data.nextPicks) ? data.nextPicks : [];
  analyzeOutput.classList.remove("empty");
  analyzeOutput.innerHTML = `
    <article class="result-card">
      <h3>${escapeHtml(data.profileName || "Taste profile")}</h3>
      <p>${escapeHtml(data.overview || "")}</p>
    </article>
    <div class="signal-grid">
      ${signals.map((signal) => `
        <div class="signal-item">
          <div class="signal-row">
            <span>${escapeHtml(signal.label || "Signal")}</span>
            <span>${escapeHtml(String(signal.score || 0))}</span>
          </div>
          <p>${escapeHtml(signal.explanation || "")}</p>
        </div>
      `).join("")}
    </div>
    <article class="result-card">
      <h4>Comfort Zone</h4>
      <div class="meta">${renderChips(data.comfortZone)}</div>
      <h4>Blind Spots</h4>
      <div class="meta">${renderChips(data.blindSpots)}</div>
    </article>
    <article class="result-card">
      <h4>Next Picks</h4>
      ${nextPicks.map((pick) => `
        <p><strong>${escapeHtml(pick.title || "")}</strong>: ${escapeHtml(pick.why || "")}</p>
      `).join("")}
    </article>
  `;
}

function renderChat(loading = false) {
  chatThread.innerHTML = "";

  state.chatMessages.forEach((message) => {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${message.role}`;
    bubble.innerHTML = `<p>${escapeHtml(message.content)}</p>`;
    chatThread.appendChild(bubble);
  });

  if (loading) {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble assistant";
    bubble.appendChild(getLoadingNode());
    chatThread.appendChild(bubble);
  }

  chatThread.scrollTop = chatThread.scrollHeight;
}

function renderRuntimeStatus(health) {
  const model = health.model || "unknown";
  const backupModels = Array.isArray(health.backupModels) ? health.backupModels : [];
  const apiKeyConfigured = Boolean(health.apiKeyConfigured);
  const looksStale = model === "gemini-2.5-flash";
  const watchmodeConfigured = Boolean(health.watchmode?.configured);

  runtimeBanner.className = `runtime-banner ${looksStale ? "runtime-banner-warning" : "runtime-banner-ready"} reveal is-visible`;
  runtimeTitle.textContent = `Active model is ${model}`;
  runtimeDetail.textContent = apiKeyConfigured
    ? looksStale
      ? "This server is still running the older high-quota model. Restart it if that is not intentional."
      : "Live runtime looks healthy. Backup models are armed if quota gets tight."
    : "Gemini API key is not configured.";

  const chips = [
    renderStatusChip(`Primary: ${model}`, looksStale ? "warn" : "ok"),
    ...backupModels.map((backup) => renderStatusChip(`Backup: ${backup}`, "neutral")),
    renderStatusChip(apiKeyConfigured ? "API key set" : "API key missing", apiKeyConfigured ? "ok" : "warn"),
    renderStatusChip(watchmodeConfigured ? `Watchmode ${health.watchmode.region}` : "Watchmode off", watchmodeConfigured ? "ok" : "neutral")
  ];

  runtimeChips.innerHTML = chips.join("");
}

function renderRuntimeError(message) {
  runtimeBanner.className = "runtime-banner runtime-banner-warning reveal is-visible";
  runtimeTitle.textContent = "Runtime status unavailable";
  runtimeDetail.textContent = message;
  runtimeChips.innerHTML = renderStatusChip("Health check failed", "warn");
}

function renderError(target, message) {
  target.classList.remove("empty");
  target.innerHTML = `<p><strong>Error</strong>: ${escapeHtml(message)}</p>`;
}

function setLoading(target) {
  target.classList.remove("empty");
  target.innerHTML = "";
  target.appendChild(getLoadingNode());
}

function getLoadingNode() {
  return document.getElementById("loading-template").content.firstElementChild.cloneNode(true);
}

function renderChips(items = []) {
  return normalizeArray(items)
    .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
    .join("");
}

function renderProviderChips(items = []) {
  return normalizeArray(items)
    .slice(0, 4)
    .map((item) => `<span class="chip chip-provider">${escapeHtml(item)}</span>`)
    .join("");
}

function renderTilePoster(item) {
  const poster = item?.poster || "/1.jpg";
  const isFallback = poster === "/1.jpg";

  if (isFallback) {
    return `
      <div class="tile-poster tile-poster-fallback">
        <img src="${poster}" alt="Default movie artwork" loading="lazy" />
        <span>${escapeHtml((item && item.title) || "Movie")}</span>
      </div>
    `;
  }

  return `<div class="tile-poster"><img src="${escapeHtml(poster)}" alt="${escapeHtml(item?.title || "Movie poster")}" loading="lazy" /></div>`;
}

function renderStatusChip(label, tone) {
  return `<span class="status-chip status-chip-${tone}">${escapeHtml(label)}</span>`;
}

function normalizeArray(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function initRevealAnimations() {
  const nodes = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.16,
    rootMargin: "0px 0px -40px 0px"
  });

  nodes.forEach((node, index) => {
    node.style.transitionDelay = `${index * 90}ms`;
    observer.observe(node);
  });
}

function initScrollScene() {
  let ticking = false;

  const updateScene = () => {
    const maxDistance = Math.max(window.innerHeight * 0.9, 1);
    const progress = Math.min(window.scrollY / maxDistance, 1);

    document.body.style.setProperty("--scroll-progress", progress.toFixed(3));
    document.body.classList.toggle("is-scrolled", progress > 0.22);
    document.body.classList.toggle("is-deep-scrolled", progress > 0.68);
    ticking = false;
  };

  updateScene();

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScene);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", updateScene);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
