/**
 * LLM provider presets. Each maps to a different HTTP API shape.
 */
export type AiProviderId =
  | "openai_compatible"
  | "openai"
  | "anthropic"
  | "google_gemini"
  | "azure_openai"
  | "groq"
  | "mistral";

export const AI_PROVIDER_LABELS: Record<AiProviderId, string> = {
  openai_compatible: "OpenAI-compatible (custom URL)",
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  google_gemini: "Google Gemini",
  azure_openai: "Azure OpenAI",
  groq: "Groq",
  mistral: "Mistral AI",
};

/** Non-secret AI preferences (AsyncStorage). API key lives in SecureStore. */
export type AiUserConfig = {
  providerId: AiProviderId;
  /** Custom base for openai_compatible, e.g. https://api.openai.com/v1 */
  baseUrl: string;
  /** Model id (OpenAI / compatible / Groq / Mistral) or Anthropic model or Gemini model */
  model: string;
  /** Azure: https://YOUR_RESOURCE.openai.azure.com (no trailing path) */
  azureEndpoint: string;
  /** Azure: deployment name */
  azureDeployment: string;
  azureApiVersion: string;
};

export const DEFAULT_AI_CONFIG: AiUserConfig = {
  providerId: "openai_compatible",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  azureEndpoint: "",
  azureDeployment: "",
  azureApiVersion: "2024-02-15-preview",
};

export const PRESET_DEFAULT_MODEL: Partial<Record<AiProviderId, string>> = {
  openai: "gpt-4o-mini",
  openai_compatible: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  google_gemini: "gemini-2.0-flash",
  azure_openai: "gpt-4o-mini",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
};

export const FIXED_BASE_URLS: Partial<Record<AiProviderId, string>> = {
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
  mistral: "https://api.mistral.ai/v1",
};
