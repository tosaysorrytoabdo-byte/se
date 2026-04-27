/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KIMI_AUTH_URL: string;
  readonly VITE_APP_ID: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
