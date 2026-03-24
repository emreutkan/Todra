import {
  AiProviderId,
  AiUserConfig,
  FIXED_BASE_URLS,
} from "../../types/ai";
import { TODO_TOOLS_OPENAI } from "../todoToolDefinitions";
import { executeTodoTool } from "../todoToolExecutor";

const SYSTEM_PROMPT = `You are Todra's task assistant. You help users manage their todo list using the provided tools.
Be concise and confirm what you changed. Dates in tools use ISO 8601 when supplied.
If a task id is unknown, use list_tasks first.`;

const MAX_TOOL_ROUNDS = 10;

export type ToolTraceStep = {
  id: string;
  name: string;
  argumentsPretty: string;
  resultPretty: string;
};

export type UiChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      toolSteps?: ToolTraceStep[];
      isError?: boolean;
    };

function prettyFormat(raw: string): string {
  const t = raw.trim();
  try {
    return JSON.stringify(JSON.parse(t), null, 2);
  } catch {
    return t || "—";
  }
}

type LlmReply = { text: string; error?: string; toolTrace: ToolTraceStep[] };

const ANTHROPIC_VERSION = "2023-06-01";

function trimBase(url: string): string {
  return url.replace(/\/+$/, "");
}

function openAiCompatibleBase(config: AiUserConfig): string {
  const fixed = FIXED_BASE_URLS[config.providerId as keyof typeof FIXED_BASE_URLS];
  if (fixed) return trimBase(fixed);
  const b = (config.baseUrl || "").trim();
  return trimBase(b || "https://api.openai.com/v1");
}

function buildAzureChatUrl(config: AiUserConfig): string | null {
  const endpoint = trimBase(config.azureEndpoint || "");
  const dep = (config.azureDeployment || "").trim();
  const ver = (config.azureApiVersion || "2024-02-15-preview").trim();
  if (!endpoint || !dep) return null;
  return `${endpoint}/openai/deployments/${encodeURIComponent(
    dep
  )}/chat/completions?api-version=${encodeURIComponent(ver)}`;
}

type OpenAiToolCall = {
  id: string;
  type?: string;
  function: { name: string; arguments: string };
};

async function openAiStyleCompletion(
  url: string,
  apiKey: string,
  model: string,
  messages: unknown[],
  azure: boolean
): Promise<{
  message: {
    role: string;
    content: string | null;
    tool_calls?: OpenAiToolCall[];
  };
  rawError?: string;
}> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (azure) {
    headers["api-key"] = apiKey;
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages,
      tools: TODO_TOOLS_OPENAI,
      tool_choice: "auto",
      temperature: 0.3,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    return {
      message: { role: "assistant", content: null },
      rawError: text.slice(0, 800) || `HTTP ${res.status}`,
    };
  }

  let data: {
    choices?: Array<{
      message?: {
        role?: string;
        content?: string | null;
        tool_calls?: OpenAiToolCall[];
      };
    }>;
  };
  try {
    data = JSON.parse(text) as typeof data;
  } catch {
    return {
      message: { role: "assistant", content: null },
      rawError: "Invalid JSON from API",
    };
  }

  const message = data.choices?.[0]?.message;
  if (!message) {
    return {
      message: { role: "assistant", content: null },
      rawError: "Empty completion",
    };
  }
  return {
    message: {
      role: message.role ?? "assistant",
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    },
  };
}

function uiToOpenAiMessages(
  history: UiChatMessage[],
  latestUser: string
): { role: string; content: string }[] {
  const out: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];
  for (const m of history) {
    if (m.role === "user") {
      out.push({ role: "user", content: m.content });
    } else {
      out.push({ role: "assistant", content: m.content });
    }
  }
  out.push({ role: "user", content: latestUser });
  return out;
}

async function runOpenAiStyleLoop(
  config: AiUserConfig,
  apiKey: string,
  history: UiChatMessage[],
  userText: string,
  azure: boolean,
  onToolRound?: () => void
): Promise<LlmReply> {
  const toolTrace: ToolTraceStep[] = [];
  let traceSeq = 0;
  const recordTool = (name: string, argsRaw: string, resultRaw: string) => {
    toolTrace.push({
      id: `tc_${traceSeq++}_${Date.now()}`,
      name,
      argumentsPretty: prettyFormat(argsRaw),
      resultPretty: prettyFormat(resultRaw),
    });
    onToolRound?.();
  };

  let url: string;
  let model = (config.model || "").trim();
  if (azure) {
    const u = buildAzureChatUrl(config);
    if (!u) {
      return {
        text: "",
        error: "Azure: set resource endpoint and deployment name.",
        toolTrace: [],
      };
    }
    url = u;
    if (!model) model = config.azureDeployment.trim();
  } else {
    url = `${openAiCompatibleBase(config)}/chat/completions`;
    if (!model) model = "gpt-4o-mini";
  }

  const messages: unknown[] = uiToOpenAiMessages(history, userText);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { message, rawError } = await openAiStyleCompletion(
      url,
      apiKey,
      model,
      messages,
      azure
    );
    if (rawError) return { text: "", error: rawError, toolTrace };

    const toolCalls = message.tool_calls;
    if (toolCalls?.length) {
      messages.push({
        role: "assistant",
        content: message.content ?? null,
        tool_calls: toolCalls,
      });
      for (const tc of toolCalls) {
        const name = tc.function?.name;
        const argStr = tc.function?.arguments ?? "{}";
        if (!name) continue;
        const result = await executeTodoTool(name, argStr);
        recordTool(name, argStr, result);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
      continue;
    }

    const text = (message.content || "").trim();
    return {
      text: text || "(No response text)",
      toolTrace,
    };
  }

  return { text: "", error: "Too many tool rounds.", toolTrace };
}

const ANTHROPIC_TOOLS = TODO_TOOLS_OPENAI.map((t) => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters,
}));

type AnthropicMsg = {
  role: "user" | "assistant";
  content: unknown;
};

async function anthropicOnce(
  apiKey: string,
  model: string,
  messages: AnthropicMsg[]
): Promise<{
  stop_reason?: string;
  content?: unknown[];
  rawError?: string;
}> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: ANTHROPIC_TOOLS,
      messages,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    return { rawError: text.slice(0, 800) || `HTTP ${res.status}` };
  }
  try {
    const data = JSON.parse(text) as {
      stop_reason?: string;
      content?: unknown[];
    };
    return { stop_reason: data.stop_reason, content: data.content };
  } catch {
    return { rawError: "Invalid JSON from Anthropic" };
  }
}

function uiToAnthropicSeed(
  history: UiChatMessage[],
  userText: string
): AnthropicMsg[] {
  const messages: AnthropicMsg[] = [];
  for (const m of history) {
    messages.push({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    });
  }
  messages.push({
    role: "user",
    content: [{ type: "text", text: userText }],
  });
  return messages;
}

async function runAnthropicLoop(
  config: AiUserConfig,
  apiKey: string,
  history: UiChatMessage[],
  userText: string,
  onToolRound?: () => void
): Promise<LlmReply> {
  const toolTrace: ToolTraceStep[] = [];
  let traceSeq = 0;
  const recordTool = (name: string, argsRaw: string, resultRaw: string) => {
    toolTrace.push({
      id: `tc_${traceSeq++}_${Date.now()}`,
      name,
      argumentsPretty: prettyFormat(argsRaw),
      resultPretty: prettyFormat(resultRaw),
    });
    onToolRound?.();
  };

  const model = (config.model || "claude-sonnet-4-20250514").trim();
  let messages = uiToAnthropicSeed(history, userText);

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { stop_reason, content, rawError } = await anthropicOnce(
      apiKey,
      model,
      messages
    );
    if (rawError) return { text: "", error: rawError, toolTrace };
    if (!content?.length) {
      return { text: "", error: "Empty Anthropic response", toolTrace };
    }

    const toolUses = content.filter(
      (b) => (b as { type?: string }).type === "tool_use"
    ) as Array<{ type: string; id: string; name: string; input: unknown }>;

    if (stop_reason === "tool_use" && toolUses.length) {
      messages.push({ role: "assistant", content });
      const toolResults = [];
      for (const tu of toolUses) {
        const argsJson = JSON.stringify(tu.input ?? {});
        const result = await executeTodoTool(tu.name, argsJson);
        recordTool(tu.name, argsJson, result);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: result,
        });
      }
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    const textParts = content
      .filter((b) => (b as { type?: string }).type === "text")
      .map((b) => (b as { text?: string }).text || "")
      .join("")
      .trim();
    return { text: textParts || "(No response text)", toolTrace };
  }

  return { text: "", error: "Too many tool rounds.", toolTrace };
}

// --- Gemini ---

function geminiTypeMap(schema: Record<string, unknown>): Record<string, unknown> {
  const t = schema.type as string;
  if (t === "object") {
    const props = schema.properties as Record<string, unknown> | undefined;
    const out: Record<string, unknown> = { type: "OBJECT" };
    if (props) {
      out.properties = Object.fromEntries(
        Object.entries(props).map(([k, v]) => [
          k,
          geminiTypeMap(v as Record<string, unknown>),
        ])
      );
    }
    if (Array.isArray(schema.required)) {
      out.required = schema.required;
    }
    return out;
  }
  if (t === "string") {
    const en = (schema as { enum?: string[] }).enum;
    if (Array.isArray(en) && en.length) {
      return { type: "STRING", enum: en };
    }
    return { type: "STRING" };
  }
  if (t === "boolean") return { type: "BOOLEAN" };
  if (t === "number" || t === "integer") return { type: "NUMBER" };
  return { type: "STRING" };
}

function buildGeminiFunctionDeclarations() {
  return TODO_TOOLS_OPENAI.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    parameters: geminiTypeMap(
      tool.function.parameters as unknown as Record<string, unknown>
    ),
  }));
}

async function geminiGenerate(
  apiKey: string,
  model: string,
  body: Record<string, unknown>
): Promise<{ data: Record<string, unknown>; error?: string }> {
  const m = model.startsWith("models/") ? model : `models/${model}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/${m}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    return { data: {}, error: text.slice(0, 800) || `HTTP ${res.status}` };
  }
  try {
    return { data: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return { data: {}, error: "Invalid JSON from Gemini" };
  }
}

function extractGeminiText(candidate: Record<string, unknown>): string {
  const content = candidate.content as { parts?: unknown[] } | undefined;
  const parts = content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((p) => {
      const part = p as { text?: string };
      return typeof part.text === "string" ? part.text : "";
    })
    .join("")
    .trim();
}

function extractGeminiFunctionCalls(
  candidate: Record<string, unknown>
): Array<{ name: string; args: Record<string, unknown> }> {
  const content = candidate.content as { parts?: unknown[] } | undefined;
  const parts = content?.parts;
  if (!Array.isArray(parts)) return [];
  const out: Array<{ name: string; args: Record<string, unknown> }> = [];
  for (const p of parts) {
    const part = p as { functionCall?: { name?: string; args?: unknown } };
    if (part.functionCall?.name) {
      const args =
        typeof part.functionCall.args === "object" &&
        part.functionCall.args !== null
          ? (part.functionCall.args as Record<string, unknown>)
          : {};
      out.push({ name: part.functionCall.name, args });
    }
  }
  return out;
}

function uiToGeminiContents(history: UiChatMessage[], userText: string) {
  const contents: { role: string; parts: unknown[] }[] = [];
  for (const m of history) {
    contents.push({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: userText }] });
  return contents;
}

async function runGeminiLoop(
  config: AiUserConfig,
  apiKey: string,
  history: UiChatMessage[],
  userText: string,
  onToolRound?: () => void
): Promise<LlmReply> {
  const toolTrace: ToolTraceStep[] = [];
  let traceSeq = 0;
  const recordTool = (name: string, argsRaw: string, resultRaw: string) => {
    toolTrace.push({
      id: `tc_${traceSeq++}_${Date.now()}`,
      name,
      argumentsPretty: prettyFormat(argsRaw),
      resultPretty: prettyFormat(resultRaw),
    });
    onToolRound?.();
  };

  const model = (config.model || "gemini-2.0-flash").replace(
    /^models\//,
    ""
  );
  let contents = uiToGeminiContents(history, userText);

  const tools = [{ functionDeclarations: buildGeminiFunctionDeclarations() }];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { data, error } = await geminiGenerate(apiKey, model, {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      tools,
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
    });
    if (error) return { text: "", error: error, toolTrace };

    const candidates = data.candidates as Record<string, unknown>[] | undefined;
    const candidate = candidates?.[0] as Record<string, unknown> | undefined;
    if (!candidate) {
      return { text: "", error: "No candidates from Gemini", toolTrace };
    }

    const calls = extractGeminiFunctionCalls(candidate);
    const textOut = extractGeminiText(candidate);

    if (calls.length) {
      contents.push({
        role: "model",
        parts: calls.map((c) => ({
          functionCall: { name: c.name, args: c.args },
        })),
      });
      const responseParts = [];
      for (const c of calls) {
        const argsJson = JSON.stringify(c.args);
        const result = await executeTodoTool(c.name, argsJson);
        recordTool(c.name, argsJson, result);
        let responseObj: Record<string, unknown>;
        try {
          responseObj = JSON.parse(result) as Record<string, unknown>;
        } catch {
          responseObj = { output: result };
        }
        responseParts.push({
          functionResponse: {
            name: c.name,
            response: responseObj,
          },
        });
      }
      contents.push({ role: "user", parts: responseParts });
      continue;
    }

    return { text: textOut || "(No response text)", toolTrace };
  }

  return { text: "", error: "Too many tool rounds.", toolTrace };
}

export async function runAssistantReply(
  config: AiUserConfig,
  apiKey: string,
  history: UiChatMessage[],
  userText: string,
  onToolRound?: () => void
): Promise<LlmReply> {
  const key = apiKey.trim();
  if (!key) {
    return {
      text: "",
      error: "Add an API key in AI assistant settings.",
      toolTrace: [],
    };
  }

  const id = config.providerId as AiProviderId;

  try {
    if (id === "anthropic") {
      return await runAnthropicLoop(config, key, history, userText, onToolRound);
    }
    if (id === "google_gemini") {
      return await runGeminiLoop(config, key, history, userText, onToolRound);
    }
    if (id === "azure_openai") {
      return await runOpenAiStyleLoop(
        config,
        key,
        history,
        userText,
        true,
        onToolRound
      );
    }
    return await runOpenAiStyleLoop(
      config,
      key,
      history,
      userText,
      false,
      onToolRound
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Request failed";
    return { text: "", error: msg, toolTrace: [] };
  }
}
