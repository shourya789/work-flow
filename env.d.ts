/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Use VITE_ prefix so the key is available in the browser
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
