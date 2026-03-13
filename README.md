# AI Movie Explorer

AI Movie Explorer is a lightweight Node app with four AI-powered movie workflows:

- Natural language movie search
- Movie recommendations
- Movie knowledge chat
- AI taste analyzer

## Requirements

- Node.js 18.17+ for native `fetch`
- At least one Google Gemini API key
- Watchmode API key for posters and streaming-platform metadata

## Setup

1. Get one or more Google Gemini API keys
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create your primary key
   - Optional: create additional keys from other projects for quota failover

2. Get a Watchmode API key
   - Go to [Watchmode API](https://api.watchmode.com/)
   - Create a developer account and copy your API key

3. Install dependencies

```bash
npm install
```

4. Configure environment
   - Copy `.env.example` to `.env`
   - Set:

```env
GEMINI_API_KEY=your_primary_gemini_api_key_here
GEMINI_BACKUP_API_KEYS=your_second_gemini_api_key_here,your_third_gemini_api_key_here
WATCHMODE_API_KEY=your_watchmode_api_key_here
WATCHMODE_REGION=IN
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=3600000
CACHE_TTL_MS=21600000
```

   - Optional:
     - `GEMINI_MODEL` default: `gemini-2.5-flash-lite`
     - `GEMINI_FALLBACK_MODELS` for model failover per key
     - `PORT`

## Run

```bash
npm run dev
```

Or start without watch mode:

```bash
npm start
```

Then open `http://localhost:3000`.

## Notes

- The backend rotates across configured Gemini models and backup API keys when quota/rate-limit errors occur
- AI endpoints use per-IP rate limiting
- Cached identical requests are served from memory and do not consume your Gemini quota again
- Health output includes backup key counts, rate-limit settings, and cache configuration
- When `WATCHMODE_API_KEY` is set, movie search and recommendation results are enriched with Watchmode posters and streaming providers
- `WATCHMODE_REGION` controls which country streaming providers are shown, for example `IN` or `US`
