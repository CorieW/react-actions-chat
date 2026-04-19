/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_SETTINGS_EXAMPLE_MODE?: 'auto' | 'fallback' | 'live';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
