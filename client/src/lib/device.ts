
// Not importing uuid on client, use crypto API instead
const DEVICE_ID_KEY = 'typerace_device_id';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? generateId();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function generateId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// Sync profile with server
export async function syncProfile(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const deviceId = getDeviceId();
  const res = await fetch(`/api/profile/${deviceId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loadProfile(): Promise<Record<string, unknown>> {
  const deviceId = getDeviceId();
  const res = await fetch(`/api/profile/${deviceId}`);
  return res.json();
}

export async function submitScore(data: {
  nickname: string;
  avatar: number;
  wpm: number;
  accuracy: number;
  textLength: number;
  mode: string;
  language?: string;
}): Promise<void> {
  const deviceId = getDeviceId();
  await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, deviceId }),
  });
}

export async function loadHistory(limit = 20): Promise<readonly { wpm: number; accuracy: number; mode: string; createdAt: string }[]> {
  const deviceId = getDeviceId();
  const res = await fetch(`/api/history/${deviceId}?limit=${limit}`);
  return res.json();
}
