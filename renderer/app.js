import { SpotifyAuth } from './spotify-auth.js';
import * as spotifyApi from './spotify-api.js';
import { extractColorsFromUrl } from './colors.js';
import { fetchLyrics, parseLrc, getCurrentLyricIndex } from './lyrics.js';

// ── State Variables ───────────────────────────────────────────

const auth = new SpotifyAuth();
let pollTimer = null;
let currentTrackId = null;
let currentTrackName = '';
let currentArtistName = '';
let isPlaying = false;
let durationMs = 0;
let progressMs = 0;
let lastUpdateTimestamp = 0;
let parsedLyrics = [];
let currentLyricIndex = -1;
let activeTab = 'lyrics'; // 'lyrics' | 'queue' | 'settings' | 'search' | 'library'
let isDraggingTimeline = false;
let isMuted = false;
let currentVolume = 70;
let animationFrameId = null;

// New State Variables for features
let isLikedMain = false;
let isTogglingLikeMain = false;
let searchTimeout = null;
let currentPlaylist = null;
let hasEndedTriggered = false;
let activeRetryId = 0;
let prefetchTimeout = null;


// ── DOM Elements ──────────────────────────────────────────────

// Screens
const loginScreen = document.getElementById('login-screen');
const playerScreen = document.getElementById('player-screen');
const dashboardContainer = document.getElementById('dashboard-container');

// Login Page
const btnLogin = document.getElementById('btn-login');
const btnOpenSettingsLogin = document.getElementById('btn-open-settings-login');

// Window Controls
const titlebarMin = document.getElementById('titlebar-min');
const titlebarMax = document.getElementById('titlebar-max');
const titlebarClose = document.getElementById('titlebar-close');

// Sidebar/Visualizer Panel
const vinylDisc = document.getElementById('vinyl-disc');
const vinylTonearm = document.getElementById('vinyl-tonearm');
const albumArt = document.getElementById('album-art');
const vinylFallback = document.getElementById('vinyl-fallback');
const activeDeviceName = document.getElementById('active-device-name');
const deviceBadge = document.getElementById('device-badge');
const devicesDropdown = document.getElementById('devices-dropdown');
const devicesList = document.getElementById('devices-list');
const btnLogout = document.getElementById('btn-logout');

// Track Details
const trackNameEl = document.getElementById('track-name');
const artistNameEl = document.getElementById('artist-name');
const albumNameEl = document.getElementById('album-name');
// Track Details Actions
const btnSettingsToggle = document.getElementById('btn-settings-toggle');
const btnMiniplayerToggle = document.getElementById('btn-miniplayer-toggle');
const btnRefreshMain = document.getElementById('btn-refresh-main');
const btnQueueToggle = document.getElementById('btn-queue-toggle');
const btnLikeMain = document.getElementById('btn-like-main');
const btnSearchToggle = document.getElementById('btn-search-toggle');
const btnLibraryToggle = document.getElementById('btn-library-toggle');

// Mini Player Elements
const miniplayerView = document.getElementById('miniplayer-view');
const miniAlbumArt = document.getElementById('mini-album-art');
const miniTrackName = document.getElementById('mini-track-name');
const miniArtistName = document.getElementById('mini-artist-name');
const btnMiniPrev = document.getElementById('btn-mini-prev');
const btnMiniPlayPause = document.getElementById('btn-mini-play-pause');
const btnMiniNext = document.getElementById('btn-mini-next');
const btnMiniExpand = document.getElementById('btn-mini-expand');
const iconMiniPlay = document.getElementById('icon-mini-play');
const iconMiniPause = document.getElementById('icon-mini-pause');

// Tabs
const tabLyrics = document.getElementById('tab-lyrics');
const tabQueue = document.getElementById('tab-queue');
const tabSettings = document.getElementById('tab-settings');
const tabSearch = document.getElementById('tab-search');
const tabLibrary = document.getElementById('tab-library');

// Lyrics Elements
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsScrollContainer = document.getElementById('lyrics-scroll-container');
const lyricsLoading = document.getElementById('lyrics-loading');
const lyricsEmpty = document.getElementById('lyrics-empty');
const lyricsNotFound = document.getElementById('lyrics-not-found');

// Search Tab Elements
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const searchResults = document.getElementById('search-results');
const searchInitial = document.getElementById('search-initial');
const searchLoading = document.getElementById('search-loading');
const searchEmpty = document.getElementById('search-empty');

// Library Tab Elements
const libraryTitle = document.getElementById('library-title');
const btnLibraryBack = document.getElementById('btn-library-back');
const libraryLoading = document.getElementById('library-loading');
const libraryEmpty = document.getElementById('library-empty');
const playlistsGrid = document.getElementById('playlists-grid');
const playlistDetail = document.getElementById('playlist-detail');
const playlistDetailArt = document.getElementById('playlist-detail-art');
const playlistDetailName = document.getElementById('playlist-detail-name');
const playlistDetailCount = document.getElementById('playlist-detail-count');
const btnPlayPlaylist = document.getElementById('btn-play-playlist');
const playlistTracksList = document.getElementById('playlist-tracks-list');

// Queue Elements
const queueList = document.getElementById('queue-list');
const queueEmpty = document.getElementById('queue-empty');
const btnRefreshQueue = document.getElementById('btn-refresh-queue');

// Settings Elements
const inputClientId = document.getElementById('input-client-id');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnResetSettings = document.getElementById('btn-reset-settings');
const settingNotifications = document.getElementById('setting-notifications');
const settingAlwaysOnTop = document.getElementById('setting-always-on-top');
const settingStartup = document.getElementById('setting-startup');
const settingMiniOpacity = document.getElementById('setting-mini-opacity');
const opacityVal = document.getElementById('opacity-val');
const settingThemePreset = document.getElementById('setting-theme-preset');
const settingVinylSpin = document.getElementById('setting-vinyl-spin');
const settingLyricsSize = document.getElementById('setting-lyrics-size');
const settingLyricsOffset = document.getElementById('setting-lyrics-offset');
const offsetVal = document.getElementById('offset-val');



// Fullscreen Lyrics Elements
const btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
const btnFsExit = document.getElementById('btn-fs-exit');
const fullscreenLyricsOverlay = document.getElementById('fullscreen-lyrics-overlay');
const fsAlbumArt = document.getElementById('fs-album-art');
const fsTrackTitle = document.getElementById('fs-track-title');
const fsArtistName = document.getElementById('fs-artist-name');
const fsLyricsScrollContainer = document.getElementById('fs-lyrics-scroll-container');
const fsLyricsContainer = document.getElementById('fs-lyrics-container');
const btnFsPrev = document.getElementById('btn-fs-prev');
const btnFsPlayPause = document.getElementById('btn-fs-play-pause');
const btnFsNext = document.getElementById('btn-fs-next');
const iconFsPlay = document.getElementById('icon-fs-play');
const iconFsPause = document.getElementById('icon-fs-pause');

// Playback Controls
const timelineSlider = document.getElementById('timeline-slider');
const timelineProgress = document.getElementById('timeline-progress');
const timeCurrentEl = document.getElementById('time-current');
const timeTotalEl = document.getElementById('time-total');

const btnShuffle = document.getElementById('btn-shuffle');
const btnPrev = document.getElementById('btn-prev');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnNext = document.getElementById('btn-next');
const btnRepeat = document.getElementById('btn-repeat');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');

const btnVolumeMute = document.getElementById('btn-volume-mute');
const volumeSlider = document.getElementById('volume-slider');
const volumeProgress = document.getElementById('volume-progress');

// ── Titlebar Window IPC Binding ─────────────────────────────────

titlebarMin.addEventListener('click', () => window.windowControls.minimize());
titlebarMax.addEventListener('click', () => window.windowControls.maximize());
titlebarClose.addEventListener('click', () => window.windowControls.close());

// ── Titlebar Digital Clock ──────────────────────────────────────

const titlebarClock = document.getElementById('titlebar-clock');

function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  titlebarClock.textContent = `${hours}:${mins} ${ampm}`;
}

updateClock();
setInterval(updateClock, 1000);

// ── Initialization ────────────────────────────────────────────

async function init() {
  // Load saved client ID
  inputClientId.value = auth.getClientId();
  
  // Load customization settings
  settingNotifications.checked = localStorage.getItem('dd_settings_notifications') !== 'false';
  
  const alwaysOnTop = localStorage.getItem('dd_settings_always_on_top') === 'true';
  settingAlwaysOnTop.checked = alwaysOnTop;
  window.windowControls.setAlwaysOnTop(alwaysOnTop);
  
  const startup = localStorage.getItem('dd_settings_startup') === 'true';
  settingStartup.checked = startup;
  window.windowControls.setLoginItem(startup);
  
  const opacity = localStorage.getItem('dd_settings_mini_opacity') || '0.7';
  settingMiniOpacity.value = opacity;
  opacityVal.textContent = Math.round(parseFloat(opacity) * 100) + '%';
  
  const theme = localStorage.getItem('dd_settings_theme_preset') || 'dynamic';
  settingThemePreset.value = theme;
  applyThemePreset(theme);

  const spin = localStorage.getItem('dd_settings_vinyl_spin') !== 'false';
  settingVinylSpin.checked = spin;
  updateVinylSpinUI(spin);

  const lyricsSize = localStorage.getItem('dd_settings_lyrics_size') || 'medium';
  settingLyricsSize.value = lyricsSize;
  updateLyricsSizeUI(lyricsSize);

  const lyricsOffset = localStorage.getItem('dd_settings_lyrics_offset') || '0.0';
  settingLyricsOffset.value = lyricsOffset;
  offsetVal.textContent = parseFloat(lyricsOffset).toFixed(1) + 's';
  

  
  const token = await auth.getValidToken();
  if (token) {
    spotifyApi.setAccessToken(token);
    showPlayer();
    return;
  }
  showLogin();
}

function applyThemePreset(theme) {
  const root = document.documentElement;
  if (theme === 'dynamic') {
    // Dynamic match: if current track has album art, it will update dynamic theme
    // Else, reset to dynamic base
    const currentCover = albumArt.src;
    if (currentCover && currentCover.startsWith('http')) {
      updateDynamicTheme(currentCover);
    } else {
      // Apply base dynamic defaults
      root.style.setProperty('--primary-color', 'rgb(140, 60, 90)');
      root.style.setProperty('--secondary-color', 'rgb(60, 40, 80)');
      root.style.setProperty('--accent-color', 'rgb(200, 80, 120)');
      root.style.setProperty('--accent-glow', 'rgba(200, 80, 120, 0.4)');
      root.style.setProperty('--bg-primary', 'rgba(15, 8, 12, 0.95)');
      root.style.setProperty('--bg-secondary', 'rgba(8, 5, 10, 0.95)');
    }
    return;
  }
  
  let primary, secondary, accent, accentGlow, bgPrimary, bgSecondary;
  
  switch (theme) {
    case 'spotify':
      primary = 'rgb(29, 185, 84)';
      secondary = 'rgb(20, 80, 40)';
      accent = 'rgb(30, 215, 96)';
      accentGlow = 'rgba(30, 215, 96, 0.4)';
      bgPrimary = 'rgba(10, 20, 12, 0.95)';
      bgSecondary = 'rgba(5, 10, 6, 0.95)';
      break;
    case 'sakura':
      primary = 'rgb(255, 105, 180)';
      secondary = 'rgb(100, 30, 60)';
      accent = 'rgb(255, 182, 193)';
      accentGlow = 'rgba(255, 182, 193, 0.4)';
      bgPrimary = 'rgba(25, 8, 15, 0.95)';
      bgSecondary = 'rgba(15, 5, 10, 0.95)';
      break;
    case 'cyberpunk':
      primary = 'rgb(0, 240, 255)';
      secondary = 'rgb(80, 0, 80)';
      accent = 'rgb(255, 0, 160)';
      accentGlow = 'rgba(255, 0, 160, 0.4)';
      bgPrimary = 'rgba(15, 2, 18, 0.95)';
      bgSecondary = 'rgba(8, 1, 10, 0.95)';
      break;
    case 'dark':
      primary = 'rgb(40, 40, 40)';
      secondary = 'rgb(20, 20, 20)';
      accent = 'rgb(220, 220, 220)';
      accentGlow = 'rgba(220, 220, 220, 0.2)';
      bgPrimary = 'rgba(10, 10, 10, 0.96)';
      bgSecondary = 'rgba(5, 5, 5, 0.98)';
      break;
    default:
      return;
  }
  
  root.style.setProperty('--primary-color', primary);
  root.style.setProperty('--secondary-color', secondary);
  root.style.setProperty('--accent-color', accent);
  root.style.setProperty('--accent-glow', accentGlow);
  root.style.setProperty('--bg-primary', bgPrimary);
  root.style.setProperty('--bg-secondary', bgSecondary);
}

function updateVinylSpinUI(spin) {
  if (spin) {
    vinylDisc.classList.remove('spin-disabled');
  } else {
    vinylDisc.classList.add('spin-disabled');
  }
}

function updateLyricsSizeUI(size) {
  lyricsContainer.classList.remove('lyrics-size-small', 'lyrics-size-medium', 'lyrics-size-large', 'lyrics-size-xl');
  lyricsContainer.classList.add(`lyrics-size-${size}`);
}

// ── Screen Transitions ────────────────────────────────────────

function showLogin() {
  loginScreen.classList.remove('hidden');
  playerScreen.classList.add('hidden');
  stopPolling();
  cancelAnimationFrame(animationFrameId);
}

function showPlayer() {
  loginScreen.classList.add('hidden');
  playerScreen.classList.remove('hidden');
  startPolling();
  startInterpolation();
  refreshQueue();
}

// ── Login Page Events ─────────────────────────────────────────

btnLogin.addEventListener('click', async () => {
  btnLogin.disabled = true;
  btnLogin.innerHTML = 'Connecting...';
  
  const success = await auth.login();
  
  btnLogin.disabled = false;
  btnLogin.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="spotify-logo">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
    Connect Spotify
  `;

  if (success) {
    const token = await auth.getValidToken();
    spotifyApi.setAccessToken(token);
    showPlayer();
  }
});

btnOpenSettingsLogin.addEventListener('click', () => {
  loginScreen.classList.add('hidden');
  playerScreen.classList.remove('hidden');
  showTab('settings');
  // Hide visualizer and playbar elements so user only see settings
  document.querySelector('.visualizer-panel').style.opacity = '0';
  document.querySelector('.playback-controls').style.opacity = '0';
  document.getElementById('btn-settings-toggle').style.display = 'none';
  document.getElementById('btn-queue-toggle').style.display = 'none';
  document.getElementById('btn-search-toggle').style.display = 'none';
  document.getElementById('btn-library-toggle').style.display = 'none';
});

btnLogout.addEventListener('click', () => {
  auth.clearTokens();
  showLogin();
});

// ── Tab Management ────────────────────────────────────────────

function showTab(tabId) {
  activeTab = tabId;
  
  // Update buttons state
  btnSettingsToggle.classList.toggle('active', tabId === 'settings');
  btnQueueToggle.classList.toggle('active', tabId === 'queue');
  btnSearchToggle.classList.toggle('active', tabId === 'search');
  btnLibraryToggle.classList.toggle('active', tabId === 'library');
  
  // Show active tab pane
  tabLyrics.classList.toggle('active', tabId === 'lyrics');
  tabQueue.classList.toggle('active', tabId === 'queue');
  tabSettings.classList.toggle('active', tabId === 'settings');
  tabSearch.classList.toggle('active', tabId === 'search');
  tabLibrary.classList.toggle('active', tabId === 'library');
  
  if (tabId === 'queue') {
    refreshQueue();
  } else if (tabId === 'library') {
    loadLibraryPlaylists();
  }
}

btnSettingsToggle.addEventListener('click', () => {
  if (activeTab === 'settings') {
    showTab('lyrics');
  } else {
    showTab('settings');
  }
});

btnQueueToggle.addEventListener('click', () => {
  if (activeTab === 'queue') {
    showTab('lyrics');
  } else {
    showTab('queue');
  }
});

btnSearchToggle.addEventListener('click', () => {
  if (activeTab === 'search') {
    showTab('lyrics');
  } else {
    showTab('search');
    searchInput.focus();
  }
});

btnLibraryToggle.addEventListener('click', () => {
  if (activeTab === 'library') {
    showTab('lyrics');
  } else {
    showTab('library');
  }
});

// ── Settings Panel Actions ────────────────────────────────────

btnSaveSettings.addEventListener('click', () => {
  const newClientId = inputClientId.value.trim();
  const oldClientId = auth.getClientId();
  const clientIdChanged = newClientId !== oldClientId;
  
  // Save client ID
  auth.setClientId(newClientId);
  
  // Save all customization settings
  localStorage.setItem('dd_settings_notifications', settingNotifications.checked);
  localStorage.setItem('dd_settings_always_on_top', settingAlwaysOnTop.checked);
  localStorage.setItem('dd_settings_startup', settingStartup.checked);
  localStorage.setItem('dd_settings_mini_opacity', settingMiniOpacity.value);
  localStorage.setItem('dd_settings_theme_preset', settingThemePreset.value);
  localStorage.setItem('dd_settings_lyrics_size', settingLyricsSize.value);
  localStorage.setItem('dd_settings_vinyl_spin', settingVinylSpin.checked);
  localStorage.setItem('dd_settings_lyrics_offset', settingLyricsOffset.value);
  
  // Apply settings to main window
  window.windowControls.setAlwaysOnTop(settingAlwaysOnTop.checked);
  window.windowControls.setLoginItem(settingStartup.checked);
  applyThemePreset(settingThemePreset.value);
  updateVinylSpinUI(settingVinylSpin.checked);
  updateLyricsSizeUI(settingLyricsSize.value);
  
  // Re-enable dashboard layouts if we were coming from Login Settings
  document.querySelector('.visualizer-panel').style.opacity = '1';
  document.querySelector('.playback-controls').style.opacity = '1';
  document.getElementById('btn-settings-toggle').style.display = 'flex';
  document.getElementById('btn-queue-toggle').style.display = 'flex';
  document.getElementById('btn-search-toggle').style.display = 'flex';
  document.getElementById('btn-library-toggle').style.display = 'flex';
  
  if (clientIdChanged) {
    alert('Configuration saved. Redirecting to login...');
    showLogin();
  } else {
    showTab('lyrics');
  }
});

btnResetSettings.addEventListener('click', () => {
  // Clear customizations to defaults
  auth.setClientId('');
  inputClientId.value = auth.getClientId();
  
  settingNotifications.checked = true;
  settingAlwaysOnTop.checked = false;
  settingStartup.checked = false;
  settingMiniOpacity.value = '0.7';
  opacityVal.textContent = '70%';
  settingThemePreset.value = 'dynamic';
  settingVinylSpin.checked = true;
  settingLyricsSize.value = 'medium';
  settingLyricsOffset.value = '0.0';
  offsetVal.textContent = '0.0s';
  
  // Reset and save all defaults in localStorage
  localStorage.setItem('dd_settings_notifications', 'true');
  localStorage.setItem('dd_settings_always_on_top', 'false');
  localStorage.setItem('dd_settings_startup', 'false');
  localStorage.setItem('dd_settings_mini_opacity', '0.7');
  localStorage.setItem('dd_settings_theme_preset', 'dynamic');
  localStorage.setItem('dd_settings_lyrics_size', 'medium');
  localStorage.setItem('dd_settings_vinyl_spin', 'true');
  localStorage.setItem('dd_settings_lyrics_offset', '0.0');
  
  // Apply defaults
  window.windowControls.setAlwaysOnTop(false);
  window.windowControls.setLoginItem(false);
  applyThemePreset('dynamic');
  updateVinylSpinUI(true);
  updateLyricsSizeUI('medium');
  
  alert('Configuration reset to defaults.');
});

// Live Updates, Previews & Auto-save
settingNotifications.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_notifications', e.target.checked);
});

settingAlwaysOnTop.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_always_on_top', e.target.checked);
  window.windowControls.setAlwaysOnTop(e.target.checked);
});

settingStartup.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_startup', e.target.checked);
  window.windowControls.setLoginItem(e.target.checked);
});

settingMiniOpacity.addEventListener('input', (e) => {
  opacityVal.textContent = Math.round(parseFloat(e.target.value) * 100) + '%';
});

settingMiniOpacity.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_mini_opacity', e.target.value);
});

settingThemePreset.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_theme_preset', e.target.value);
  applyThemePreset(e.target.value);
});

settingLyricsSize.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_lyrics_size', e.target.value);
  updateLyricsSizeUI(e.target.value);
});

settingVinylSpin.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_vinyl_spin', e.target.checked);
  updateVinylSpinUI(e.target.checked);
});

settingLyricsOffset.addEventListener('input', (e) => {
  offsetVal.textContent = parseFloat(e.target.value).toFixed(1) + 's';
});

settingLyricsOffset.addEventListener('change', (e) => {
  localStorage.setItem('dd_settings_lyrics_offset', e.target.value);
});



// ── Polling & Intercepting Web API State ─────────────────────

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
        showLogin();
      }
    } else {
      console.error('Error fetching player state:', err);
    }
  }
}

async function pollPlaybackStateWithRetry(expectedChange = true, maxRetries = 5, delayMs = 800) {
  const oldTrackId = currentTrackId;
  activeRetryId++;
  const currentRetryId = activeRetryId;
  
  for (let i = 0; i < maxRetries; i++) {
    // Wait for the delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // If a newer retry loop has started, abort this one!
    if (currentRetryId !== activeRetryId) return;
    
    try {
      const state = await spotifyApi.getPlayerState();
      if (state && state.item) {
        // If we expected a track change and it changed, or if we just want a valid state
        if (!expectedChange || state.item.id !== oldTrackId) {
          handlePlaybackState(state);
          return; // Success!
        }
      }
    } catch (err) {
      console.warn(`Retry poll failed (attempt ${i + 1}/${maxRetries}):`, err);
    }
  }
  
  // Final fallback: do a regular poll
  if (currentRetryId === activeRetryId) {
    pollPlaybackState();
  }
}

function handleNoPlayback() {
  isPlaying = false;
  trackNameEl.textContent = 'Not Playing';
  artistNameEl.textContent = 'Open Spotify and start playback';
  albumNameEl.textContent = '';
  albumArt.src = '';
  albumArt.style.opacity = '0';
  vinylFallback.classList.remove('hidden');
  
  vinylDisc.classList.remove('playing');
  vinylTonearm.classList.remove('playing');
  
  activeDeviceName.textContent = 'No active device';
  deviceBadge.classList.remove('active');
  
  durationMs = 0;
  progressMs = 0;
  updateTimelineUI();
  
  // Hide main like button when no playback
  btnLikeMain.style.display = 'none';
  isLikedMain = false;
  btnLikeMain.classList.remove('liked');

  // Clear and reset lyrics display
  parsedLyrics = [];
  currentLyricIndex = -1;
  lyricsContainer.innerHTML = '';
  lyricsLoading.classList.add('hidden');
  lyricsNotFound.classList.add('hidden');
  lyricsEmpty.classList.remove('hidden');
  lyricsScrollContainer.scrollTop = 0;
}

function handlePlaybackState(state) {
  const item = state.item;
  
  // Show main like button when playing
  btnLikeMain.style.display = 'flex';
  const wasPlaying = isPlaying;
  
  isPlaying = state.is_playing;
  durationMs = item.duration_ms;
  progressMs = state.progress_ms;
  lastUpdateTimestamp = Date.now();
  
  // Device active state
  if (state.device) {
    activeDeviceName.textContent = state.device.name;
    deviceBadge.classList.add('active');
  } else {
    activeDeviceName.textContent = 'No Device';
    deviceBadge.classList.remove('active');
  }

  // Visual vinyl arm and rotation toggle
  if (isPlaying) {
    vinylDisc.classList.add('playing');
    vinylTonearm.classList.add('playing');
    miniplayerView.classList.add('playing');
    iconMiniPlay.classList.add('hidden');
    iconMiniPause.classList.remove('hidden');
  } else {
    vinylDisc.classList.remove('playing');
    vinylTonearm.classList.remove('playing');
    miniplayerView.classList.remove('playing');
    iconMiniPlay.classList.remove('hidden');
    iconMiniPause.classList.add('hidden');
  }

  // Update shuffle / repeat icons
  btnShuffle.classList.toggle('active', state.shuffle_state);
  
  if (state.repeat_state === 'track') {
    btnRepeat.classList.add('active');
    btnRepeat.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        <text x="9" y="15" font-size="7" font-weight="900" fill="currentColor" stroke="none">1</text>
      </svg>
    `;
  } else if (state.repeat_state === 'context') {
    btnRepeat.classList.add('active');
    btnRepeat.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    `;
  } else {
    btnRepeat.classList.remove('active');
    btnRepeat.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    `;
  }

  // Update volume bar
  if (state.device && !isDraggingVolume) {
    currentVolume = state.device.volume_percent;
    volumeSlider.value = currentVolume;
    volumeProgress.style.width = `${currentVolume}%`;
  }

  // Update track details
  if (currentTrackId !== item.id) {
    currentTrackId = item.id;
    currentTrackName = item.name || 'Unknown Title';
    hasEndedTriggered = false; // Reset the natural song end poll trigger flag
    
    // Safely get artist names
    if (item.artists && Array.isArray(item.artists) && item.artists.length > 0) {
      currentArtistName = item.artists.map(a => a.name).join(', ');
    } else if (item.show && item.show.name) {
      currentArtistName = item.show.name;
    } else {
      currentArtistName = 'Unknown Artist';
    }
    
    // Safely get album name
    let albumName = '';
    if (item.album && item.album.name) {
      albumName = item.album.name;
    } else if (item.show && item.show.name) {
      albumName = item.show.name;
    } else {
      albumName = 'Unknown Album';
    }
    
    trackNameEl.textContent = currentTrackName;
    artistNameEl.textContent = currentArtistName;
    albumNameEl.textContent = albumName;

    // Update mini-player details
    miniTrackName.textContent = currentTrackName;
    miniArtistName.textContent = currentArtistName;
    
    // Update fullscreen details
    fsTrackTitle.textContent = currentTrackName;
    fsArtistName.textContent = currentArtistName;
    
    // Load album art
    let coverUrl = '';
    const images = (item.album && item.album.images) ? item.album.images : ((item.show && item.show.images) ? item.show.images : []);
    if (images && images.length > 0) {
      coverUrl = images[0].url;
      albumArt.src = coverUrl;
      albumArt.style.opacity = '1';
      miniAlbumArt.src = coverUrl;
      fsAlbumArt.src = coverUrl;
      vinylFallback.classList.add('hidden');
      
      // Extract dynamic colors
      updateDynamicTheme(coverUrl);
    } else {
      albumArt.src = '';
      albumArt.style.opacity = '0';
      miniAlbumArt.src = '';
      fsAlbumArt.src = '';
      vinylFallback.classList.remove('hidden');
      resetDynamicTheme();
    }

    // Load lyrics
    const firstArtistName = (item.artists && item.artists.length > 0) ? item.artists[0].name : currentArtistName;
    loadLyricsForTrack(currentTrackName, firstArtistName, albumName, item.duration_ms || 0);

    // Prefetch next track lyrics in background after a 3s delay
    if (prefetchTimeout) clearTimeout(prefetchTimeout);
    prefetchTimeout = setTimeout(prefetchNextTrackLyrics, 3000);

    // Check if liked in main window
    checkIfTrackLikedMain(item.id);

    // Trigger desktop toast notification
    showNotification(currentTrackName, currentArtistName, coverUrl);

    // Refresh queue if currently viewing the queue tab
    if (activeTab === 'queue') {
      refreshQueue();
    }
  }

  // Sync play/pause control icons
  if (isPlaying) {
    iconPlay.classList.add('hidden');
    iconPause.classList.remove('hidden');
    btnPlayPause.title = 'Pause';
    
    iconFsPlay.classList.add('hidden');
    iconFsPause.classList.remove('hidden');
    btnFsPlayPause.title = 'Pause';
  } else {
    iconPlay.classList.remove('hidden');
    iconPause.classList.add('hidden');
    btnPlayPause.title = 'Play';
    
    iconFsPlay.classList.remove('hidden');
    iconFsPause.classList.add('hidden');
    btnFsPlayPause.title = 'Play';
  }

  // Sync timeline UI with player state (if user is not dragging)
  if (!isDraggingTimeline) {
    updateTimelineUI();
  }
}

// ── Dynamic Theming (Color Extractor) ──────────────────────────

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
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
  } catch (err) {
    console.error('Failed to extract theme colors:', err);
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
  root.style.setProperty('--bg-primary', 'rgba(15, 8, 12, 0.95)');
  root.style.setProperty('--bg-secondary', 'rgba(8, 5, 10, 0.95)');
}

// ── Synced Lyrics Fetching & Scroll ────────────────────────────

async function loadLyricsForTrack(track, artist, album, duration) {
  parsedLyrics = [];
  currentLyricIndex = -1;
  lyricsContainer.innerHTML = '';
  fsLyricsContainer.innerHTML = '';
  
  lyricsEmpty.classList.add('hidden');
  lyricsNotFound.classList.add('hidden');
  lyricsLoading.classList.remove('hidden');
  lyricsScrollContainer.scrollTop = 0;
  fsLyricsScrollContainer.scrollTop = 0;
  
  try {
    const rawLyrics = await fetchLyrics(track, artist, album, duration);
    lyricsLoading.classList.add('hidden');
    
    if (rawLyrics) {
      parsedLyrics = parseLrc(rawLyrics);
      
      if (parsedLyrics.length > 0) {
        // Render lines
        parsedLyrics.forEach((line, index) => {
          const lineEl = document.createElement('div');
          lineEl.classList.add('lyric-line');
          lineEl.textContent = line.text;
          lineEl.dataset.index = index;
          
          lineEl.addEventListener('click', () => {
            // Seek to lyric time on click! Very cool.
            spotifyApi.seek(line.timeMs);
            progressMs = line.timeMs;
            lastUpdateTimestamp = Date.now();
          });
          
          lyricsContainer.appendChild(lineEl);

          const fsLineEl = document.createElement('div');
          fsLineEl.classList.add('lyric-line');
          fsLineEl.textContent = line.text;
          fsLineEl.dataset.index = index;
          
          fsLineEl.addEventListener('click', () => {
            // Seek to lyric time on click! Very cool.
            spotifyApi.seek(line.timeMs);
            progressMs = line.timeMs;
            lastUpdateTimestamp = Date.now();
          });
          
          fsLyricsContainer.appendChild(fsLineEl);
        });
        
        lyricsScrollContainer.scrollTop = 0;
        fsLyricsScrollContainer.scrollTop = 0;
        return;
      }
    }
    
    // No synced lyrics found
    lyricsNotFound.classList.remove('hidden');
    const textEl = lyricsNotFound.querySelector('.lyrics-empty-text');
    const subEl = lyricsNotFound.querySelector('.lyrics-empty-sub');
    if (textEl) textEl.textContent = 'We are still writing this song...';
    if (subEl) subEl.textContent = 'No synced lyrics available.';
  } catch (err) {
    lyricsLoading.classList.add('hidden');
    lyricsNotFound.classList.remove('hidden');
    const textEl = lyricsNotFound.querySelector('.lyrics-empty-text');
    const subEl = lyricsNotFound.querySelector('.lyrics-empty-sub');
    if (textEl) textEl.textContent = 'Error loading lyrics.';
    if (subEl) subEl.textContent = 'Something went wrong while fetching lyrics.';
    console.error(err);
  }
}

async function prefetchNextTrackLyrics() {
  try {
    const queue = await spotifyApi.getQueue();
    if (queue && queue.queue && queue.queue.length > 0) {
      // Find the first valid track in the queue list
      const nextTrack = queue.queue.find(item => item !== null && item !== undefined);
      if (nextTrack) {
        const trackName = nextTrack.name;
        const artistName = (nextTrack.artists && nextTrack.artists.length > 0) ? nextTrack.artists[0].name : '';
        const albumName = nextTrack.album ? nextTrack.album.name : '';
        const durationMs = nextTrack.duration_ms;
        
        if (trackName && artistName) {
          console.log(`[Lyrics] Prefetching in background for next track: ${trackName} - ${artistName}`);
          // Fetch and cache it so it loads instantly when player transitions
          fetchLyrics(trackName, artistName, albumName, durationMs);
        }
      }
    }
  } catch (err) {
    console.debug('[Lyrics] Silent prefetch skip:', err.message);
  }
}

function syncLyricsScroll(currentPositionMs) {
  if (parsedLyrics.length === 0) return;
  
  const isFullscreen = !fullscreenLyricsOverlay.classList.contains('hidden');
  if (activeTab !== 'lyrics' && !isFullscreen) return;
  
  const offsetSec = parseFloat(localStorage.getItem('dd_settings_lyrics_offset') || '0.0');
  const offsetMs = offsetSec * 1000;
  const adjustedPositionMs = currentPositionMs + offsetMs;
  
  const activeIndex = getCurrentLyricIndex(parsedLyrics, adjustedPositionMs);
  
  if (activeIndex !== currentLyricIndex) {
    // Remove old active class
    const previousActive = lyricsContainer.querySelector('.lyric-line.active');
    if (previousActive) previousActive.classList.remove('active');
    
    const fsPreviousActive = fsLyricsContainer.querySelector('.lyric-line.active');
    if (fsPreviousActive) fsPreviousActive.classList.remove('active');
    
    currentLyricIndex = activeIndex;
    
    if (activeIndex !== -1) {
      const activeLine = lyricsContainer.querySelector(`.lyric-line[data-index="${activeIndex}"]`);
      if (activeLine && activeTab === 'lyrics') {
        activeLine.classList.add('active');
        
        // Scroll container to center active line
        const containerHeight = lyricsScrollContainer.clientHeight;
        const lineOffsetTop = activeLine.offsetTop;
        const lineOffsetHeight = activeLine.clientHeight;
        
        lyricsScrollContainer.scrollTop = lineOffsetTop - (containerHeight / 2) + (lineOffsetHeight / 2);
      }
      
      const fsActiveLine = fsLyricsContainer.querySelector(`.lyric-line[data-index="${activeIndex}"]`);
      if (fsActiveLine && isFullscreen) {
        fsActiveLine.classList.add('active');
        
        // Scroll container to center active line
        const fsContainerHeight = fsLyricsScrollContainer.clientHeight;
        const fsLineOffsetTop = fsActiveLine.offsetTop;
        const fsLineOffsetHeight = fsActiveLine.clientHeight;
        
        fsLyricsScrollContainer.scrollTop = fsLineOffsetTop - (fsContainerHeight / 2) + (fsLineOffsetHeight / 2);
      }
    } else {
      // Scroll to top when active index resets to -1 (e.g. track changed or restarted)
      if (activeTab === 'lyrics') {
        lyricsScrollContainer.scrollTop = 0;
      }
      if (isFullscreen) {
        fsLyricsScrollContainer.scrollTop = 0;
      }
    }
  }
}

// ── Queue Processing ──────────────────────────────────────────

async function refreshQueue() {
  if (activeTab !== 'queue') return;
  
  try {
    const queue = await spotifyApi.getQueue();
    queueList.innerHTML = '';
    
    if (queue && queue.queue && queue.queue.length > 0) {
      queueEmpty.classList.add('hidden');
      
      // Filter out null or undefined items
      const validItems = queue.queue.filter(item => item !== null && item !== undefined);
      
      if (validItems.length === 0) {
        queueEmpty.classList.remove('hidden');
        queueEmpty.textContent = 'Queue is empty';
        return;
      }
      
      // Take first 15 songs in queue
      validItems.slice(0, 15).forEach(item => {
        const itemEl = document.createElement('li');
        itemEl.classList.add('queue-item');
        itemEl.style.cursor = 'pointer';
        
        let coverUrl = '';
        if (item.album && item.album.images && item.album.images.length > 0) {
          coverUrl = item.album.images[item.album.images.length - 1].url;
        } else if (item.show && item.show.images && item.show.images.length > 0) {
          coverUrl = item.show.images[item.show.images.length - 1].url;
        }
        
        let artists = 'Unknown';
        if (item.artists && item.artists.length > 0) {
          artists = item.artists.map(a => a.name).join(', ');
        } else if (item.show) {
          artists = item.show.name;
        }
        
        const name = item.name || 'Unknown Title';
        
        itemEl.innerHTML = `
          ${coverUrl ? `<img src="${coverUrl}" class="queue-cover" alt="Cover">` : `<div class="queue-cover-fallback"></div>`}
          <div class="queue-info">
            <div class="queue-title">${name}</div>
            <div class="queue-artist">${artists}</div>
          </div>
        `;
        
        // Click to play this song immediately!
        itemEl.addEventListener('click', async () => {
          try {
            if (item.uri) {
              await spotifyApi.playTrack(item.uri);
              // Poll playback state with retry to handle API eventual consistency
              pollPlaybackStateWithRetry(true, 5, 800);
            }
          } catch (err) {
            console.error('Failed to play track from queue:', err);
            alert(`Failed to play song: ${err.message}`);
          }
        });
        
        queueList.appendChild(itemEl);
      });
    } else {
      queueEmpty.classList.remove('hidden');
      queueEmpty.textContent = 'Queue is empty';
    }
  } catch (err) {
    console.error('Failed to get Spotify queue:', err);
    queueEmpty.classList.remove('hidden');
    queueEmpty.textContent = `Could not fetch playback queue: ${err.message}. (Note: Spotify Premium is required for queue control)`;
  }
}

btnRefreshQueue.addEventListener('click', refreshQueue);

// ── Playback Progress Interpolation ──────────────────────────

function startInterpolation() {
  const loop = () => {
    if (isPlaying && durationMs > 0 && !isDraggingTimeline) {
      const elapsedSinceLastUpdate = Date.now() - lastUpdateTimestamp;
      const interpolatedProgress = Math.min(progressMs + elapsedSinceLastUpdate, durationMs);
      
      updateTimelineProgress(interpolatedProgress);
      syncLyricsScroll(interpolatedProgress);
      
      // Auto-refresh when the song naturally finishes
      if (interpolatedProgress >= durationMs && !hasEndedTriggered) {
        hasEndedTriggered = true;
        console.log('Track finished naturally. Triggering state poll...');
        setTimeout(pollPlaybackState, 1200);
      }
    }
    
    animationFrameId = requestAnimationFrame(loop);
  };
  
  animationFrameId = requestAnimationFrame(loop);
}

function updateTimelineProgress(positionMs) {
  // Current time label
  timeCurrentEl.textContent = formatTime(positionMs);
  
  // Total duration label
  timeTotalEl.textContent = formatTime(durationMs);
  
  // Progress bar percentage
  const percent = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;
  timelineSlider.value = percent;
  timelineProgress.style.width = `${percent}%`;
}

function updateTimelineUI() {
  timeCurrentEl.textContent = formatTime(progressMs);
  timeTotalEl.textContent = formatTime(durationMs);
  const percent = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;
  timelineSlider.value = percent;
  timelineProgress.style.width = `${percent}%`;
}

function formatTime(ms) {
  if (isNaN(ms) || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// ── Interactive Controller Events ─────────────────────────────

// Play/Pause Click
btnPlayPause.addEventListener('click', async () => {
  try {
    if (isPlaying) {
      await spotifyApi.pause();
      isPlaying = false;
      vinylDisc.classList.remove('playing');
      vinylTonearm.classList.remove('playing');
      iconPlay.classList.remove('hidden');
      iconPause.classList.add('hidden');
    } else {
      try {
        await spotifyApi.play();
      } catch (playErr) {
        // If play command fails due to no active device, let's try to wake up the first available device
        console.warn('Initial play command failed, checking for devices...', playErr);
        const deviceData = await spotifyApi.getDevices();
        if (deviceData && deviceData.devices && deviceData.devices.length > 0) {
          // Find either the first active or the first available device
          const targetDevice = deviceData.devices.find(d => d.is_active) || deviceData.devices[0];
          console.log(`Attempting to transfer playback to wake up device: ${targetDevice.name}`);
          await spotifyApi.transferPlayback(targetDevice.id, true);
        } else {
          throw new Error('No Spotify devices are open or online. Please open Spotify on your phone or computer first.');
        }
      }
      
      isPlaying = true;
      vinylDisc.classList.add('playing');
      vinylTonearm.classList.add('playing');
      iconPlay.classList.add('hidden');
      iconPause.classList.remove('hidden');
    }
    lastUpdateTimestamp = Date.now();
  } catch (err) {
    console.error('Play/Pause error:', err);
    alert(err.message || 'Failed to play/pause Spotify. Ensure you have Spotify open and active.');
  }
});

// Next Click
btnNext.addEventListener('click', async () => {
  try {
    await spotifyApi.nextTrack();
    // Poll playback state with retry to handle API eventual consistency
    pollPlaybackStateWithRetry(true, 5, 800);
  } catch (err) {
    console.error(err);
  }
});

// Prev Click
btnPrev.addEventListener('click', async () => {
  try {
    // If progress is > 3s, seek to start, else skip previous
    const elapsed = Date.now() - lastUpdateTimestamp;
    const currentPos = progressMs + (isPlaying ? elapsed : 0);
    if (currentPos > 3000) {
      await spotifyApi.seek(0);
      progressMs = 0;
      lastUpdateTimestamp = Date.now();
    } else {
      await spotifyApi.prevTrack();
      pollPlaybackStateWithRetry(true, 5, 800);
    }
  } catch (err) {
    console.error(err);
  }
});

// Shuffle Click
btnShuffle.addEventListener('click', async () => {
  const currentlyActive = btnShuffle.classList.contains('active');
  try {
    await spotifyApi.toggleShuffle(!currentlyActive);
    btnShuffle.classList.toggle('active', !currentlyActive);
  } catch (err) {
    console.error(err);
  }
});

// Repeat Click
btnRepeat.addEventListener('click', async () => {
  const hasActive = btnRepeat.classList.contains('active');
  let newState = 'off';
  
  // Repeat states cycling: off -> context (playlist) -> track (single) -> off
  const repeatStateText = localStorage.getItem('dd_repeat_state') || 'off';
  
  if (repeatStateText === 'off') {
    newState = 'context';
  } else if (repeatStateText === 'context') {
    newState = 'track';
  } else {
    newState = 'off';
  }
  
  try {
    await spotifyApi.setRepeat(newState);
    localStorage.setItem('dd_repeat_state', newState);
    
    // UI state updates in poll state
    pollPlaybackStateWithRetry(false, 4, 800);
  } catch (err) {
    console.error(err);
  }
});

// Seek Drag Events
timelineSlider.addEventListener('input', (e) => {
  isDraggingTimeline = true;
  const percent = parseFloat(e.target.value);
  const positionMs = (percent / 100) * durationMs;
  timeCurrentEl.textContent = formatTime(positionMs);
  timelineProgress.style.width = `${percent}%`;
});

timelineSlider.addEventListener('change', async (e) => {
  const percent = parseFloat(e.target.value);
  const targetMs = (percent / 100) * durationMs;
  
  try {
    await spotifyApi.seek(targetMs);
    progressMs = targetMs;
    lastUpdateTimestamp = Date.now();
  } catch (err) {
    console.error('Failed to seek:', err);
  } finally {
    isDraggingTimeline = false;
  }
});

// Volume Slider Throttling to prevent API rate-limiting while dragging
let isDraggingVolume = false;
let volumeThrottleTimeout = null;
let lastVolumeSent = -1;

function setVolumeThrottled(vol) {
  if (vol === lastVolumeSent) return;
  
  if (!volumeThrottleTimeout) {
    spotifyApi.setVolume(vol)
      .then(() => {
        lastVolumeSent = vol;
        currentVolume = vol;
        isMuted = false;
      })
      .catch(err => console.error('Failed to set volume:', err));
      
    // Limit calls to once every 200ms
    volumeThrottleTimeout = setTimeout(() => {
      volumeThrottleTimeout = null;
      const currentVol = parseInt(volumeSlider.value);
      if (currentVol !== lastVolumeSent) {
        setVolumeThrottled(currentVol);
      }
    }, 200);
  }
}

volumeSlider.addEventListener('input', (e) => {
  isDraggingVolume = true;
  const vol = parseInt(e.target.value);
  volumeProgress.style.width = `${vol}%`;
  setVolumeThrottled(vol);
});

volumeSlider.addEventListener('change', (e) => {
  const vol = parseInt(e.target.value);
  // Ensure final volume is applied and release dragging state
  setTimeout(() => {
    isDraggingVolume = false;
    setVolumeThrottled(vol);
  }, 100);
});

btnVolumeMute.addEventListener('click', async () => {
  try {
    if (isMuted) {
      await spotifyApi.setVolume(currentVolume);
      volumeSlider.value = currentVolume;
      volumeProgress.style.width = `${currentVolume}%`;
      isMuted = false;
    } else {
      await spotifyApi.setVolume(0);
      volumeSlider.value = 0;
      volumeProgress.style.width = `0%`;
      isMuted = true;
    }
  } catch (err) {
    console.error(err);
  }
});

// ── Devices Dropdown Handling ─────────────────────────────────

deviceBadge.addEventListener('click', (e) => {
  e.stopPropagation();
  const isHidden = devicesDropdown.classList.contains('hidden');
  if (isHidden) {
    devicesDropdown.classList.remove('hidden');
    loadDevicesList();
  } else {
    devicesDropdown.classList.add('hidden');
  }
});

document.addEventListener('click', () => {
  devicesDropdown.classList.add('hidden');
});

devicesDropdown.addEventListener('click', (e) => {
  e.stopPropagation();
});

async function loadDevicesList() {
  devicesList.innerHTML = '<li class="device-item loading"><div class="spinner"></div>Loading...</li>';
  
  try {
    const data = await spotifyApi.getDevices();
    devicesList.innerHTML = '';
    
    if (data && data.devices && data.devices.length > 0) {
      data.devices.forEach(device => {
        const li = document.createElement('li');
        li.className = `device-item ${device.is_active ? 'active' : ''}`;
        
        let iconSvg = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        `; // Computer
        
        if (device.type.toLowerCase() === 'smartphone') {
          iconSvg = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          `;
        } else if (device.type.toLowerCase() === 'speaker') {
          iconSvg = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="10" r="3"/>
              <circle cx="12" cy="16" r="1"/>
            </svg>
          `;
        }
        
        li.innerHTML = `
          ${iconSvg}
          <span>${device.name}</span>
        `;
        
        li.addEventListener('click', async () => {
          devicesDropdown.classList.add('hidden');
          try {
            await spotifyApi.transferPlayback(device.id, true);
            pollPlaybackStateWithRetry(false, 4, 800);
          } catch (err) {
            console.error('Failed to transfer playback:', err);
            alert(`Could not switch to device: ${err.message}`);
          }
        });
        
        devicesList.appendChild(li);
      });
    } else {
      devicesList.innerHTML = '<li class="device-item loading">No devices found. Open Spotify on a device.</li>';
    }
  } catch (err) {
    console.error('Failed to load devices:', err);
    devicesList.innerHTML = `<li class="device-item loading">Error: ${err.message}</li>`;
  }
}

// ── Mini Player View Toggling ─────────────────────────────────

function toggleMiniPlayerMode(isMini) {
  if (isMini) {
    stopPolling();
    window.windowControls.toggleMiniPlayer(true);
  }
}

btnMiniplayerToggle.addEventListener('click', () => toggleMiniPlayerMode(true));

// Restore main window polling when miniplayer is closed
window.windowControls.onMiniplayerClosed(() => {
  console.log('Miniplayer closed, resuming main window polling');
  currentTrackId = null; // Reset track ID to force a fresh details load
  startPolling();
});

// Manual refresh button listener
btnRefreshMain.addEventListener('click', async () => {
  const icon = btnRefreshMain.querySelector('.icon-refresh');
  if (icon) {
    icon.classList.add('spinning-once');
    setTimeout(() => icon.classList.remove('spinning-once'), 600);
  }
  console.log('Manually refreshing playback and song details...');
  currentTrackId = null; // Force reload
  await pollPlaybackState();
});

// ── Liked Songs (Main Window) ──────────────────────────────────

async function checkIfTrackLikedMain(trackId) {
  if (!trackId) {
    updateLikeUIMain(false);
    return;
  }
  try {
    const result = await spotifyApi.checkLibraryContains(trackId);
    if (result && result.length > 0) {
      updateLikeUIMain(result[0]);
    }
  } catch (err) {
    console.error('Failed to check if track is liked (main window):', err);
  }
}

function updateLikeUIMain(liked) {
  isLikedMain = liked;
  if (liked) {
    btnLikeMain.classList.add('liked');
    btnLikeMain.title = 'Remove from Liked Songs';
  } else {
    btnLikeMain.classList.remove('liked');
    btnLikeMain.title = 'Add to Liked Songs';
  }
}

btnLikeMain.addEventListener('click', async () => {
  if (!currentTrackId || isTogglingLikeMain) return;
  
  isTogglingLikeMain = true;
  const targetState = !isLikedMain;
  
  // Optimistic UI update
  updateLikeUIMain(targetState);
  
  try {
    if (targetState) {
      await spotifyApi.saveTrack(currentTrackId);
    } else {
      await spotifyApi.removeTrack(currentTrackId);
    }
  } catch (err) {
    console.error('Failed to toggle like (main window):', err);
    // Revert UI on failure
    updateLikeUIMain(!targetState);
    alert(`Failed to save/remove track: ${err.message}. If this is a permissions error, please click 'Disconnect' (or configure client) and connect again to grant the new library permissions.`);
  } finally {
    isTogglingLikeMain = false;
  }
});

// ── Search Tab Logic ──────────────────────────────────────────

// Debounced input handler
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  
  if (query.length > 0) {
    btnClearSearch.classList.remove('hidden');
  } else {
    btnClearSearch.classList.add('hidden');
    clearSearchResults();
    return;
  }
  
  if (searchTimeout) clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(() => {
    executeSearch(query);
  }, 350); // 350ms debounce
});

btnClearSearch.addEventListener('click', () => {
  searchInput.value = '';
  btnClearSearch.classList.add('hidden');
  clearSearchResults();
  searchInput.focus();
});

function clearSearchResults() {
  searchResults.innerHTML = '';
  searchResults.classList.add('hidden');
  searchInitial.classList.remove('hidden');
  searchLoading.classList.add('hidden');
  searchEmpty.classList.add('hidden');
}

async function executeSearch(query) {
  searchInitial.classList.add('hidden');
  searchEmpty.classList.add('hidden');
  searchResults.classList.add('hidden');
  searchLoading.classList.remove('hidden');
  
  try {
    const data = await spotifyApi.search(query, 15);
    searchLoading.classList.add('hidden');
    
    if (data && data.tracks && data.tracks.items && data.tracks.items.length > 0) {
      renderSearchResults(data.tracks.items);
    } else {
      searchEmpty.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Search API error:', err);
    searchLoading.classList.add('hidden');
    searchEmpty.classList.remove('hidden');
    searchEmpty.textContent = `Search error: ${err.message}`;
  }
}

function renderSearchResults(tracks) {
  searchResults.innerHTML = '';
  searchResults.classList.remove('hidden');
  
  tracks.forEach(track => {
    const itemEl = document.createElement('div');
    itemEl.className = 'search-track-item';
    
    const coverUrl = track.album && track.album.images.length > 0 
      ? track.album.images[track.album.images.length - 1].url 
      : '';
      
    const artists = track.artists.map(a => a.name).join(', ');
    
    itemEl.innerHTML = `
      ${coverUrl ? `<img src="${coverUrl}" class="search-track-cover" alt="Cover">` : `<div class="queue-cover-fallback"></div>`}
      <div class="search-track-info">
        <div class="search-track-title">${track.name}</div>
        <div class="search-track-artists">${artists}</div>
      </div>
      <div class="search-track-album">${track.album.name}</div>
    `;
    
    itemEl.addEventListener('click', async () => {
      try {
        if (track.uri) {
          // Play track
          await spotifyApi.playTrack(track.uri);
          // Poll with retry to handle API latency
          pollPlaybackStateWithRetry(true, 5, 800);
        }
      } catch (err) {
        console.error('Failed to play searched track:', err);
        alert(`Could not play: ${err.message}`);
      }
    });
    
    searchResults.appendChild(itemEl);
  });
}

// ── Library / Playlists Tab Logic ─────────────────────────────

let playlistsLoaded = false;

async function loadLibraryPlaylists(forceRefresh = false) {
  if (playlistsLoaded && !forceRefresh) return;
  
  // Reset back navigation to grid view
  showPlaylistsGrid();
  
  playlistsGrid.innerHTML = '';
  libraryEmpty.classList.add('hidden');
  libraryLoading.classList.remove('hidden');
  
  try {
    const data = await spotifyApi.getUserPlaylists(50);
    libraryLoading.classList.add('hidden');
    
    if (data && data.items && data.items.length > 0) {
      renderPlaylists(data.items);
      playlistsLoaded = true;
    } else {
      libraryEmpty.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Failed to load playlists:', err);
    libraryLoading.classList.add('hidden');
    libraryEmpty.classList.remove('hidden');
    libraryEmpty.textContent = `Could not fetch playlists: ${err.message}`;
  }
}

function renderPlaylists(playlists) {
  playlistsGrid.innerHTML = '';
  
  playlists.forEach(playlist => {
    // Skip empty or null playlists
    if (!playlist) return;
    
    const card = document.createElement('div');
    card.className = 'playlist-card';
    
    const coverUrl = playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '';
    const name = playlist.name || 'Unnamed Playlist';
    const totalTracks = playlist.tracks ? playlist.tracks.total : 0;
    
    card.innerHTML = `
      <div class="playlist-art-wrapper">
        ${coverUrl ? `<img src="${coverUrl}" class="playlist-art" alt="Art" loading="lazy">` : `<div class="queue-cover-fallback" style="width: 100%; height: 100%;"></div>`}
        <button class="playlist-play-hover" title="Play Playlist">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="playlist-name">${name}</div>
      <div class="playlist-tracks-count">${totalTracks} Tracks</div>
    `;
    
    // Play button on card
    const btnPlay = card.querySelector('.playlist-play-hover');
    btnPlay.addEventListener('click', async (e) => {
      e.stopPropagation(); // don't open details
      try {
        await spotifyApi.playContext(playlist.uri);
        pollPlaybackStateWithRetry(true, 5, 800);
      } catch (err) {
        console.error('Failed to play playlist context:', err);
        alert(`Failed to play: ${err.message}. (Note: Active Spotify Premium device is required)`);
      }
    });
    
    // Clicking card opens detail view
    card.addEventListener('click', () => {
      openPlaylistDetails(playlist);
    });
    
    playlistsGrid.appendChild(card);
  });
}

async function openPlaylistDetails(playlist) {
  currentPlaylist = playlist;
  
  // Transition views
  playlistsGrid.classList.add('hidden');
  playlistDetail.classList.remove('hidden');
  btnLibraryBack.classList.remove('hidden');
  libraryTitle.textContent = playlist.name;
  
  // Setup header
  const coverUrl = playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '';
  playlistDetailArt.src = coverUrl;
  playlistDetailName.textContent = playlist.name;
  playlistDetailCount.textContent = `${playlist.tracks.total} tracks`;
  
  playlistTracksList.innerHTML = '<li class="lyrics-status-msg"><div class="spinner"></div>Loading tracks...</li>';
  
  // Bind main Play Playlist button
  btnPlayPlaylist.onclick = async () => {
    try {
      await spotifyApi.playContext(playlist.uri);
      pollPlaybackStateWithRetry(true, 5, 800);
    } catch (err) {
      console.error('Failed to play playlist:', err);
      alert(`Could not play playlist: ${err.message}`);
    }
  };
  
  try {
    const data = await spotifyApi.getPlaylistTracks(playlist.id, 50);
    playlistTracksList.innerHTML = '';
    
    if (data && data.items && data.items.length > 0) {
      // Filter out null track items
      const validItems = data.items.filter(item => item && item.track);
      
      validItems.forEach((item, index) => {
        const track = item.track;
        const li = document.createElement('li');
        li.className = 'playlist-track-item';
        
        const duration = formatTime(track.duration_ms);
        const artist = track.artists.map(a => a.name).join(', ');
        
        li.innerHTML = `
          <span class="playlist-track-num">${index + 1}</span>
          <span class="playlist-track-title">${track.name}</span>
          <span class="playlist-track-artist">${artist}</span>
          <span class="playlist-track-duration">${duration}</span>
        `;
        
        li.addEventListener('click', async () => {
          try {
            // Play playlist starting at this track!
            await spotifyApi.playContext(playlist.uri, track.uri);
            pollPlaybackStateWithRetry(true, 5, 800);
          } catch (err) {
            console.error('Failed to play track inside playlist context:', err);
            alert(`Could not play track: ${err.message}`);
          }
        });
        
        playlistTracksList.appendChild(li);
      });
    } else {
      playlistTracksList.innerHTML = '<li class="lyrics-status-msg">No tracks in this playlist</li>';
    }
  } catch (err) {
    console.error('Failed to load playlist tracks:', err);
    playlistTracksList.innerHTML = `<li class="lyrics-status-msg">Error loading tracks: ${err.message}</li>`;
  }
}

function showPlaylistsGrid() {
  playlistsGrid.classList.remove('hidden');
  playlistDetail.classList.add('hidden');
  btnLibraryBack.classList.add('hidden');
  libraryTitle.textContent = 'Your Playlists';
  currentPlaylist = null;
}

btnLibraryBack.addEventListener('click', showPlaylistsGrid);

// ── Fullscreen Overlay Features ──────────────────

// Fullscreen Lyrics Overlay Logic
function openFullscreen() {
  fullscreenLyricsOverlay.classList.remove('hidden');
  document.body.classList.add('fullscreen-mode-active');
  window.windowControls.setFullScreen(true);
  
  fsAlbumArt.src = albumArt.src;
  fsTrackTitle.textContent = trackNameEl.textContent;
  fsArtistName.textContent = artistNameEl.textContent;
  
  if (isPlaying) {
    iconFsPlay.classList.add('hidden');
    iconFsPause.classList.remove('hidden');
  } else {
    iconFsPlay.classList.remove('hidden');
    iconFsPause.classList.add('hidden');
  }
  
  if (currentLyricIndex !== -1) {
    const fsActiveLine = fsLyricsContainer.querySelector(`.lyric-line[data-index="${currentLyricIndex}"]`);
    if (fsActiveLine) {
      fsActiveLine.classList.add('active');
      setTimeout(() => {
        const fsContainerHeight = fsLyricsScrollContainer.clientHeight;
        const fsLineOffsetTop = fsActiveLine.offsetTop;
        const fsLineOffsetHeight = fsActiveLine.clientHeight;
        fsLyricsScrollContainer.scrollTop = fsLineOffsetTop - (fsContainerHeight / 2) + (fsLineOffsetHeight / 2);
      }, 50);
    }
  }
}

function closeFullscreen() {
  fullscreenLyricsOverlay.classList.add('hidden');
  document.body.classList.remove('fullscreen-mode-active');
  window.windowControls.setFullScreen(false);
}

btnFullscreenToggle.addEventListener('click', openFullscreen);
btnFsExit.addEventListener('click', closeFullscreen);

btnFsPrev.addEventListener('click', () => btnPrev.click());
btnFsPlayPause.addEventListener('click', () => btnPlayPause.click());
btnFsNext.addEventListener('click', () => btnNext.click());

// Close fullscreen on Escape key press
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !fullscreenLyricsOverlay.classList.contains('hidden')) {
    closeFullscreen();
  }
});

// ── Desktop Toast Notifications ────────────────────────────────

function requestNotificationPermission() {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission status:', permission);
    });
  }
}

// Request permission on init
requestNotificationPermission();

function showNotification(title, artists, coverUrl) {
  const notificationsEnabled = localStorage.getItem('dd_settings_notifications') !== 'false';
  if (notificationsEnabled && Notification.permission === 'granted') {
    try {
      new Notification('Now Playing on Driftin', {
        body: `${title}\nby ${artists}`,
        icon: coverUrl || '../icon.png',
        silent: true // Do not play a loud OS alert sound on every song
      });
    } catch (err) {
      console.error('Failed to show system notification:', err);
    }
  }
}

// ── Global Media Keys Receivers ──────────────────────────────

window.spotify.onMediaPlayPause(() => {
  console.log('Global shortcut: Play/Pause');
  btnPlayPause.click();
});

window.spotify.onMediaNext(() => {
  console.log('Global shortcut: Next');
  btnNext.click();
});

window.spotify.onMediaPrev(() => {
  console.log('Global shortcut: Previous');
  btnPrev.click();
});

// Start Initialization
init();
