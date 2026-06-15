// LRCLIB API — synced lyrics fetcher + parser

export async function fetchLyrics(trackName, artistName, albumName, durationMs) {
  try {
    const durationSec = Math.round(durationMs / 1000);
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
      album_name: albumName,
      duration: durationSec
    });

    // Try exact match first
    let res = await fetch(`https://lrclib.net/api/get?${params}`);

    if (!res.ok) {
      // Fallback to search
      const searchParams = new URLSearchParams({
        q: `${trackName} ${artistName}`
      });
      res = await fetch(`https://lrclib.net/api/search?${searchParams}`);
      if (!res.ok) return null;

      const data = await res.json();
      if (data && data.length > 0) {
        return data[0].syncedLyrics || data[0].plainLyrics;
      }
      return null;
    }

    const data = await res.json();
    return data.syncedLyrics || data.plainLyrics;
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
