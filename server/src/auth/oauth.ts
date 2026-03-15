// OAuth configuration via environment variables
// Set these before starting the server:
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
//   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
//   OAUTH_REDIRECT_BASE (e.g. http://localhost:3001)

export interface OAuthConfig {
  readonly google: {
    readonly clientId: string;
    readonly clientSecret: string;
    readonly redirectUri: string;
  };
  readonly github: {
    readonly clientId: string;
    readonly clientSecret: string;
    readonly redirectUri: string;
  };
}

export function getOAuthConfig(): OAuthConfig {
  const base = process.env.OAUTH_REDIRECT_BASE || 'http://localhost:3001';
  return {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: `${base}/auth/google/callback`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      redirectUri: `${base}/auth/github/callback`,
    },
  };
}

export function isGoogleConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isGithubConfigured(): boolean {
  return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

// Google OAuth URL
export function getGoogleAuthUrl(state: string): string {
  const config = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// GitHub OAuth URL
export function getGithubAuthUrl(state: string): string {
  const config = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.redirectUri,
    scope: 'read:user user:email',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

// Exchange Google code for user info
export async function exchangeGoogleCode(code: string): Promise<{
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly picture: string;
} | null> {
  const config = getOAuthConfig();
  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json() as { access_token?: string };
    if (!tokens.access_token) return null;

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const user = await userRes.json() as { id: string; email: string; name: string; picture: string };
    return { id: user.id, email: user.email, name: user.name, picture: user.picture };
  } catch {
    return null;
  }
}

// Exchange GitHub code for user info
export async function exchangeGithubCode(code: string): Promise<{
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly login: string;
} | null> {
  const config = getOAuthConfig();
  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.redirectUri,
      }),
    });
    const tokens = await tokenRes.json() as { access_token?: string };
    if (!tokens.access_token) return null;

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/vnd.github+json',
      },
    });
    const user = await userRes.json() as { id: number; login: string; name: string | null; avatar_url: string; email: string | null };

    // Get email if not public
    let email = user.email || '';
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: 'application/vnd.github+json',
        },
      });
      const emails = await emailRes.json() as { email: string; primary: boolean }[];
      const primary = emails.find(e => e.primary);
      email = primary?.email || emails[0]?.email || '';
    }

    return {
      id: String(user.id),
      email,
      name: user.name || user.login,
      avatarUrl: user.avatar_url,
      login: user.login,
    };
  } catch {
    return null;
  }
}
