# Mux Signed Playback Demo (Hardened)

Demo completo frontend+backend per Mux Signed Playback, pronto per Vercel e static hosting (GitHub Pages) puntando al backend pubblico.

## Requisiti
- Node 18+
- Account Mux con Signing Key
- Vercel (consigliato) per deploy dell'endpoint token

## Variabili d'ambiente (Vercel)
Imposta nelle Project Settings → Environment Variables:

- `MUX_SIGNING_KEY_ID`: ID della Signing Key
- `MUX_SIGNING_KEY_SECRET`: Secret della Signing Key
- `ALLOWED_ORIGINS` (opzionale): lista CSV di origini per CORS, es. `https://tuo-sito.com,https://tuo-app.vercel.app`
- `TOKEN_SHARED_SECRET` (opzionale): shared secret richiesto via header `X-Auth-Token`
- `ALLOWED_PLAYBACK_IDS` (opzionale): lista CSV di playbackId consentiti
- `TOKEN_TTL_SECS` (opzionale): durata token in secondi (min 60, max 86400). Default `600`.
- `CLOCK_SKEW_SECS` (opzionale): tolleranza skew in secondi per `iat/nbf` (0–300). Default `30`.

## Endpoint token
- URL: `/api/token`
- Metodi: `GET` o `POST`
- Request:
  - GET: `?playbackId=...` (o `playback_id=`)
  - POST: JSON `{ "playbackId": "..." }`
  - Header opzionale: `X-Auth-Token: <TOKEN_SHARED_SECRET>`
- Response: `{ "token": "<JWT>" }`

Token TTL: configurabile via `TOKEN_TTL_SECS` (default 10 minuti). Il player rinfresca automaticamente. Tolleranza clock-skew applicata via `CLOCK_SKEW_SECS`.

## Frontend usage
Pagina demo (`/index.html`) accetta query string:

- `playbackId`: playback ID Mux
- `envKey`: Mux Environment Key (analytics)
- `apiBase`: URL dell'endpoint token (default `/api/token`)
- `startTime`: es. `30s`, `1m10s`
- `authToken`: valore per header `X-Auth-Token` (se richiesto dal backend)
- `usePost`: `true` per usare POST

Esempi:

1) Stesso deploy su Vercel (frontend+backend):
```
https://tuo-app.vercel.app/?playbackId=abc123&envKey=env_xxx
```

2) Frontend statico (GitHub Pages) → backend su Vercel con secret e POST:
```
https://tuo-gh.github.io/demo/?playbackId=abc123&envKey=env_xxx&apiBase=https://tuo-app.vercel.app/api/token&authToken=SHARED123&usePost=true
```

## Integrazione diretta (snippet)
```html
<mux-player
  playback-id="YOUR_PLAYBACK_ID"
  env-key="YOUR_ENV_KEY"
  token-fetcher="https://your-app.vercel.app/api/token"
  autoplay
  controls
></mux-player>
```

Se usi secret+POST, imposta un tokenFetcher custom in JS:
```html
<script>
  const player = document.querySelector('mux-player');
  player.tokenFetcher = async (playbackId) => {
    const res = await fetch('https://your-app.vercel.app/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': 'SHARED123' },
      body: JSON.stringify({ playbackId })
    });
    const json = await res.json();
    return json.token;
  };
</script>
```

## Deploy
1. Push su GitHub (repo anche pubblico: niente secret nel codice)
2. Importa su Vercel → setta env vars → Deploy
3. (Opzionale) GitHub Pages per `index.html` puntando a `apiBase` pubblico

## Sicurezza
- Non committare `.env`
- Restringi CORS con `ALLOWED_ORIGINS`
- Usa `TOKEN_SHARED_SECRET` se l'endpoint è pubblico
- Mantieni TTL breve (già 10m) e rate limit se necessario

