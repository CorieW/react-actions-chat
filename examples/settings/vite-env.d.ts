/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SETTINGS_RECOMMENDATION_API_URL?: string;
  readonly VITE_SETTINGS_RECOMMENDATION_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
