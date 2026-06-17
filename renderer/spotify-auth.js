// Spotify Authorization Code Flow with PKCE in Electron
// Exposes login and token management methods

const DEFAULT_CLIENT_ID = '';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'user-library-modify',
  'user-read-recently-played',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ');

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const REDIRECT_URI = 'driftin://spotify-auth';

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export class SpotifyAuth {
  constructor() {}

  get accessToken() {
    return localStorage.getItem('dd_access_token');
  }

  set accessToken(val) {
    if (val) localStorage.setItem('dd_access_token', val);
    else localStorage.removeItem('dd_access_token');
  }

  get refreshToken() {
    return localStorage.getItem('dd_refresh_token');
  }

  set refreshToken(val) {
    if (val) localStorage.setItem('dd_refresh_token', val);
    else localStorage.removeItem('dd_refresh_token');
  }

  get tokenExpiry() {
    return parseInt(localStorage.getItem('dd_token_expiry') || '0');
  }

  set tokenExpiry(val) {
    if (val) localStorage.setItem('dd_token_expiry', val.toString());
    else localStorage.removeItem('dd_token_expiry');
  }

  get clientId() {
    return localStorage.getItem('dd_client_id') || DEFAULT_CLIENT_ID;
  }

  set clientId(val) {
    localStorage.setItem('dd_client_id', val || DEFAULT_CLIENT_ID);
  }

  setClientId(clientId) {
    this.clientId = clientId;
  }

  getClientId() {
    return this.clientId;
  }

  /** Trigger OAuth flow via Electron child window */
  async login() {
    const codeVerifier = generateRandomString(128);
    localStorage.setItem('dd_code_verifier', codeVerifier);

    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64urlEncode(hashed);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      show_dialog: 'true'
    });

    const authUrl = `${AUTH_ENDPOINT}?${params.toString()}`;
    
    try {
      // Call IPC handler exposed by preload.js
      const result = await window.spotify.login(authUrl);
      
      if (result.cancelled) {
        console.log('Login cancelled by user');
        return false;
      }
      
      const code = result.code;
      if (!code) return false;

      return await this.exchangeCodeForTokens(code, codeVerifier);
    } catch (err) {
      console.error('Spotify login error:', err);
      return false;
    }
  }

  /** Exchange code for tokens */
  async exchangeCodeForTokens(code, codeVerifier) {
    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: this.clientId,
          code_verifier: codeVerifier
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error_description || data.error);

      this.saveTokens(data);
      localStorage.removeItem('dd_code_verifier');
      return true;
    } catch (err) {
      console.error('Token exchange failed:', err);
      return false;
    }
  }

  /** Get a valid access token, refreshing if needed */
  async getValidToken() {
    if (!this.accessToken) return null;

    // Refresh if within 60s of expiry
    if (Date.now() > this.tokenExpiry - 60000) {
      const refreshed = await this.refresh();
      if (!refreshed) return null;
    }

    return this.accessToken;
  }

  /** Refresh the access token */
  async refresh() {
    // Check if another window already refreshed the token
    const currentExpiry = this.tokenExpiry;
    const currentToken = this.accessToken;
    if (currentToken && Date.now() < currentExpiry - 60000) {
      console.log('Token was already refreshed by another window.');
      return true;
    }

    if (!this.refreshToken) return false;

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error_description || data.error);

      this.saveTokens(data);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      this.clearTokens();
      return false;
    }
  }

  /** Persist tokens to localStorage */
  saveTokens(data) {
    this.accessToken = data.access_token;
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
  }

  /** Clear all stored tokens (logout) */
  clearTokens() {
    localStorage.removeItem('dd_access_token');
    localStorage.removeItem('dd_refresh_token');
    localStorage.removeItem('dd_token_expiry');
    localStorage.removeItem('dd_code_verifier');
  }

  /** Check if user is authenticated */
  get isAuthenticated() {
    return !!this.accessToken && Date.now() < this.tokenExpiry;
  }
}
