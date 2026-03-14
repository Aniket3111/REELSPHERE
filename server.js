const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const { GoogleGenerativeAI } = require("@google/generative-ai");

loadEnv();

const PORT = Number(process.env.PORT || 3000);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_BACKUP_API_KEYS = parseApiKeyList(
  process.env.GEMINI_BACKUP_API_KEYS || "",
);
const GEMINI_KEYS = [GEMINI_API_KEY, ...GEMINI_BACKUP_API_KEYS].filter(Boolean);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const GEMINI_FALLBACK_MODELS = parseModelList(
  process.env.GEMINI_FALLBACK_MODELS ||
    "gemini-2.0-flash-lite,gemini-2.0-flash,gemini-1.5-flash",
);
const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY || "";
const WATCHMODE_REGION = (process.env.WATCHMODE_REGION || "IN").toUpperCase();
const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";
const DEFAULT_POSTER_PATH = "/1.jpg";
const RATE_LIMIT_MAX_REQUESTS = Number(
  process.env.RATE_LIMIT_MAX_REQUESTS || 5,
);
const RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000,
);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const DIST_DIR = path.join(__dirname, "dist");

const requestUsage = new Map();
const responseCache = new Map();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

const FALLBACK_LIBRARY = [
  { title: "Inception", year: "2010", blurb: "High-concept suspense with precision set pieces.", genres: ["Sci-Fi", "Thriller"], tone: ["Sleek", "Mind-bending"], vibe: ["Cerebral", "Big-screen"] },
  { title: "The Dark Knight", year: "2008", blurb: "Propulsive crime escalation with huge stakes.", genres: ["Crime", "Action"], tone: ["Tense", "Epic"], vibe: ["Dark", "Prestige"] },
  { title: "Interstellar", year: "2014", blurb: "Emotion-forward science fiction with scale.", genres: ["Sci-Fi", "Drama"], tone: ["Expansive", "Emotional"], vibe: ["Cosmic", "Intense"] },
  { title: "Zodiac", year: "2007", blurb: "Methodical obsession and procedural dread.", genres: ["Crime", "Mystery"], tone: ["Patient", "Uneasy"], vibe: ["Investigative", "Cold"] },
  { title: "Blade Runner 2049", year: "2017", blurb: "Atmospheric futurism with meditative weight.", genres: ["Sci-Fi", "Neo-noir"], tone: ["Moody", "Elegant"], vibe: ["Slow-burn", "Visual"] },
  { title: "Arrival", year: "2016", blurb: "Thoughtful science fiction built on emotion and ideas.", genres: ["Sci-Fi", "Drama"], tone: ["Reflective", "Intimate"], vibe: ["Smart", "Melancholic"] },
  { title: "Heat", year: "1995", blurb: "A crime saga driven by professionalism and obsession.", genres: ["Crime", "Thriller"], tone: ["Controlled", "Urban"], vibe: ["Masculine", "Operatic"] },
  { title: "Whiplash", year: "2014", blurb: "A pressure-cooker character duel with relentless pace.", genres: ["Drama", "Music"], tone: ["Aggressive", "Electric"], vibe: ["Driven", "Intense"] },
  { title: "Mad Max: Fury Road", year: "2015", blurb: "Pure momentum with world-class action design.", genres: ["Action", "Adventure"], tone: ["Ferocious", "Kinetic"], vibe: ["Adrenaline", "Visual"] },
  { title: "Parasite", year: "2019", blurb: "Sharp social tension that keeps shifting shape.", genres: ["Thriller", "Drama"], tone: ["Satirical", "Suspenseful"], vibe: ["Modern", "Unpredictable"] },
  { title: "The Social Network", year: "2010", blurb: "Fast, precise dialogue with icy ambition underneath.", genres: ["Drama", "Biography"], tone: ["Sharp", "Cold"], vibe: ["Talky", "Prestige"] },
  { title: "Spider-Man: Into the Spider-Verse", year: "2018", blurb: "Inventive animation with real energy and heart.", genres: ["Animation", "Action"], tone: ["Playful", "Bold"], vibe: ["Stylized", "Crowd-pleasing"] },
];

const SYSTEM_PROMPTS = {
  movieOfDay: `You are a film curator selecting one "movie of the day".
Return valid JSON only with this shape:
{
  "title": "string",
  "year": "string",
  "hook": "short punchy one-liner",
  "overview": "2 to 3 sentences about what makes it worth watching",
  "whyToday": "1 sentence explaining why this is today's pick",
  "highlights": ["string", "string", "string"],
  "vibe": ["string", "string", "string"]
}
Rules:
- Pick one real, well-known movie.
- Vary the selection across eras and styles.
- Keep every field concise and specific.
- Do not include markdown fences.`,
  search: `You are a film discovery engine. Convert a natural language movie search request into a concise JSON object.
Return valid JSON only with this shape:
{
  "summary": "one sentence",
  "results": [
    {
      "title": "string",
      "year": "string",
      "whyItMatches": "string",
      "genres": ["string"],
      "tone": ["string"]
    }
  ]
}
Rules:
- Return 5 to 8 movies.
- Prefer well-known, real films.
- Use short, precise descriptions.
- If the request is underspecified, infer sensible matches rather than asking follow-up questions.`,
  recommendations: `You are a movie recommendation engine. Return valid JSON only with this shape:
{
  "tasteRead": "one paragraph",
  "recommendations": [
    {
      "title": "string",
      "year": "string",
      "reason": "string",
      "vibe": ["string"]
    }
  ]
}
Rules:
- Return 6 recommendations.
- Avoid duplicates or near-duplicates.
- Ground the choices in the user's stated preferences and avoid generic filler.`,
  analyzer: `You are a movie taste analyst. Return valid JSON only with this shape:
{
  "profileName": "string",
  "overview": "string",
  "signals": [
    { "label": "string", "score": 0, "explanation": "string" }
  ],
  "comfortZone": ["string"],
  "blindSpots": ["string"],
  "nextPicks": [
    { "title": "string", "why": "string" }
  ]
}
Rules:
- Provide exactly 4 signals with scores from 1 to 100.
- Use sharp, concrete language instead of generic praise.
- Base the analysis only on the supplied taste notes.`,
  chat: `You are AI Movie Explorer, a concise movie expert.
Rules:
- Answer directly and keep a confident editorial voice.
- Prefer factual movie knowledge, contextual comparisons, and concrete watch suggestions.
- If the user asks for a ranking or list, give a structured answer.
- If uncertain about a niche fact, state the uncertainty briefly instead of inventing details.`,
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && requestUrl.pathname === "/api/search") {
      return handleJsonEndpoint(req, res, "/api/search", async (body) => {
        const prompt = `User request: ${body.query || ""}`;
        const data = await callModelJson(SYSTEM_PROMPTS.search, prompt);
        data.results = await enrichMovieList(data.results);
        return { data };
      });
    }

    if (
      req.method === "POST" &&
      requestUrl.pathname === "/api/recommendations"
    ) {
      return handleJsonEndpoint(
        req,
        res,
        "/api/recommendations",
        async (body) => {
          const prompt = `User taste input:\n${body.query || ""}`;
          const data = await callModelJson(
            SYSTEM_PROMPTS.recommendations,
            prompt,
          );
          data.recommendations = await enrichMovieList(data.recommendations);
          return { data };
        },
      );
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/analyze-taste") {
      return handleJsonEndpoint(
        req,
        res,
        "/api/analyze-taste",
        async (body) => {
          const prompt = `Taste notes:\n${body.query || ""}`;
          const data = await callModelJson(SYSTEM_PROMPTS.analyzer, prompt);
          data.nextPicks = await enrichMovieList(data.nextPicks);
          return { data };
        },
      );
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/chat") {
      return handleJsonEndpoint(req, res, "/api/chat", async (body) => {
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const transcript = messages
          .map(
            (message) =>
              `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`,
          )
          .join("\n");
        const answer = await callModelText(SYSTEM_PROMPTS.chat, transcript);
        return { data: { answer } };
      });
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/movie-of-day") {
      if (!GEMINI_KEYS.length) {
        return sendJson(res, 500, {
          error:
            "No Gemini API keys are configured. Set GEMINI_API_KEY in your .env file.",
        });
      }

      const cacheKey = createCacheKey("/api/movie-of-day", {
        day: getDailyCacheBucket(),
        region: WATCHMODE_REGION,
      });
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return sendJson(res, 200, { ...cached, cached: true });
      }

      try {
        const prompt = `Date: ${new Date().toISOString().slice(0, 10)}\nRegion: ${WATCHMODE_REGION}\nSelect a movie of the day for a modern streaming dashboard audience.`;
        const data = await callModelJson(SYSTEM_PROMPTS.movieOfDay, prompt);
        const [movie] = await enrichMovieList([data]);
        const result = { data: movie || data };
        setCachedResponse(cacheKey, result, 24 * 60 * 60 * 1000);
        return sendJson(res, 200, { ...result, cached: false });
      } catch (error) {
        console.error(error);
        return sendJson(res, 500, {
          error: error.message || "Request failed.",
        });
      }
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/health") {
      pruneMaps();
      return sendJson(res, 200, {
        ok: true,
        model: GEMINI_MODEL,
        api: "Google Gemini",
        apiKeyConfigured: Boolean(GEMINI_API_KEY),
        backupModels: GEMINI_FALLBACK_MODELS,
        backupApiKeys: GEMINI_BACKUP_API_KEYS.length,
        totalApiKeys: GEMINI_KEYS.length,
        watchmode: {
          configured: Boolean(WATCHMODE_API_KEY),
          region: WATCHMODE_REGION,
        },
        rateLimit: {
          maxRequests: RATE_LIMIT_MAX_REQUESTS,
          windowMs: RATE_LIMIT_WINDOW_MS,
        },
        cache: {
          ttlMs: CACHE_TTL_MS,
          entries: responseCache.size,
        },
      });
    }

    return serveStatic(req, res, requestUrl);
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`AI Movie Explorer running at http://localhost:${PORT}`);
});

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const index = line.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line
      .slice(index + 1)
      .trim()
      .replace(/^"|"$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function handleJsonEndpoint(req, res, routeKey, handler) {
  try {
    if (!GEMINI_KEYS.length) {
      return sendJson(res, 500, {
        error:
          "No Gemini API keys are configured. Set GEMINI_API_KEY in your .env file.",
      });
    }

    const body = await readJson(req);
    const cacheKey = createCacheKey(routeKey, body);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return sendJson(res, 200, { ...cached, cached: true });
    }

    const ip = getClientIp(req);
    const limitState = consumeRateLimit(ip);
    if (!limitState.allowed) {
      if (routeKey !== "/api/chat") {
        const fallback = await createRateLimitFallback(routeKey);
        return sendJson(res, 200, {
          ...fallback,
          cached: false,
          fallback: true,
          limited: true,
        });
      }

      return sendJson(res, 429, {
        error: `Rate limit reached for this IP. Try again in ${Math.ceil(limitState.retryAfterMs / 1000 / 60)}hrs.`,
      });
    }

    const result = await handler(body);
    setCachedResponse(cacheKey, result);
    return sendJson(res, 200, { ...result, cached: false });
  } catch (error) {
    console.error(error);

    if (routeKey !== "/api/chat" && isGeminiQuotaError(error)) {
      const fallback = await createRateLimitFallback(routeKey);
      return sendJson(res, 200, {
        ...fallback,
        cached: false,
        fallback: true,
        limited: true,
      });
    }

    return sendJson(res, 500, {
      error: error.message || "Request failed.",
    });
  }
}

async function createRateLimitFallback(routeKey) {
  const picks = await buildFallbackMovies();
  const message = "Sorry, your AI limit is reached right now. Showing a fallback movie list with streaming availability instead.";

  if (routeKey === "/api/search") {
    return {
      data: {
        summary: message,
        results: picks.map((item) => ({
          ...item,
          whyItMatches: item.blurb,
          genres: item.genres || [],
          tone: item.tone || [],
        })),
      },
      notice: message,
    };
  }

  if (routeKey === "/api/recommendations") {
    return {
      data: {
        tasteRead: message,
        recommendations: picks.map((item) => ({
          ...item,
          reason: item.blurb,
          vibe: item.vibe || [],
        })),
      },
      notice: message,
    };
  }

  if (routeKey === "/api/analyze-taste") {
    return {
      data: {
        profileName: "Fallback Watchlist",
        overview: message,
        signals: [
          { label: "AI Access", score: 0, explanation: "Daily limit reached for this IP." },
          { label: "Fallback Depth", score: 72, explanation: "Showing a broad set of reliable films instead." },
          { label: "Streaming Coverage", score: 68, explanation: "Watchmode data is still being used for provider availability." },
          { label: "Discovery Value", score: 74, explanation: "The list is mixed across styles so you still have solid options." },
        ],
        comfortZone: ["Popular essentials", "High-signal picks"],
        blindSpots: ["Custom AI analysis paused until the limit resets"],
        nextPicks: picks.map((item) => ({
          ...item,
          why: item.blurb,
        })),
      },
      notice: message,
    };
  }

  return {
    data: { items: picks },
    notice: message,
  };
}

async function buildFallbackMovies() {
  const daySeed = Number(new Date().toISOString().slice(8, 10));
  const offset = daySeed % FALLBACK_LIBRARY.length;
  const rotated = FALLBACK_LIBRARY.slice(offset).concat(FALLBACK_LIBRARY.slice(0, offset));
  const selected = rotated.slice(0, 6).map((item) => ({ ...item }));
  return enrichMovieList(selected);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}

function createCacheKey(routeKey, body) {
  const payload = JSON.stringify({ routeKey, body });
  return crypto.createHash("sha1").update(payload).digest("hex");
}

function getCachedResponse(cacheKey) {
  pruneMaps();
  const entry = responseCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    responseCache.delete(cacheKey);
    return null;
  }

  return entry.value;
}

function setCachedResponse(cacheKey, value, ttlMs = CACHE_TTL_MS) {
  responseCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function getDailyCacheBucket() {
  return new Date().toISOString().slice(0, 10);
}

function consumeRateLimit(ip) {
  pruneMaps();
  const now = Date.now();

  if (RATE_LIMIT_MAX_REQUESTS <= 0) {
    return { allowed: false, remaining: 0, retryAfterMs: RATE_LIMIT_WINDOW_MS };
  }

  const entry = requestUsage.get(ip);

  if (!entry || now >= entry.expiresAt) {
    requestUsage.set(ip, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterMs: RATE_LIMIT_WINDOW_MS,
    };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.expiresAt - now,
    };
  }

  entry.count += 1;
  requestUsage.set(ip, entry);
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    retryAfterMs: entry.expiresAt - now,
  };
}

function pruneMaps() {
  const now = Date.now();

  for (const [key, value] of responseCache.entries()) {
    if (value.expiresAt <= now) {
      responseCache.delete(key);
    }
  }

  for (const [key, value] of requestUsage.entries()) {
    if (value.expiresAt <= now) {
      requestUsage.delete(key);
    }
  }
}

async function callModelJson(systemPrompt, userPrompt) {
  const text = await callModelText(systemPrompt, userPrompt, {
    temperature: 0.8,
  });
  return safeJsonParse(text);
}

async function callModelText(systemPrompt, userPrompt, options = {}) {
  const modelsToTry = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS].filter(Boolean);
  const failures = [];

  for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex += 1) {
    const apiKey = GEMINI_KEYS[keyIndex];
    const client = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTry) {
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const generationConfig = {
          temperature: options.temperature ?? 0.7,
          topP: 1,
          topK: 32,
          maxOutputTokens: 2048,
        };

        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }, { text: userPrompt }],
            },
          ],
          generationConfig,
        });

        const response = await result.response;
        const outputText = response.text();

        if (!outputText) {
          throw new Error("Gemini response did not include text output.");
        }

        return outputText.trim();
      } catch (error) {
        const message = String(error.message || "Unknown Gemini error");
        failures.push({ keyIndex, model: modelName, message });

        if (message.includes("API key") || message.includes("permission")) {
          break;
        }

        if (shouldTryNextGeminiTarget(error)) {
          continue;
        }

        throw new Error(
          `Gemini API error on key ${keyIndex + 1}, model ${modelName}: ${message}`,
        );
      }
    }
  }

  const quotaFailures = failures.filter((failure) =>
    isGeminiQuotaError({ message: failure.message }),
  );
  if (quotaFailures.length) {
    throw new Error(
      `Gemini quota exceeded across configured keys/models. Tried ${GEMINI_KEYS.length} key(s) and models: ${modelsToTry.join(", ")}. ${extractRetryHint(quotaFailures[0].message)}`,
    );
  }

  throw new Error(
    `Gemini failed across configured keys/models. Tried ${GEMINI_KEYS.length} key(s) and models: ${modelsToTry.join(", ")}.`,
  );
}

async function enrichMovieList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const enriched = await Promise.all(
    items.map(async (item) => {
      const base =
        item && typeof item === "object"
          ? { ...item }
          : { title: String(item || "") };
      if (!WATCHMODE_API_KEY || !base.title) {
        return addFallbackWatchmodeFields(base);
      }

      try {
        const search = await searchWatchmodeTitle(base.title, base.year);
        if (!search) {
          return addFallbackWatchmodeFields(base);
        }

        const details = await getWatchmodeTitleDetails(search.id);
        const streamingPlatforms = extractPlatforms(details);
        const watchLink = streamingPlatforms.length
          ? pickWatchLink(details)
          : "";

        return {
          ...base,
          watchmodeId: search.id,
          poster: pickPoster(details) || DEFAULT_POSTER_PATH,
          streamingPlatforms,
          watchLink,
          watchRegion: WATCHMODE_REGION,
          watchStatus:
            watchLink && streamingPlatforms.length
              ? "Watch now"
              : streamingPlatforms.length
                ? "Available to stream"
                : "No streaming platforms found",
        };
      } catch {
        return addFallbackWatchmodeFields(base);
      }
    }),
  );

  return enriched;
}

function addFallbackWatchmodeFields(item) {
  const streamingPlatforms = Array.isArray(item.streamingPlatforms)
    ? item.streamingPlatforms
    : [];
  const watchLink = streamingPlatforms.length ? item.watchLink || "" : "";
  return {
    ...item,
    poster: item.poster || DEFAULT_POSTER_PATH,
    streamingPlatforms,
    watchLink,
    watchRegion: WATCHMODE_REGION,
    watchStatus:
      watchLink && streamingPlatforms.length
        ? "Watch now"
        : streamingPlatforms.length
          ? "Available to stream"
          : "No streaming platforms found",
  };
}

async function searchWatchmodeTitle(title, year) {
  const params = new URLSearchParams({
    apiKey: WATCHMODE_API_KEY,
    search_field: "name",
    search_value: title,
    types: "movie",
  });

  const data = await fetchWatchmodeJson(`/search/?${params.toString()}`);
  const candidates = Array.isArray(data.title_results)
    ? data.title_results
    : Array.isArray(data.results)
      ? data.results
      : [];

  if (!candidates.length) {
    return null;
  }

  const normalizedYear = normalizeYear(year);
  const exactMatch = candidates.find((candidate) => {
    const candidateYear = normalizeYear(
      candidate.year || candidate.release_year,
    );
    return (
      normalizeTitle(candidate.name || candidate.title) ===
        normalizeTitle(title) &&
      (!normalizedYear || candidateYear === normalizedYear)
    );
  });

  return exactMatch || candidates[0] || null;
}

async function getWatchmodeTitleDetails(id) {
  const params = new URLSearchParams({
    apiKey: WATCHMODE_API_KEY,
    append_to_response: "sources",
  });
  return fetchWatchmodeJson(`/title/${id}/details/?${params.toString()}`);
}

async function fetchWatchmodeJson(pathname) {
  const response = await fetch(`${WATCHMODE_BASE_URL}${pathname}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || "Watchmode request failed.",
    );
  }

  return data;
}

function extractPlatforms(details) {
  const sources = Array.isArray(details.sources) ? details.sources : [];
  const allowedTypes = new Set(["sub", "free"]);
  const regionSources = sources.filter((source) => {
    const region = String(source.region || source.country || "").toUpperCase();
    return (
      (!region || region === WATCHMODE_REGION) &&
      (!source.type || allowedTypes.has(String(source.type).toLowerCase()))
    );
  });

  const names = regionSources
    .map((source) => source.name || source.display_name)
    .filter(Boolean)
    .filter((name, index, array) => array.indexOf(name) === index);

  return names.slice(0, 5);
}

function pickWatchLink(details) {
  const sources = Array.isArray(details.sources) ? details.sources : [];
  const source =
    sources.find((entry) => {
      const region = String(entry.region || entry.country || "").toUpperCase();
      const type = String(entry.type || "").toLowerCase();
      return region === WATCHMODE_REGION && (type === "sub" || type === "free");
    }) ||
    sources.find((entry) => {
      const type = String(entry.type || "").toLowerCase();
      return type === "sub" || type === "free";
    });

  return source?.web_url || source?.url || "";
}

function pickPoster(details) {
  return (
    details.poster ||
    details.poster_url ||
    details.poster_240x342 ||
    details.poster_360x540 ||
    ""
  );
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeYear(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? match[0] : "";
}

function parseModelList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .filter((item) => item !== GEMINI_MODEL);
}

function parseApiKeyList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .filter((item) => item !== GEMINI_API_KEY);
}

function shouldTryNextGeminiTarget(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("429") ||
    message.includes("quota exceeded") ||
    message.includes("rate limit") ||
    message.includes("resource exhausted") ||
    message.includes("503") ||
    message.includes("overloaded") ||
    message.includes("unavailable") ||
    message.includes("not found") ||
    message.includes("api key") ||
    message.includes("permission")
  );
}

function isGeminiQuotaError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("429") ||
    message.includes("quota exceeded") ||
    message.includes("resource exhausted") ||
    message.includes("rate limit")
  );
}

function extractRetryHint(message) {
  const retryMatch = String(message).match(/retry in ([^.\]]+)/i);
  return retryMatch ? `Retry ${retryMatch[0]}.` : "Retry later.";
}

function safeJsonParse(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("The model returned invalid JSON. Try again.");
  }
}

function serveStatic(req, res, requestUrl) {
  if (!fs.existsSync(DIST_DIR)) {
    return sendText(
      res,
      503,
      "Frontend build not found. Run `npm run build` for production or use `npm run dev` for development.",
    );
  }

  let filePath = path.join(
    DIST_DIR,
    requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname,
  );

  if (!filePath.startsWith(DIST_DIR)) {
    return sendText(res, 403, "Forbidden");
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        const hasExtension = path.extname(requestUrl.pathname).length > 0;
        if (hasExtension) {
          return sendText(res, 404, "Not found");
        }

        const fallbackIndex = path.join(DIST_DIR, "index.html");
        return fs.readFile(fallbackIndex, (indexError, indexContent) => {
          if (indexError) {
            return sendText(res, 404, "Not found");
          }

          res.writeHead(200, {
            "Content-Type": MIME_TYPES[".html"],
          });
          res.end(indexContent);
        });
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      });
      res.end(content);
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(payload);
}
