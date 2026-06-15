# Driftin 🎵

Driftin is a premium, custom-styled Spotify player application for Windows built using Electron, vanilla CSS, and the Spotify Web API. Designed for users who want a beautiful and responsive companion interface for their music session, Driftin replaces generic web layouts with a striking glassmorphic design that reacts dynamically to your listening. It features real-time lyrics synchronization, a visual spinning vinyl record with an interactive tonearm, a sleek miniplayer mode for a minimalist desktop footprint, and global media key interceptors so you can control playback seamlessly from anywhere on your PC.

---

## Key Features

- ✨ **Dynamic Glassmorphism**: A modern, translucent interface with vibrant gradients and subtle hover micro-animations that feel alive.
- 🎨 **Dynamic Album Art Theming**: An intelligent color extraction system that reads the playing track's album art and morphs the app's colors (primary, secondary, accent, and ambient glow) to match the album.
- 🎤 **Synced Scroll Lyrics**: Fetches lyrics automatically from LRCLIB and scrolls line-by-line synced with the song. Click on any lyric line to seek directly to that timestamp.
- 📺 **Fullscreen Lyrics Mode**: A beautiful distraction-free ambient visualizer showing oversized album art and large synced lyrics.
- 💿 **Interactive Vinyl Visualizer**: A retro vinyl record displaying the current track's cover art that spins while playing, accompanied by a tonearm that lowers when music starts and lifts when paused.
- 📱 **Mini Player**: Close the main window to collapse Driftin into a sleek, compact floating desktop widget. Easily toggle opacity, play, pause, skip, and like tracks from the widget.
- 🎛️ **Playback & Volume Controls**: Fully-featured shuffle, repeat cycling (Off ➡️ Repeat Playlist ➡️ Repeat Single Track), seek timeline, and a throttled volume slider to prevent Spotify rate-limiting.
- 📋 **Interactive Queue & Playlists**: View your upcoming queue list (and click to play any track immediately) or browse your playlists directly inside the app.
- ⌨️ **Global Media Keys**: Controls Spotify playback natively via your keyboard's media buttons (Play/Pause, Next, Previous) even when the app is minimized.
- 🔔 **Toast Notifications**: System notifications toast alerts on track changes (can be disabled in Settings).

---

## Screenshots & Design System

The application is styled with custom HSL tailored colors, sleek dark modes, and premium typography from Google Fonts:
- **Titlebar**: Custom frameless titlebar with Windows-matching minimize, maximize, and close controls. Includes a real-time digital clock in Jersey 10 typography.
- **Glass Panel**: Translucent panels using advanced CSS backdrop-filter blurs.
- **Animations**: Soft 300ms transitions on interactive buttons, vinyl arm swings, and smooth scroll offsets.

---

## Installation & Setup

To run Driftin locally, you will need **Node.js** installed on your Windows machine and an active **Spotify Premium** account (required by the Spotify Web Player API for playback control).

### 1. Register a Spotify Developer App
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**.
3. Name your app (e.g., `Driftin Desktop`) and add a description.
4. In the **Redirect URIs** field, enter:
   ```text
   driftin://spotify-auth
   ```
5. Check the terms and save.
6. Copy your **Client ID** from the App settings page.

### 2. Clone and Install Dependencies
Navigate to the project directory and install the Node modules:
```bash
# Install dependencies
npm install
```

### 3. Run the App
Launch the Electron application:
```bash
# Start Driftin
npm start
```

### 4. Connect Spotify
1. On the Driftin login screen, click **Connect Spotify**.
2. If it is your first time or you want to configure a custom API credential, click the Settings gear icon in the corner to enter your custom **Client ID**.
3. Log in with your Spotify credentials, authorize the scopes, and start drifting!

---

## Building the App
To package the app into a standalone Windows executable (`Driftin.exe`):
```bash
npm run build
```
The compiled output will be generated inside the `dist/Driftin-win32-x64` directory.

---

## License

This project is licensed under the ISC License.
