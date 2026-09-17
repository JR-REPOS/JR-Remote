import { CustomAIProvider } from "../types";

const STORAGE_KEY = "9remote-custom-ai-providers";
const ACTIVE_PROVIDER_KEY = "9remote-active-provider-id";

export interface ProviderPreset {
  name: string;
  baseUrl: string;
  modelId: string;
  placeholderKey?: string;
  requiresKey: boolean;
  hint: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    modelId: "gpt-4o",
    placeholderKey: "sk-...",
    requiresKey: true,
    hint: "Official OpenAI API (GPT-4o, GPT-4o-mini)",
  },
  {
    name: "Ollama (Local)",
    baseUrl: "http://localhost:11434/v1",
    modelId: "llama3.2",
    placeholderKey: "Not needed for local Ollama",
    requiresKey: false,
    hint: "Local inference without API keys (ollama run llama3.2)",
  },
  {
    name: "Groq Cloud",
    baseUrl: "https://api.groq.com/openai/v1",
    modelId: "llama-3.3-70b-versatile",
    placeholderKey: "gsk_...",
    requiresKey: true,
    hint: "Ultra-fast LPU inference (Llama 3.3, Mixtral)",
  },
  {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    modelId: "anthropic/claude-3.5-sonnet",
    placeholderKey: "sk-or-...",
    requiresKey: true,
    hint: "Universal gateway to Claude, Llama, Gemini, and Mistral",
  },
  {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    modelId: "deepseek-chat",
    placeholderKey: "sk-...",
    requiresKey: true,
    hint: "DeepSeek-V3 and DeepSeek-R1 models",
  },
];

export function getCustomProviders(): CustomAIProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Failed to read custom providers from localStorage", err);
    return [];
  }
}

export function saveCustomProvider(provider: CustomAIProvider): CustomAIProvider[] {
  try {
    const list = getCustomProviders();
    const existingIndex = list.findIndex((p) => p.id === provider.id);
    const updated: CustomAIProvider = {
      ...provider,
      updatedAt: new Date().toISOString(),
      createdAt: provider.createdAt || new Date().toISOString(),
    };

    let nextList: CustomAIProvider[];
    if (existingIndex >= 0) {
      nextList = [...list];
      nextList[existingIndex] = updated;
    } else {
      nextList = [...list, updated];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));
    return nextList;
  } catch (err) {
    console.error("Failed to save custom provider to localStorage", err);
    return getCustomProviders();
  }
}

export function deleteCustomProvider(id: string): CustomAIProvider[] {
  try {
    const list = getCustomProviders();
    const nextList = list.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextList));

    if (getActiveCustomProviderId() === id) {
      setActiveCustomProviderId(null);
    }

    return nextList;
  } catch (err) {
    console.error("Failed to delete custom provider from localStorage", err);
    return getCustomProviders();
  }
}

export function getActiveCustomProviderId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROVIDER_KEY);
  } catch {
    return null;
  }
}

export function setActiveCustomProviderId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROVIDER_KEY);
    }
  } catch (err) {
    console.error("Failed to set active provider ID", err);
  }
}

export async function testProviderConnection(provider: {
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId: string;
}): Promise<{ ok: boolean; message?: string; error?: string; latency?: number }> {
  try {
    const res = await fetch("/api/custom-provider/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: provider.name,
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        modelId: provider.modelId,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      ok: false,
      error: err.message || "Failed to reach backend test endpoint",
    };
  }
}
