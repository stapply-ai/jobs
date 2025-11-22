export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

if (!MAPBOX_TOKEN) {
  console.warn('No Mapbox token found. Please set VITE_MAPBOX_TOKEN in your .env file');
}

// Note: MISTRAL_API_KEY is now stored server-side only (in Vercel environment variables)
// The frontend calls /api/chat which proxies requests to Mistral securely
