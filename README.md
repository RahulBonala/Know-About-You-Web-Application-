# KnowYou: Cosmic Identity Engine

A cosmic identity engine that weaves numerology, astrology, and AI into a deep psychological mirror. Enter your birth details and discover yourself through Life Path numbers, Vedic astrology, Chinese zodiac analysis, AI personality profiling, career intelligence, and more.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Vanilla HTML, CSS, JavaScript (single-page app) |
| Backend  | Vercel Serverless Functions (Node.js)           |
| AI       | Google Gemini API (2.0 Flash)                   |
| Hosting  | Vercel                                          |

## Features

- Life Path & Expression number calculation (numerology)
- Western zodiac, Vedic astrology (Tithi, Yog, Nakshatra, Moon Sign)
- Chinese zodiac (animal + element)
- AI-generated personality archetypes, strengths, growth edges
- Interactive birth chart canvas visualization
- Compatibility analysis between two people
- Daily oracle readings tied to moon phase
- Local-only session save/restore (localStorage, 7-day TTL)
- Zero database, zero tracking — data vanishes on refresh

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

```bash
# Clone the repository
git clone https://github.com/RahulBonala/Know-About-You-Web-Application-.git
cd Know-About-You-Web-Application-

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# Edit .env and add your real GEMINI_API_KEY
```

### Environment Variables

| Variable          | Required | Description                              |
| ----------------- | -------- | ---------------------------------------- |
| `GEMINI_API_KEY`  | Yes      | Google Gemini API key                    |
| `PORT`            | No       | Local dev server port (default: 3000)    |
| `ALLOWED_ORIGINS` | No       | Comma-separated allowed origins for CORS |

### Development

```bash
npm run dev
```

This starts the Vercel development server, which serves `index.html` and routes `/api/*` to serverless functions.

### Linting & Formatting

```bash
npm run lint        # Run ESLint on API files
npm run lint:fix    # Auto-fix lint issues
npm run format      # Format all files with Prettier
npm run validate    # Run lint + format check together
```

## Project Structure

```
├── index.html          # Single-page frontend (HTML + CSS + JS)
├── api/
│   ├── generate.js     # Serverless: proxies prompts to Gemini API
│   ├── models.js       # Serverless: lists available Gemini models
│   └── health.js       # Serverless: health check endpoint
├── public/
│   ├── robots.txt      # SEO: crawler directives
│   └── sitemap.xml     # SEO: sitemap
├── vercel.json         # Vercel config: security headers
├── .env.example        # Environment variable template
├── eslint.config.mjs   # ESLint flat config
├── .prettierrc         # Prettier config
├── .gitignore          # Git ignore rules
└── package.json        # Project metadata & scripts
```

## API Endpoints

| Method | Endpoint        | Description                               |
| ------ | --------------- | ----------------------------------------- |
| POST   | `/api/generate` | Send a prompt to Gemini, get AI analysis  |
| GET    | `/api/models`   | List available Gemini models              |
| GET    | `/api/health`   | Health check (returns `{ status: "ok" }`) |

## Deployment

This project is designed for [Vercel](https://vercel.com/):

1. Push to GitHub
2. Import the repo in Vercel dashboard
3. Add `GEMINI_API_KEY` as an environment variable in Vercel settings
4. Deploy — Vercel auto-detects the `api/` directory and `index.html`

## Security

- API key is server-side only (never exposed to the browser)
- Rate limiting on the generate endpoint (15 requests/min per IP)
- Input validation (prompt length capped at 8,000 chars)
- Security headers configured via `vercel.json` (HSTS, X-Frame-Options, CSP headers, etc.)
- No user data is stored server-side

## License

MIT
