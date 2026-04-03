# ReelSphere

**[Live Demo → reelsphere.aniketrajani.com](https://reelsphere.aniketrajani.com)**

AI-powered movie discovery platform. Search by mood, get smart recommendations, chat with a film brain, and decode your taste profile — all in one cinematic workspace.

## Features

- **Natural Search** — Describe a vibe, era, or atmosphere and surface matching films
- **Recommendations** — Pattern-based picks grounded in your stated taste
- **Film Brain Chat** — Conversational mode for movie knowledge, watch orders, and double features
- **Taste Decoder** — Map your viewing profile with signals, comfort zones, and blind spots
- **Movie of the Day** — Daily curated pick with streaming availability and context
- **Cinematic Theme Lounge** — Listen to iconic film scores with in-page playback
- **Trending Now** — Live trending titles from Watchmode with poster strip and details

## Tech Stack

- **Frontend**: React 19 + Vite
- **Backend**: Node.js HTTP server / Vercel Functions
- **AI**: Google Gemini (multi-key failover, multi-model fallback)
- **Data**: Watchmode API (streaming, posters, trending), iTunes API (theme scores)

## Requirements

- Node.js 18.17+
- Google Gemini API key (free tier works)
- Watchmode API key (free tier: 1000 requests/month)

## Quick Start

```bash
# Install dependencies
npm install

# Copy env template and add your keys
cp .env.example .env

# Run dev (client + server)
npm run dev
```

- React client: `http://localhost:5173`
- API server: `http://localhost:3000`

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `GEMINI_API_KEY` | — | Primary Gemini API key (required) |
| `GEMINI_BACKUP_API_KEYS` | — | Comma-separated backup keys |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Primary model |
| `GEMINI_FALLBACK_MODELS` | `gemini-2.0-flash-lite,gemini-2.0-flash` | Fallback models |
| `WATCHMODE_API_KEY` | — | Watchmode API key (required) |
| `WATCHMODE_REGION` | `IN` | Region for streaming availability |
| `RATE_LIMIT_MAX_REQUESTS` | `5` | Max requests per user per window |
| `RATE_LIMIT_WINDOW_MS` | `86400000` | Rate limit window (24h default) |
| `CACHE_TTL_MS` | `86400000` | Response cache TTL (24h default) |
| `DAILY_TIMEZONE` | `Asia/Kolkata` | Timezone for daily movie rotation |

## API Endpoints

| Endpoint | Method | Rate Limited | Description |
|----------|--------|:---:|-------------|
| `/api/search` | POST | Yes | Natural language movie search |
| `/api/recommendations` | POST | Yes | Taste-based recommendations |
| `/api/analyze-taste` | POST | Yes | Taste profile analysis |
| `/api/chat` | POST | Yes | Film knowledge chat |
| `/api/movie-of-day` | GET | Yes | Daily curated pick (cached 24h) |
| `/api/trending` | GET | No | Trending titles from Watchmode |
| `/api/theme-scores` | GET | No | Film scores from iTunes |
| `/api/health` | GET | No | API configuration status |

## Rate Limiting & Fallbacks

- Per-IP rate limiting with configurable window and max requests
- When rate-limited, the API returns **fallback movie data** instead of errors — the UI stays functional
- Gemini key failover: tries all configured keys before falling back
- Gemini model failover: tries all configured models per key
- Watchmode errors return gracefully with empty streaming data
- All AI responses are cached to reduce API calls

## Production Build

```bash
npm run build    # Build frontend to dist/
npm start        # Run production server
```

## Deploy to Vercel

1. Push to GitHub
2. Import into Vercel, select **Vite** preset
3. Add environment variables from `.env`
4. Deploy

**Vercel settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js version: 18.x+

API routes deploy as serverless functions from `api/`. Note: in-memory rate limiting and cache are not persistent across serverless invocations — use Redis for strict enforcement.

## Project Structure

```
src/
├── components/
│   ├── App/                  # Main app shell, hero, workspace, footer
│   ├── AnalysisResults/      # Taste analysis results display
│   ├── BackgroundScene/      # Background video with overlays
│   ├── CinemaIntro/          # Countdown intro animation
│   ├── FallbackNotice/       # Warning/notice banner
│   ├── FeaturesShowcase/     # Theme lounge with audio player
│   ├── LoadingDots/          # Loading animation
│   ├── MovieOfDayFeature/    # Movie of the day card
│   ├── MovieTile/            # Individual movie result card
│   ├── RecommendationResults/# Recommendation results display
│   ├── ResultPane/           # Result state wrapper
│   ├── SearchResults/        # Search results display
│   ├── SoundToggle/          # Ambient audio toggle
│   ├── StreamingMarquee/     # Quotes, bento grid, trending
│   ├── TilePoster/           # Movie poster with fallback
│   └── ToolPane/             # Workspace tool panel
├── constants/                # Shared constants
├── utils/                    # API helpers, DOM utilities
├── global.css                # Variables, reset, shared styles
└── main.jsx                  # Entry point
api/
├── _lib/core.js              # Shared API logic
├── search.js                 # Search endpoint
├── recommendations.js        # Recommendations endpoint
├── analyze-taste.js          # Taste analysis endpoint
├── chat.js                   # Chat endpoint
├── movie-of-day.js           # Daily pick endpoint
├── health.js                 # Health check
└── theme-scores.js           # Theme scores endpoint
server.js                     # Local development server
```

## License

MIT
