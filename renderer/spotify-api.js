// Spotify Web API wrapper
// All playback control + queue endpoints

let accessToken = null;

export function setAccessToken(token) {
  // Maintained for backward compatibility, but we now read dynamically
}

async function fetchApi(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('dd_access_token');
  if (!token) throw new Error('No access token');

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store'
  };

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, options);

  if (res.status === 204) return null;
  if (res.status === 401) throw new Error('TOKEN_EXPIRED');
  
  const text = await res.text();
  
  if (!res.ok) {
    let message = `API Error: ${res.status}`;
    try {
      if (text) {
        const err = JSON.parse(text);
        message = err.error?.message || message;
      }
    } catch (e) {
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (!text || text.trim() === '') return null;
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('Failed to parse response JSON:', text);
    return text;
  }
}

// ── Player State ───────────────────────────────────────────────

export async function getCurrentlyPlaying() {
  return fetchApi('/me/player/currently-playing');
}

export async function getPlayerState() {
  return fetchApi('/me/player');
}

// ── Playback Controls ──────────────────────────────────────────

export async function play() {
  return fetchApi('/me/player/play', 'PUT');
}

export async function pause() {
  return fetchApi('/me/player/pause', 'PUT');
}

export async function nextTrack() {
  return fetchApi('/me/player/next', 'POST');
}

export async function prevTrack() {
  return fetchApi('/me/player/previous', 'POST');
}

export async function seek(positionMs) {
  return fetchApi(`/me/player/seek?position_ms=${Math.round(positionMs)}`, 'PUT');
}

export async function setVolume(percent) {
  return fetchApi(`/me/player/volume?volume_percent=${percent}`, 'PUT');
}

export async function toggleShuffle(state) {
  return fetchApi(`/me/player/shuffle?state=${state}`, 'PUT');
}

export async function setRepeat(state) {
  // state: 'track', 'context', or 'off'
  return fetchApi(`/me/player/repeat?state=${state}`, 'PUT');
}

// ── Queue ──────────────────────────────────────────────────────

export async function getQueue() {
  return fetchApi('/me/player/queue');
}

// ── Devices ────────────────────────────────────────────────────

export async function getDevices() {
  return fetchApi('/me/player/devices');
}

export async function transferPlayback(deviceId, playState = false) {
  return fetchApi('/me/player', 'PUT', {
    device_ids: [deviceId],
    play: playState
  });
}

export async function playTrack(trackUri) {
  return fetchApi('/me/player/play', 'PUT', {
    uris: [trackUri]
  });
}

// ── Library / Liked Songs ──────────────────────────────────────

export async function checkLibraryContains(trackId) {
  return fetchApi(`/me/tracks/contains?ids=${trackId}`);
}

export async function saveTrack(trackId) {
  return fetchApi(`/me/tracks?ids=${trackId}`, 'PUT');
}

export async function removeTrack(trackId) {
  return fetchApi(`/me/tracks?ids=${trackId}`, 'DELETE');
}

// ── Search ─────────────────────────────────────────────────────

export async function search(query, limit = 20) {
  return fetchApi(`/search?q=${encodeURIComponent(query)}&type=track,album,artist&limit=${limit}`);
}

// ── Playlists ──────────────────────────────────────────────────

export async function getUserPlaylists(limit = 20, offset = 0) {
  return fetchApi(`/me/playlists?limit=${limit}&offset=${offset}`);
}

export async function getPlaylistTracks(playlistId, limit = 20, offset = 0) {
  return fetchApi(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
}

export async function playContext(contextUri, offset = null) {
  const body = { context_uri: contextUri };
  if (offset) {
    if (typeof offset === 'string' && offset.startsWith('spotify:track:')) {
      body.offset = { uri: offset };
    } else if (typeof offset === 'number') {
      body.offset = { position: offset };
    }
  }
  return fetchApi('/me/player/play', 'PUT', body);
}

