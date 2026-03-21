const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";
const DEFAULT_POSTER_PATH = "/1.jpg";
const requestUsage = new Map();
const responseCache = new Map();

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

function getConfig() {
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  const geminiBackupApiKeys = parseApiKeyList(
    process.env.GEMINI_BACKUP_API_KEYS || "",
    geminiApiKey,
  );
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const geminiFallbackModels = parseModelList(
    process.env.GEMINI_FALLBACK_MODELS ||
      "gemini-2.0-flash-lite,gemini-2.0-flash,gemini-1.5-flash",
    geminiModel,
  );

  return {
    geminiApiKey,
    geminiBackupApiKeys,
    geminiKeys: [geminiApiKey, ...geminiBackupApiKeys].filter(Boolean),
    geminiModel,
    geminiFallbackModels,
    watchmodeApiKey: process.env.WATCHMODE_API_KEY || "",
    watchmodeRegion: (process.env.WATCHMODE_REGION || "IN").toUpperCase(),
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 5),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000),
    cacheTtlMs: Number(process.env.CACHE_TTL_MS || 6 * 60 * 60 * 1000),
    dailyTimezone: process.env.DAILY_TIMEZONE || "Asia/Kolkata",
  };
}

async function handleApiRequest(req, res, routeKey, handler) {
  const config = getConfig();

  try {
    if (!config.geminiKeys.length) {
      return sendJson(res, 500, {
        error:
          "No Gemini API keys are configured. Set GEMINI_API_KEY in your environment variables.",
      });
    }

    const body = await readBody(req);
    const cacheKey = createCacheKey(routeKey, body);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return sendJson(res, 200, { ...cached, cached: true });
    }

    const ip = getClientIp(req);
    const limitState = consumeRateLimit(ip, config.rateLimitMaxRequests, config.rateLimitWindowMs);
    if (!limitState.allowed) {
      const fallback = await createRateLimitFallback(routeKey, config);
      if (routeKey === "/api/chat") {
        fallback.data.answer = `${fallback.data.answer}

Retry in about ${Math.ceil(limitState.retryAfterMs / 1000 / 60)} hour(s).`;
      }
      return sendJson(res, 200, {
        ...fallback,
        cached: false,
        fallback: true,
        limited: true,
      });
    }

    const result = await handler(body, config);
    setCachedResponse(cacheKey, result, config.cacheTtlMs);
    return sendJson(res, 200, { ...result, cached: false });
  } catch (error) {
    console.error(error);

    if (isGeminiQuotaError(error)) {
      const fallback = await createRateLimitFallback(routeKey, config);
      return sendJson(res, 200, {
        ...fallback,
        cached: false,
        fallback: true,
        limited: true,
      });
    }

    return sendJson(res, 500, { error: error.message || "Request failed." });
  }
}

async function createRateLimitFallback(routeKey, config) {
  const picks = await buildFallbackMovies(config);
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

  if (routeKey === "/api/movie-of-day") {
    return {
      data: createMovieOfDayFallback(picks[0], message),
      notice: message,
    };
  }

  if (routeKey === "/api/chat") {
    return {
      data: {
        answer: createChatFallbackAnswer(picks, message),
      },
      notice: message,
    };
  }

  return {
    data: { items: picks },
    notice: message,
  };
}

async function buildFallbackMovies(config) {
  const dayBucket = getDailyCacheBucket(config.dailyTimezone);
  const daySeed = Number(dayBucket.replace(/-/g, ""));
  const offset = daySeed % FALLBACK_LIBRARY.length;
  const rotated = FALLBACK_LIBRARY.slice(offset).concat(FALLBACK_LIBRARY.slice(0, offset));
  const selected = rotated.slice(0, 6).map((item) => ({ ...item }));
  return enrichMovieList(selected, config);
}

async function handleMovieOfDayRequest(req, res) {
  const config = getConfig();
  const fallbackResponse = async () => createRateLimitFallback("/api/movie-of-day", config);

  try {
    if (!config.geminiKeys.length) {
      const fallback = await fallbackResponse();
      return sendJson(res, 200, {
        ...fallback,
        cached: false,
        fallback: true,
        limited: true,
      });
    }

    const dailyBucket = getDailyCacheBucket(config.dailyTimezone);
    const cacheKey = createCacheKey("/api/movie-of-day", {
      day: dailyBucket,
      region: config.watchmodeRegion,
    });
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      return sendJson(res, 200, { ...cached, cached: true });
    }

    const dailyTheme = getDailyTheme(dailyBucket);
    const prompt = `Date: ${dailyBucket}\nTimezone: ${config.dailyTimezone}\nRegion: ${config.watchmodeRegion}\nTheme: ${dailyTheme}\nSelect a movie of the day for a modern streaming dashboard audience.`;
    const data = await callModelJson(SYSTEM_PROMPTS.movieOfDay, prompt, config);
    const [movie] = await enrichMovieList([data], config);
    const result = { data: movie || data, notice: "" };
    setCachedResponse(cacheKey, result, 24 * 60 * 60 * 1000);
    return sendJson(res, 200, { ...result, cached: false });
  } catch (error) {
    console.error(error);
    if (isGeminiQuotaError(error)) {
      const fallback = await fallbackResponse();
      return sendJson(res, 200, {
        ...fallback,
        cached: false,
        fallback: true,
        limited: true,
      });
    }
    return sendJson(res, 500, { error: error.message || "Request failed." });
  }
}

function getHealthPayload() {
  const config = getConfig();
  pruneMaps();
  return {
    ok: true,
    model: config.geminiModel,
    api: "Google Gemini",
    apiKeyConfigured: Boolean(config.geminiApiKey),
    backupModels: config.geminiFallbackModels,
    backupApiKeys: config.geminiBackupApiKeys.length,
    totalApiKeys: config.geminiKeys.length,
    watchmode: {
      configured: Boolean(config.watchmodeApiKey),
      region: config.watchmodeRegion,
    },
    rateLimit: {
      maxRequests: config.rateLimitMaxRequests,
      windowMs: config.rateLimitWindowMs,
    },
    cache: {
      ttlMs: config.cacheTtlMs,
      entries: responseCache.size,
    },
  };
}

async function searchHandler(body, config) {
  const prompt = `User request: ${body.query || ""}`;
  const data = await callModelJson(SYSTEM_PROMPTS.search, prompt, config);
  data.results = await enrichMovieList(data.results, config);
  return { data };
}

async function recommendationsHandler(body, config) {
  const prompt = `User taste input:\n${body.query || ""}`;
  const data = await callModelJson(SYSTEM_PROMPTS.recommendations, prompt, config);
  data.recommendations = await enrichMovieList(data.recommendations, config);
  return { data };
}

async function analyzeTasteHandler(body, config) {
  const prompt = `Taste notes:\n${body.query || ""}`;
  const data = await callModelJson(SYSTEM_PROMPTS.analyzer, prompt, config);
  data.nextPicks = await enrichMovieList(data.nextPicks, config);
  return { data };
}

async function chatHandler(body, config) {
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const transcript = messages
    .map(
      (message) =>
        `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`,
    )
    .join("\n");
  const answer = await callModelText(SYSTEM_PROMPTS.chat, transcript, config);
  return { data: { answer } };
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return req.body ? JSON.parse(req.body) : {};
  }

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
  return forwarded || req.socket?.remoteAddress || "unknown";
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

function setCachedResponse(cacheKey, value, ttlMs) {
  responseCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function getDailyCacheBucket(timeZone = "UTC") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getDailyTheme(dayBucket) {
  const themes = [
    "High-intensity thriller night",
    "Elegant slow-burn cinema",
    "Visually bold crowd-pleaser",
    "Character-driven emotional drama",
    "Sharp crime and noir storytelling",
    "Ambitious sci-fi with ideas",
    "Modern classic worth revisiting",
  ];
  const seed = Number(String(dayBucket || "").replace(/-/g, "")) || Date.now();
  return themes[seed % themes.length];
}

function consumeRateLimit(ip, maxRequests, windowMs) {
  pruneMaps();
  const now = Date.now();

  if (maxRequests <= 0) {
    return { allowed: false, remaining: 0, retryAfterMs: windowMs };
  }

  const entry = requestUsage.get(ip);

  if (!entry || now >= entry.expiresAt) {
    requestUsage.set(ip, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterMs: windowMs,
    };
  }

  if (entry.count >= maxRequests) {
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
    remaining: maxRequests - entry.count,
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

async function callModelJson(systemPrompt, userPrompt, config) {
  const text = await callModelText(systemPrompt, userPrompt, config, {
    temperature: 0.8,
  });
  return safeJsonParse(text);
}

async function callModelText(systemPrompt, userPrompt, config, options = {}) {
  const modelsToTry = [config.geminiModel, ...config.geminiFallbackModels].filter(Boolean);
  const failures = [];

  for (let keyIndex = 0; keyIndex < config.geminiKeys.length; keyIndex += 1) {
    const apiKey = config.geminiKeys[keyIndex];
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
      `Gemini quota exceeded across configured keys/models. Tried ${config.geminiKeys.length} key(s) and models: ${modelsToTry.join(", ")}. ${extractRetryHint(quotaFailures[0].message)}`,
    );
  }

  throw new Error(
    `Gemini failed across configured keys/models. Tried ${config.geminiKeys.length} key(s) and models: ${modelsToTry.join(", ")}.`,
  );
}

async function enrichMovieList(items, config) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const enriched = await Promise.all(
    items.map(async (item) => {
      const base =
        item && typeof item === "object"
          ? { ...item }
          : { title: String(item || "") };
      if (!config.watchmodeApiKey || !base.title) {
        return addFallbackWatchmodeFields(base, config.watchmodeRegion);
      }

      try {
        const search = await searchWatchmodeTitle(base.title, base.year, config);
        if (!search) {
          return addFallbackWatchmodeFields(base, config.watchmodeRegion);
        }

        const details = await getWatchmodeTitleDetails(search.id, config);
        const streamingPlatforms = extractPlatforms(details, config.watchmodeRegion);
        const watchLink = streamingPlatforms.length ? pickWatchLink(details, config.watchmodeRegion) : "";

        return {
          ...base,
          watchmodeId: search.id,
          poster: pickPoster(details) || DEFAULT_POSTER_PATH,
          streamingPlatforms,
          watchLink,
          watchRegion: config.watchmodeRegion,
          watchStatus:
            watchLink && streamingPlatforms.length
              ? "Watch now"
              : streamingPlatforms.length
                ? "Available to stream"
                : "No streaming platforms found",
        };
      } catch {
        return addFallbackWatchmodeFields(base, config.watchmodeRegion);
      }
    }),
  );

  return enriched;
}

function addFallbackWatchmodeFields(item, watchmodeRegion) {
  const streamingPlatforms = Array.isArray(item.streamingPlatforms)
    ? item.streamingPlatforms
    : [];
  const watchLink = streamingPlatforms.length ? item.watchLink || "" : "";
  return {
    ...item,
    poster: item.poster || DEFAULT_POSTER_PATH,
    streamingPlatforms,
    watchLink,
    watchRegion: watchmodeRegion,
    watchStatus:
      watchLink && streamingPlatforms.length
        ? "Watch now"
        : streamingPlatforms.length
          ? "Available to stream"
          : "No streaming platforms found",
  };
}

async function searchWatchmodeTitle(title, year, config) {
  const params = new URLSearchParams({
    apiKey: config.watchmodeApiKey,
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
    const candidateYear = normalizeYear(candidate.year || candidate.release_year);
    return (
      normalizeTitle(candidate.name || candidate.title) === normalizeTitle(title) &&
      (!normalizedYear || candidateYear === normalizedYear)
    );
  });

  return exactMatch || candidates[0] || null;
}

async function getWatchmodeTitleDetails(id, config) {
  const params = new URLSearchParams({
    apiKey: config.watchmodeApiKey,
    append_to_response: "sources",
  });
  return fetchWatchmodeJson(`/title/${id}/details/?${params.toString()}`);
}

async function fetchWatchmodeJson(pathname) {
  const response = await fetch(`${WATCHMODE_BASE_URL}${pathname}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Watchmode request failed.");
  }

  return data;
}

function extractPlatforms(details, watchmodeRegion) {
  const sources = Array.isArray(details.sources) ? details.sources : [];
  const allowedTypes = new Set(["sub", "free"]);
  const regionSources = sources.filter((source) => {
    const region = String(source.region || source.country || "").toUpperCase();
    return (
      (!region || region === watchmodeRegion) &&
      (!source.type || allowedTypes.has(String(source.type).toLowerCase()))
    );
  });

  const names = regionSources
    .map((source) => source.name || source.display_name)
    .filter(Boolean)
    .filter((name, index, array) => array.indexOf(name) === index);

  return names.slice(0, 5);
}

function pickWatchLink(details, watchmodeRegion) {
  const sources = Array.isArray(details.sources) ? details.sources : [];
  const source =
    sources.find((entry) => {
      const region = String(entry.region || entry.country || "").toUpperCase();
      const type = String(entry.type || "").toLowerCase();
      return region === watchmodeRegion && (type === "sub" || type === "free");
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

function parseModelList(value, primaryModel) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .filter((item) => item !== primaryModel);
}

function parseApiKeyList(value, primaryKey) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .filter((item) => item !== primaryKey);
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

function createMovieOfDayFallback(item, message) {
  const fallback = item || {};
  const title = fallback.title || "Movie Pick";
  const year = fallback.year || "";
  const tone = Array.isArray(fallback.tone) ? fallback.tone : [];
  const vibe = Array.isArray(fallback.vibe) ? fallback.vibe : [];
  const genres = Array.isArray(fallback.genres) ? fallback.genres : [];

  return {
    ...fallback,
    title,
    year,
    hook: fallback.hook || fallback.blurb || "A reliable fallback pick while AI responses are limited.",
    overview:
      fallback.overview ||
      `${title}${year ? ` (${year})` : ""} stays in rotation because it delivers quickly and still feels worth your time.`,
    whyToday:
      fallback.whyToday ||
      `${message} ${title} is a strong backup because it is broadly liked and easy to slot into most moods.`,
    highlights:
      Array.isArray(fallback.highlights) && fallback.highlights.length
        ? fallback.highlights
        : [...tone, ...genres].slice(0, 3),
    vibe,
  };
}

function createChatFallbackAnswer(picks, message) {
  const lines = picks.slice(0, 3).map((item) => {
    const platforms =
      Array.isArray(item.streamingPlatforms) && item.streamingPlatforms.length
        ? ` Stream on ${item.streamingPlatforms.slice(0, 3).join(", ")}.`
        : "";
    return `- ${item.title} (${item.year || "?"}): ${item.blurb || "Solid fallback pick."}${platforms}`;
  });

  return [message, "", "Quick fallback picks:", ...lines].join("\n");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

module.exports = {
  handleApiRequest,
  handleMovieOfDayRequest,
  getHealthPayload,
  searchHandler,
  recommendationsHandler,
  analyzeTasteHandler,
  chatHandler,
  sendJson,
};

