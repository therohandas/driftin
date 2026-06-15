import { SpotifyAuth } from './spotify-auth.js';
import * as spotifyApi from './spotify-api.js';
import { extractColorsFromUrl } from './colors.js';

// ── State Variables ───────────────────────────────────────────

const auth = new SpotifyAuth();
let pollTimer = null;
let currentTrackId = null;
let isPlaying = false;
let isLiked = false;
let isTogglingLike = false;

// ── DOM Elements ──────────────────────────────────────────────

const btnMiniClose = document.getElementById('btn-mini-close');
const albumArt = document.getElementById('mini-album-art');
const artFallback = document.getElementById('mini-art-fallback');
const trackNameEl = document.getElementById('track-name');
const artistNameEl = document.getElementById('artist-name');

const btnPrev = document.getElementById('btn-prev');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnNext = document.getElementById('btn-next');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

const btnLike = document.getElementById('btn-like');
const iconPlus = btnLike.querySelector('.icon-plus');
const iconCheckmark = btnLike.querySelector('.icon-checkmark');

// ── Window Controls ───────────────────────────────────────────

btnMiniClose.addEventListener('click', () => {
  // Exit miniplayer and return to main window
  window.windowControls.toggleMiniPlayer(false);
});

// ── Initialization ────────────────────────────────────────────

async function init() {
  const opacity = localStorage.getItem('dd_settings_mini_opacity') || '0.7';
  document.body.style.setProperty('--idle-opacity', opacity);
  
  const theme = localStorage.getItem('dd_settings_theme_preset') || 'dynamic';
  applyThemePreset(theme);

  const token = await auth.getValidToken();
  if (token) {
    spotifyApi.setAccessToken(token);
    startPolling();
  } else {
    // No token, redirect back to main app
    window.windowControls.toggleMiniPlayer(false);
  }
}

// ── Polling Playback State ─────────────────────────────────────

function startPolling() {
  stopPolling();
  pollPlaybackState();
  pollTimer = setInterval(pollPlaybackState, 2000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function pollPlaybackState() {
  try {
    const state = await spotifyApi.getPlayerState();
    
    if (!state || !state.item) {
      handleNoPlayback();
      return;
    }
    
    handlePlaybackState(state);
  } catch (err) {
    if (err.message === 'TOKEN_EXPIRED') {
      const refreshed = await auth.refresh();
      if (refreshed) {
        const token = await auth.getValidToken();
        spotifyApi.setAccessToken(token);
      } else {
        window.windowControls.toggleMiniPlayer(false);
      }
    } else {
      console.error('Error fetching player state in miniplayer:', err);
    }
  }
}

function handleNoPlayback() {
  isPlaying = false;
  currentTrackId = null;
  trackNameEl.textContent = 'Not Playing';
  artistNameEl.textContent = 'Start playback on Spotify';
  albumArt.src = '';
  albumArt.style.display = 'none';
  artFallback.classList.remove('hidden');
  
  iconPlay.classList.remove('hidden');
  iconPause.classList.add('hidden');
  
  btnLike.style.display = 'none';
  resetDynamicTheme();
}

async function handlePlaybackState(state) {
  const item = state.item;
  isPlaying = state.is_playing;
  
  // Track details
  const currentTrackName = item.name || 'Unknown Title';
  let currentArtistName = '';
  
  if (item.artists && Array.isArray(item.artists) && item.artists.length > 0) {
    currentArtistName = item.artists.map(a => a.name).join(', ');
  } else if (item.show && item.show.name) {
    currentArtistName = item.show.name;
  } else {
    currentArtistName = 'Unknown Artist';
  }

  trackNameEl.textContent = currentTrackName;
  artistNameEl.textContent = currentArtistName;
  btnLike.style.display = 'flex';
  
  // Update Play/Pause Button
  if (isPlaying) {
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
  } else {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
  }

  // If track changed, fetch album art, colors, library status
  if (currentTrackId !== item.id) {
    currentTrackId = item.id;
    
    // Load album art
    let coverUrl = '';
    const images = (item.album && item.album.images) ? item.album.images : ((item.show && item.show.images) ? item.show.images : []);
    if (images && images.length > 0) {
      coverUrl = images[0].url;
      albumArt.src = coverUrl;
      albumArt.style.display = 'block';
      artFallback.classList.add('hidden');
      
      updateDynamicTheme(coverUrl);
    } else {
      albumArt.src = '';
      albumArt.style.display = 'none';
      artFallback.classList.remove('hidden');
      resetDynamicTheme();
    }
    
    // Check if the song is liked
    checkIfTrackLiked(item.id);
  }
}

// ── Check / Toggle Liked Songs ──────────────────────────────────

async function checkIfTrackLiked(trackId) {
  if (!trackId) {
    updateLikeUI(false);
    return;
  }
  try {
    const result = await spotifyApi.checkLibraryContains(trackId);
    if (result && result.length > 0) {
      updateLikeUI(result[0]);
    }
  } catch (err) {
    console.error('Failed to check if track is liked:', err);
  }
}

function updateLikeUI(liked) {
  isLiked = liked;
  if (liked) {
    btnLike.classList.add('liked');
    btnLike.title = 'Remove from Liked Songs';
    iconPlus.classList.add('hidden');
    iconCheckmark.classList.remove('hidden');
  } else {
    btnLike.classList.remove('liked');
    btnLike.title = 'Add to Liked Songs';
    iconPlus.classList.remove('hidden');
    iconCheckmark.classList.add('hidden');
  }
}

btnLike.addEventListener('click', async () => {
  if (!currentTrackId || isTogglingLike) return;
  
  isTogglingLike = true;
  const targetState = !isLiked;
  
  // Optimistic UI update
  updateLikeUI(targetState);
  
  try {
    if (targetState) {
      await spotifyApi.saveTrack(currentTrackId);
    } else {
      await spotifyApi.removeTrack(currentTrackId);
    }
  } catch (err) {
    console.error('Failed to toggle like:', err);
    // Revert UI on failure
    updateLikeUI(!targetState);
    alert(`Failed to save/remove track: ${err.message}. If this is a permissions error, please close the miniplayer, click 'Disconnect' in the main window, and connect again.`);
  } finally {
    isTogglingLike = false;
  }
});

// ── Playback Controls ──────────────────────────────────────────

btnPlayPause.addEventListener('click', async () => {
  try {
    if (isPlaying) {
      await spotifyApi.pause();
      isPlaying = false;
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
    } else {
      try {
        await spotifyApi.play();
      } catch (playErr) {
        console.warn('Play failed, waking up device...', playErr);
        const deviceData = await spotifyApi.getDevices();
        if (deviceData && deviceData.devices && deviceData.devices.length > 0) {
          const targetDevice = deviceData.devices.find(d => d.is_active) || deviceData.devices[0];
          await spotifyApi.transferPlayback(targetDevice.id, true);
        } else {
          alert('Open Spotify on your phone/computer first!');
          return;
        }
      }
      isPlaying = true;
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Play/Pause error:', err);
  }
});

btnNext.addEventListener('click', async () => {
  try {
    await spotifyApi.nextTrack();
    setTimeout(pollPlaybackState, 300);
  } catch (err) {
    console.error(err);
  }
});

btnPrev.addEventListener('click', async () => {
  try {
    await spotifyApi.prevTrack();
    setTimeout(pollPlaybackState, 300);
  } catch (err) {
    console.error(err);
  }
});

// ── Ambient Theming ────────────────────────────────────────────

async function updateDynamicTheme(imageUrl) {
  const currentTheme = localStorage.getItem('dd_settings_theme_preset') || 'dynamic';
  if (currentTheme !== 'dynamic') {
    applyThemePreset(currentTheme);
    return;
  }
  try {
    const colors = await extractColorsFromUrl(imageUrl);
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--accent-glow', colors.accentGlow);
  } catch (err) {
    console.error('Failed to extract colors:', err);
    resetDynamicTheme();
  }
}

function resetDynamicTheme() {
  const currentTheme = localStorage.getItem('dd_settings_theme_preset') || 'dynamic';
  if (currentTheme !== 'dynamic') {
    applyThemePreset(currentTheme);
    return;
  }
  const root = document.documentElement;
  root.style.setProperty('--primary-color', 'rgb(140, 60, 90)');
  root.style.setProperty('--secondary-color', 'rgb(60, 40, 80)');
  root.style.setProperty('--accent-color', 'rgb(200, 80, 120)');
  root.style.setProperty('--accent-glow', 'rgba(200, 80, 120, 0.4)');
}

function applyThemePreset(theme) {
  const root = document.documentElement;
  if (theme === 'dynamic') {
    const currentCover = albumArt.src;
    if (currentCover && currentCover.startsWith('http')) {
      updateDynamicTheme(currentCover);
    } else {
      root.style.setProperty('--primary-color', 'rgb(140, 60, 90)');
      root.style.setProperty('--secondary-color', 'rgb(60, 40, 80)');
      root.style.setProperty('--accent-color', 'rgb(200, 80, 120)');
      root.style.setProperty('--accent-glow', 'rgba(200, 80, 120, 0.4)');
    }
    return;
  }
  
  let primary, secondary, accent, accentGlow;
  switch (theme) {
    case 'spotify':
      primary = 'rgb(29, 185, 84)';
      secondary = 'rgb(20, 80, 40)';
      accent = 'rgb(30, 215, 96)';
      accentGlow = 'rgba(30, 215, 96, 0.4)';
      break;
    case 'sakura':
      primary = 'rgb(255, 105, 180)';
      secondary = 'rgb(100, 30, 60)';
      accent = 'rgb(255, 182, 193)';
      accentGlow = 'rgba(255, 182, 193, 0.4)';
      break;
    case 'cyberpunk':
      primary = 'rgb(0, 240, 255)';
      secondary = 'rgb(80, 0, 80)';
      accent = 'rgb(255, 0, 160)';
      accentGlow = 'rgba(255, 0, 160, 0.4)';
      break;
    case 'dark':
      primary = 'rgb(40, 40, 40)';
      secondary = 'rgb(20, 20, 20)';
      accent = 'rgb(220, 220, 220)';
      accentGlow = 'rgba(220, 220, 220, 0.2)';
      break;
    default:
      return;
  }
  root.style.setProperty('--primary-color', primary);
  root.style.setProperty('--secondary-color', secondary);
  root.style.setProperty('--accent-color', accent);
  root.style.setProperty('--accent-glow', accentGlow);
}

// ── Global Media Keys Receivers ──────────────────────────────

window.spotify.onMediaPlayPause(() => {
  btnPlayPause.click();
});

window.spotify.onMediaNext(() => {
  btnNext.click();
});

window.spotify.onMediaPrev(() => {
  btnPrev.click();
});

// Start
init();

