/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_PRIMEKG_API_URL: string;
  readonly VITE_PRIMEKG_API_KEY: string;
  readonly VITE_GRAPHQL_API_URL?: string;
  readonly GEMINI_API_KEY?: string;
  readonly GRAPHQL_API_URL?: string;
  readonly PRIMEKG_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
