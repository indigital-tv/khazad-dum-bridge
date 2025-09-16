import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })
dotenv.config({ path: '.env.local' })

function parseCsv(value) {
  if (!value) return []
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function handler(req, res) {
  const allowedOrigins = parseCsv(process.env.ALLOWED_ORIGINS)
  const sharedSecret = process.env.TOKEN_SHARED_SECRET
  const allowlistedPlaybackIds = parseCsv(process.env.ALLOWED_PLAYBACK_IDS)
  const ttlEnv = parseInt(process.env.TOKEN_TTL_SECS || '600', 10)
  const clockSkewEnv = parseInt(process.env.CLOCK_SKEW_SECS || '30', 10)
  const ttlSeconds = Number.isFinite(ttlEnv) ? Math.min(Math.max(ttlEnv, 60), 86400) : 600
  const clockSkewSeconds = Number.isFinite(clockSkewEnv) ? Math.min(Math.max(clockSkewEnv, 0), 300) : 30

  const requestOrigin = req.headers.origin
  const isOriginAllowed =
    !allowedOrigins.length || (requestOrigin && allowedOrigins.includes(requestOrigin))

  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token')
  res.setHeader('Access-Control-Max-Age', '600')

  if (isOriginAllowed && requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
  } else if (!allowedOrigins.length) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (!isOriginAllowed) {
    res.status(403).json({ error: 'Origin not allowed' })
    return
  }

  if (sharedSecret) {
    const provided = req.headers['x-auth-token']
    if (!provided || provided !== sharedSecret) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
  }

  let playbackId = undefined
  if (req.method === 'POST') {
    playbackId = req.body?.playbackId || req.body?.playback_id
  } else {
    playbackId = req.query.playbackId || req.query.playback_id
  }

  if (!playbackId) {
    res.status(400).json({ error: 'Missing playbackId' })
    return
  }

  if (allowlistedPlaybackIds.length && !allowlistedPlaybackIds.includes(playbackId)) {
    res.status(403).json({ error: 'playbackId not allowed' })
    return
  }

  const signingKeyId = process.env.MUX_SIGNING_KEY_ID
  const signingKeySecret = process.env.MUX_SIGNING_KEY_SECRET
  if (!signingKeyId || !signingKeySecret) {
    res.status(500).json({ error: 'Server misconfigured: missing MUX_SIGNING_KEY_ID/SECRET' })
    return
  }
}