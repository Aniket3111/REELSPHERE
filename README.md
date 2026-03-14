# ReelSphere

ReelSphere is a React frontend with AI-powered movie discovery features backed by Gemini and Watchmode.

## Features

- Natural language movie search
- Movie recommendations
- Film knowledge chat
- Taste analyzer
- Movie of the Day with streaming availability

## Requirements

- Node.js 18.17+
- At least one Google Gemini API key
- Watchmode API key for posters and streaming-platform metadata

## Environment Variables

Set these in `.env` for local development and in Vercel Project Settings for deployment:

```env
GEMINI_API_KEY=your_primary_gemini_api_key_here
GEMINI_BACKUP_API_KEYS=your_second_gemini_api_key_here,your_third_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_FALLBACK_MODELS=gemini-2.0-flash-lite,gemini-2.0-flash,gemini-1.5-flash
WATCHMODE_API_KEY=your_watchmode_api_key_here
WATCHMODE_REGION=IN
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=3600000
CACHE_TTL_MS=21600000
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the React client and local Node API together:

```bash
npm run dev
```

This starts:

- React client on `http://localhost:5173`
- Local Node API on `http://localhost:3000`

## Production Build

```bash
npm run build
```

## Deploy To Vercel

This project is now Vercel-ready.

Vercel settings:

- Framework Preset: `Vite`
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: leave default

Backend API routes are deployed from the root `api/` directory as Vercel Functions:

- `/api/search`
- `/api/recommendations`
- `/api/analyze-taste`
- `/api/chat`
- `/api/movie-of-day`
- `/api/health`

### Deploy steps

1. Push the repo to GitHub
2. Import the repo into Vercel
3. Choose `Vite` as the preset
4. Add all environment variables from `.env`
5. Deploy

## Notes

- On Vercel, the React app is built to `dist`
- API routes run as serverless functions from `api/`
- The in-memory cache and rate limit are best-effort only on Vercel because serverless instances are not persistent
- For strict global rate limiting or persistent caching, use Redis or another external store
- Movie search, recommendations, and the daily pick are enriched with Watchmode providers when `WATCHMODE_API_KEY` is configured
