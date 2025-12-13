declare global {
  interface Window {
    __ENV__?: {
      VITE_API_URL?: string;
    };
  }
}

export const API_BASE_URL =
  window.__ENV__?.VITE_API_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
