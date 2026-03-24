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
  /**
   * Custom base for openai_compatible (no trailing slash; app appends /chat/completions).
   * Examples: https://api.openai.com/v1, https://openrouter.ai/api/v1,
   * https://api.together.xyz/v1, http://localhost:1234/v1 (LM Studio),
   * http://localhost:11434/v1 (Ollama)
   */
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

/** OpenRouter OpenAI-compatible API base (no trailing slash). */
export const OPENROUTER_COMPATIBLE_BASE_URL = "https://openrouter.ai/api/v1";

/** Default model when using OpenRouter (free tier friendly). */
export const OPENROUTER_DEFAULT_MODEL = "stepfun/step-3.5-flash:free";

export type OpenAiCompatibleEndpointPreset = {
  id: string;
  label: string;
  url: string;
  /** Applied when user picks this preset from the endpoint menu */
  suggestedModel?: string;
};

export const OPENAI_COMPATIBLE_ENDPOINT_PRESETS: OpenAiCompatibleEndpointPreset[] = [
  { id: "openai", label: "OpenAI", url: "https://api.openai.com/v1" },
  {
    id: "openrouter",
    label: "OpenRouter",
    url: OPENROUTER_COMPATIBLE_BASE_URL,
    suggestedModel: OPENROUTER_DEFAULT_MODEL,
  },
  { id: "together", label: "Together", url: "https://api.together.xyz/v1" },
  { id: "lm_studio", label: "LM Studio", url: "http://localhost:1234/v1" },
  { id: "ollama", label: "Ollama", url: "http://localhost:11434/v1" },
];

export function normalizeOpenAiCompatibleBaseUrl(u: string): string {
  return u.trim().replace(/\/+$/, "");
}
