// Wallpaper management - rotates background image every hour using picsum.photos

const WALLPAPER_KEY = 'typerace_wallpaper';
const WALLPAPER_TIME_KEY = 'typerace_wallpaper_time';
const ROTATE_INTERVAL_MS = 60 * 1000; // 60 seconds

interface WallpaperState {
  readonly id: number;
  readonly url: string;
  readonly timestamp: number;
}

// Generate a deterministic "random" id based on the hour
function getHourSeed(): number {
  const now = Date.now();
  // Seed based on current hour (changes every hour)
  return Math.floor(now / ROTATE_INTERVAL_MS);
}

// picsum has ~1000 images, pick one based on seed
function getImageId(seed: number): number {
  // Simple hash to spread across available images
  return ((seed * 2654435761) >>> 0) % 1000;
}

export function getWallpaperUrl(): string {
  const seed = getHourSeed();
  const id = getImageId(seed);
  // Use picsum.photos with specific image id for consistency within the hour
  return `https://picsum.photos/id/${id}/1920/1080`;
}

export function getWallpaperState(): WallpaperState {
  const stored = localStorage.getItem(WALLPAPER_KEY);
  const storedTime = parseInt(localStorage.getItem(WALLPAPER_TIME_KEY) || '0');
  const currentSeed = getHourSeed();

  if (stored && storedTime === currentSeed) {
    try {
      return JSON.parse(stored);
    } catch {
      // fall through to generate new
    }
  }

  const id = getImageId(currentSeed);
  const state: WallpaperState = {
    id,
    url: `https://picsum.photos/id/${id}/1920/1080`,
    timestamp: Date.now(),
  };

  localStorage.setItem(WALLPAPER_KEY, JSON.stringify(state));
  localStorage.setItem(WALLPAPER_TIME_KEY, String(currentSeed));

  return state;
}

// Preload the next hour's wallpaper
export function preloadNextWallpaper(): void {
  const nextSeed = getHourSeed() + 1;
  const nextId = getImageId(nextSeed);
  const img = new Image();
  img.src = `https://picsum.photos/id/${nextId}/1920/1080`;
}

// Get ms until next wallpaper change
export function getMsUntilNextChange(): number {
  const now = Date.now();
  const currentHourStart = Math.floor(now / ROTATE_INTERVAL_MS) * ROTATE_INTERVAL_MS;
  const nextHour = currentHourStart + ROTATE_INTERVAL_MS;
  return nextHour - now;
}

// Force switch to a random wallpaper (user-triggered)
export function randomizeWallpaper(): WallpaperState {
  const randomId = Math.floor(Math.random() * 1000);
  const state: WallpaperState = {
    id: randomId,
    url: `https://picsum.photos/id/${randomId}/1920/1080`,
    timestamp: Date.now(),
  };

  // Save with current seed so it persists until next hour
  const currentSeed = getHourSeed();
  localStorage.setItem(WALLPAPER_KEY, JSON.stringify(state));
  localStorage.setItem(WALLPAPER_TIME_KEY, String(currentSeed));

  return state;
}
