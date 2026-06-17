# Driftin 🎵

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Electron](https://img.shields.io/badge/Electron-v30.5-blue.svg?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![CSS3](https://img.shields.io/badge/CSS3-Vanilla-orange.svg?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Spotify Web API](https://img.shields.io/badge/Spotify-API-1DB954.svg?style=for-the-badge&logo=spotify&logoColor=white)](https://developer.spotify.com/documentation/web-api/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

Driftin is a premium, custom-styled companion Spotify player for Windows. Built using Electron, vanilla CSS, and the Spotify Web API, it replaces the standard web client layouts with a striking glassmorphic interface that responds dynamically to your music.

> [!IMPORTANT]
> **Spotify Premium Required:** Due to Spotify API developer constraints, active playback control features (such as play, pause, skip, seek, and volume adjustments) require a **Spotify Premium** account.

Whether you need a full-screen ambient lyrics display or a floating miniplayer widget on your desktop, Driftin offers a distraction-free and interactive listening experience.

---

## ⭐️ Key Features

### 🎨 Visual & Aesthetic Experience
*   **Dynamic Glassmorphism:** A translucent interface using advanced CSS backdrop-filter blurs, vibrant HSL gradients, and smooth hover micro-animations.
*   **Intelligent Album Theming:** An automatic color extraction system that reads the playing track's artwork and morphs the application's primary, secondary, accent, and ambient glow colors to match.
*   **Interactive Vinyl Visualizer:** A retro vinyl record displaying the current track's cover art that spins while playing, complete with an interactive tonearm that lowers when playing and lifts when paused.

### 🎤 Lyrics Synchronization
*   **Synced Scrolling Lyrics:** Automatically fetches lyrics from LRCLIB and scrolls them line-by-line in sync with the song.
*   **Interactive Seek:** Click on any lyric line to jump/seek directly to that timestamp in the song.
*   **Fullscreen Ambient Mode:** Hide distractions with a dedicated ambient mode displaying oversized album art and large synced lyrics.

### ⚡ Control & Desktop Integration
*   **Floating Mini Player:** Collapse Driftin into a sleek, compact desktop widget. Control play, pause, skip, like tracks, and adjust the widget's opacity from the overlay.
*   **Interactive Queue & Playlists:** Browse your library playlists or view upcoming queued tracks with instant click-to-play.
*   **Global Media Keys:** Play, pause, skip, and rewind natively using your keyboard's media keys even when the app is minimized or in the background.
*   **Smart Playback Control:** Native playback sliders, shuffle/repeat cycling (Off ➡️ Repeat Playlist ➡️ Repeat Single Track), and rate-limit-aware volume adjustments.

---

## ⚙️ Installation & Developer Setup

To run Driftin locally, you need **Node.js** installed on your system and an active **Spotify Premium** account (required by Spotify's Web Player API for third-party playback control).

### 1. Register a Spotify Developer App
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Fill in your app name (e.g., `Driftin Desktop`) and description.
4. Set the **Redirect URI** to:
   ```text
   driftin://spotify-auth
   ```
5. Save the settings and copy your **Client ID**.

### 2. Install Dependencies
```bash
# Clone the repository (or extract the downloaded ZIP)
# Open your terminal inside the project directory:
npm install
```

### 3. Launch the Application
```bash
npm start
```

### 4. Connect Your Account
1. Launch Driftin and click **Connect Spotify**.
2. Click the settings **gear icon** in the top-right corner to enter your custom **Client ID** (this persists so you only have to do it once).
3. Complete the Spotify authorization in your browser and start listening!

---

## 📦 Building the Standalone App

To package the application into a standalone Windows executable (`Driftin.exe`) containing the custom icon bundle:

```bash
npm run build
```

The compiled output will be generated inside the `dist/Driftin-win32-x64` directory.

---

## 📜 License

This project is licensed under the **ISC License**. Feel free to customize, fork, and drift!
