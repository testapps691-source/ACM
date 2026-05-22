// ─── Netlify Function: Kong Admin API Proxy ───────────────────────────────────
// Forwards requests from the browser to Kong Admin API server-side,
// keeping the Admin API URL and credentials out of the browser.
//
// Set these environment variables in Netlify → Site settings → Environment:
//   KONG_ADMIN_URL  — e.g. https://kong-admin.yourcompany.com:8001
//   KONG_API_KEY    — your Kong Admin API key (leave blank if unsecured)

import type { Handler, HandlerEvent } from '@netlify/functions'

const KONG_ADMIN_URL = process.env.KONG_ADMIN_URL ?? ''
const KONG_API_KEY = process.env.KONG_API_KEY ?? ''

export const handler: Handler = async (event: HandlerEvent) => {
  if (!KONG_ADMIN_URL) {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: 'KONG_ADMIN_URL is not configured on this deployment.' }),
    }
  }

  // Strip the Netlify function path prefix to get the Kong API path
  const kongPath = event.path
    .replace('/.netlify/functions/kong-proxy', '')
    .replace('/kong-proxy', '') || '/'

  const queryString = event.rawQuery ? `?${event.rawQuery}` : ''
  const targetUrl = `${KONG_ADMIN_URL}${kongPath}${queryString}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(KONG_API_KEY ? { apikey: KONG_API_KEY } : {}),
  }

  try {
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
      body: event.body ?? undefined,
    })

    const body = await response.text()

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: 'Failed to reach Kong Admin API',
        detail: message,
      }),
    }
  }
}
