# Quick Setup Guide

## Get Started in 4 Steps

### 1. Get Your Free Mapbox Token

Visit [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/) and:
- Sign up for a free account (no credit card required)
- Create a new access token
- Copy the token (starts with `pk.`)

### 2. Get the Dataset

The job dataset (`jobs_minimal.csv`) is available at:
**https://storage.stapply.ai/jobs_minimal.csv**

Download it and place it in the `public/` folder:
```bash
cd public
curl -O https://storage.stapply.ai/jobs_minimal.csv
```

Or manually download from [storage.stapply.ai](https://storage.stapply.ai/jobs_minimal.csv) and save it as `public/jobs_minimal.csv`.

**About the Dataset:**
- Contains AI job postings from top companies (OpenAI, Anthropic, Mistral AI, DeepMind, Cohere, Hugging Face, and more)
- Pre-processed with coordinates (lat/lon) already included
- Includes job title, company, location, and application URL
- Updated regularly with new job postings

### 3. Configure the Tokens

Create a `.env` file:
```bash
cp .env.example .env
```

Open `.env` and add your tokens:
```
VITE_MAPBOX_TOKEN=pk.your_token_here
MISTRAL_API_KEY=your_mistral_key_here
```

**Important Notes:**
- `VITE_MAPBOX_TOKEN` - Safe to expose (used in frontend)
- `MISTRAL_API_KEY` - **SECRET** - Do NOT use `VITE_` prefix (server-side only)
- The Mistral API key is optional - only needed for the AI chat assistant feature
- Get a Mistral API key from [Mistral AI](https://console.mistral.ai/)

### 4. Run the App

**Option 1: Run Everything Together (Recommended)**

This runs both the frontend and API server:
```bash
npm install
npm run dev:all
```

This will start:
- Frontend on [http://localhost:5173](http://localhost:5173)
- API server on [http://localhost:3001](http://localhost:3001)

**Option 2: Run Separately (in two terminals)**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (API Server):
```bash
npm run dev:api
```

**Option 3: Use Vercel CLI (Alternative)**

If you prefer using Vercel's dev server:
```bash
npm i -g vercel
vercel dev
```

**Option 4: Frontend Only (API won't work)**

If you just want to test the map without the AI chat:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## What to Expect

On first run:
- The app loads jobs from `jobs_minimal.csv` (pre-geocoded, so no geocoding needed!)
- Jobs appear instantly on the interactive dark-mode map
- You'll see clustered job markers that you can explore
- Use the AI assistant (if Mistral API key is configured) to filter jobs by asking questions

## Usage

- **Zoom in/out**: Scroll or use the + / - controls
- **Pan**: Click and drag
- **View cluster**: Click a numbered marker to zoom in
- **View job details**: Click a pin marker to see the job popup
- **Navigate multiple jobs**: Use arrow buttons (← →) or keyboard arrows when multiple jobs are at the same location
- **Apply for job**: Click "View Job →" in the popup
- **AI Assistant**: Click the Stapply logo button (bottom right) to chat with the AI assistant and filter jobs

### AI Assistant Features

The AI assistant can help you:
- Filter jobs by title/keywords: "Show me all software engineer jobs"
- Filter by location: "Show me jobs in San Francisco"
- Filter by company: "Show me all OpenAI jobs"
- Complex queries: "Show me tech internships in New York" or "software engineer OR data scientist"
- Navigate the map: "Zoom to London" or "Show me jobs in Europe"

## Troubleshooting

**Map is blank?**
- Check that your `.env` file exists and has a valid Mapbox token
- Refresh the page
- Check browser console for errors

**No jobs showing?**
- Make sure `public/jobs_minimal.csv` exists (download from [storage.stapply.ai](https://storage.stapply.ai/jobs_minimal.csv))
- Check the browser console for errors
- Verify the CSV file is not corrupted

**AI Assistant not working?**
- Make sure `MISTRAL_API_KEY` is set in your `.env` file (without `VITE_` prefix!)
- Make sure you're using `vercel dev` (not `npm run dev`) to run API routes locally
- The assistant is optional - the map works without it
- Check browser console for API errors

**Dataset not loading?**
- Verify `public/jobs_minimal.csv` exists and is readable
- Check that the file has the correct format (should have columns: url, title, location, company, ats_id, id, lat, lon)
- Try re-downloading from [storage.stapply.ai](https://storage.stapply.ai/jobs_minimal.csv)

Enjoy exploring AI job opportunities with Stapply Job Map!
