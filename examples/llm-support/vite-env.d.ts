/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LLM_SUPPORT_EXAMPLE_MODE?: 'auto' | 'fallback' | 'live';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
