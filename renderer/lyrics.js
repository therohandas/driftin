// LRCLIB API — synced lyrics fetcher + parser

export async function fetchLyrics(trackName, artistName, albumName, durationMs) {
  // Generate a clean cache key
  const cacheKey = `lyrics_${trackName.toLowerCase().trim()}_${artistName.toLowerCase().trim()}`;
  
  // Try to load from localStorage cache first
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.hasOwnProperty('lyrics')) {
        console.log(`[Lyrics] Loaded from cache: ${trackName} - ${artistName}`);
        return parsed.lyrics;
      }
    } catch (e) {
      console.warn('Failed to parse cached lyrics:', e);
    }
  }

  try {
    const durationSec = Math.round(durationMs / 1000);
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
      album_name: albumName,
      duration: durationSec
    });

    let lyricsText = null;

    // Try exact match first
    let res = await fetch(`https://lrclib.net/api/get?${params}`);

    if (res.ok) {
      const data = await res.json();
      lyricsText = data.syncedLyrics || data.plainLyrics;
    } else {
      // Fallback to search
      const searchParams = new URLSearchParams({
        q: `${trackName} ${artistName}`
      });
      res = await fetch(`https://lrclib.net/api/search?${searchParams}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          // Find the best match by comparing durations
          const bestMatch = data.find(item => Math.abs(item.duration - durationSec) < 5) || data[0];
          lyricsText = bestMatch.syncedLyrics || bestMatch.plainLyrics;
        }
      }
    }

    // Cache the result (even if null, to avoid spamming the API for missing lyrics)
    if (lyricsText !== undefined) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          lyrics: lyricsText,
          timestamp: Date.now()
        }));
      } catch (quotaError) {
        console.warn('LocalStorage quota exceeded. Clearing old lyrics cache...');
        // Clear all lyrics keys to free up space
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('lyrics_')) {
            localStorage.removeItem(key);
          }
        }
        // Retry setting item
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            lyrics: lyricsText,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Fallback if it still fails
        }
      }
    }

    return lyricsText;
  } catch (err) {
    console.error('Failed to fetch lyrics:', err);
    return null;
  }
}

export function parseLrc(lrcText) {
  if (!lrcText) return [];

  const lines = lrcText.split('\n');
  const parsed = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3].length === 2
        ? parseInt(match[3], 10) * 10
        : parseInt(match[3], 10);

      const timeMs = (minutes * 60 * 1000) + (seconds * 1000) + ms;
      const text = line.replace(timeRegex, '').trim();

      if (text) {
        parsed.push({ timeMs, text });
      }
    }
  }

  return parsed;
}

export function getCurrentLyricIndex(parsedLyrics, positionMs) {
  if (!parsedLyrics || parsedLyrics.length === 0) return -1;

  for (let i = parsedLyrics.length - 1; i >= 0; i--) {
    if (positionMs >= parsedLyrics[i].timeMs) {
      return i;
    }
  }
  return -1;
}
