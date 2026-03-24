import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SettingsSection from "../components/SettingsComponents/SettingsSection";
import { useTheme } from "../context/ThemeContext";
import {
  clearAiApiKey,
  getAiApiKey,
  loadAiConfig,
  saveAiConfig,
  setAiApiKey,
} from "../services/aiSettingsStorage";
import {
  AI_PROVIDER_LABELS,
  AiProviderId,
  AiUserConfig,
  DEFAULT_AI_CONFIG,
  OPENAI_COMPATIBLE_ENDPOINT_PRESETS,
  PRESET_DEFAULT_MODEL,
  normalizeOpenAiCompatibleBaseUrl,
} from "../types/ai";
import { RADII } from "../theme";
import { RootStackParamList } from "../types";
import { typography } from "../typography";

type Nav = NativeStackNavigationProp<RootStackParamList, "AiSettings">;

const PROVIDER_ORDER: AiProviderId[] = [
  "openai_compatible",
  "openai",
  "anthropic",
  "google_gemini",
  "azure_openai",
  "groq",
  "mistral",
];

const AiSettingsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AiUserConfig>(DEFAULT_AI_CONFIG);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [endpointPresetMenuOpen, setEndpointPresetMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await loadAiConfig();
      const k = await getAiApiKey();
      if (!cancelled) {
        setConfig(c);
        setApiKeyInput(k || "");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyProvider = useCallback((pid: AiProviderId) => {
    setConfig((prev) => ({
      ...prev,
      providerId: pid,
      model: PRESET_DEFAULT_MODEL[pid] ?? prev.model,
    }));
    setProviderMenuOpen(false);
    setEndpointPresetMenuOpen(false);
  }, []);

  const endpointPresetSummary = useMemo(() => {
    if (config.providerId !== "openai_compatible") return { label: "", subtitle: "" };
    const match = OPENAI_COMPATIBLE_ENDPOINT_PRESETS.find(
      (p) =>
        normalizeOpenAiCompatibleBaseUrl(config.baseUrl) ===
        normalizeOpenAiCompatibleBaseUrl(p.url)
    );
    if (match) {
      return { label: match.label, subtitle: match.url };
    }
    return {
      label: "Custom URL",
      subtitle: (config.baseUrl || "").trim() || "Enter a base URL below",
    };
  }, [config.baseUrl, config.providerId]);

  const applyEndpointPreset = useCallback(
    (preset: (typeof OPENAI_COMPATIBLE_ENDPOINT_PRESETS)[number]) => {
      setConfig((prev) => ({
        ...prev,
        baseUrl: preset.url,
        model: preset.suggestedModel ?? prev.model,
      }));
      setEndpointPresetMenuOpen(false);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (config.providerId === "openai_compatible") {
      const b = (config.baseUrl || "").trim();
      if (!b) {
        Alert.alert("Base URL required", "Enter the OpenAI-compatible API base URL.");
        return;
      }
    }
    if (config.providerId === "azure_openai") {
      if (!(config.azureEndpoint || "").trim() || !(config.azureDeployment || "").trim()) {
        Alert.alert(
          "Azure fields required",
          "Enter the resource endpoint (e.g. https://your-resource.openai.azure.com) and deployment name."
        );
        return;
      }
    }

    setSaving(true);
    try {
      await saveAiConfig(config);
      await setAiApiKey(apiKeyInput);
      Alert.alert("Saved", "Your AI settings were saved.");
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }, [apiKeyInput, config]);

  const handleClearKey = useCallback(() => {
    Alert.alert(
      "Remove API key?",
      "The key will be deleted from secure storage on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await clearAiApiKey();
            setApiKeyInput("");
          },
        },
      ]
    );
  }, []);

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[typography.title, styles.headerTitle, { color: colors.text }]}>
          AI connection
        </Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.privacyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
            <Text style={[typography.bodySemiBold, { color: colors.text }]}>
              Your key stays on this device
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              Your API key is stored only on this phone using the system secure storage
              (iOS Keychain / Android Keystore via Expo SecureStore). Todra does not send
              your key to our servers—the app talks directly to the provider you pick.
              Avoid sharing your device with others if your key must stay private.
            </Text>
          </View>

          <SettingsSection title="Provider">
            <TouchableOpacity
              style={[
                styles.selectRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                setProviderMenuOpen((o) => !o);
                setEndpointPresetMenuOpen(false);
              }}>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {AI_PROVIDER_LABELS[config.providerId]}
              </Text>
              <Ionicons
                name={providerMenuOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {providerMenuOpen && (
              <View style={[styles.menu, { borderColor: colors.border }]}>
                {PROVIDER_ORDER.map((pid) => (
                  <TouchableOpacity
                    key={pid}
                    style={[
                      styles.menuRow,
                      {
                        backgroundColor:
                          config.providerId === pid ? colors.card : colors.surface,
                      },
                    ]}
                    onPress={() => applyProvider(pid)}>
                    <Text style={[typography.body, { color: colors.text }]}>
                      {AI_PROVIDER_LABELS[pid]}
                    </Text>
                    {config.providerId === pid && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </SettingsSection>

          <SettingsSection title="API key">
            <TextInput
              style={inputStyle}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Paste your API key"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={handleClearKey} style={styles.clearKey}>
              <Text style={[typography.caption, { color: colors.destructiveText }]}>
                Remove key from device
              </Text>
            </TouchableOpacity>
          </SettingsSection>

          {config.providerId === "openai_compatible" && (
            <SettingsSection title="OpenAI-compatible endpoint">
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 10 }]}>
                Base URL only — no trailing slash. Requests go to your base plus /chat/completions.
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, marginBottom: 6 },
                ]}>
                Endpoint preset
              </Text>
              <TouchableOpacity
                style={[
                  styles.selectRow,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => {
                  setEndpointPresetMenuOpen((o) => !o);
                  setProviderMenuOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Choose OpenAI-compatible endpoint preset"
                accessibilityState={{ expanded: endpointPresetMenuOpen }}>
                <View style={styles.endpointSelectText}>
                  <Text style={[typography.bodySemiBold, { color: colors.text }]}>
                    {endpointPresetSummary.label}
                  </Text>
                  <Text
                    style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
                    numberOfLines={2}
                    selectable>
                    {endpointPresetSummary.subtitle}
                  </Text>
                </View>
                <Ionicons
                  name={endpointPresetMenuOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {endpointPresetMenuOpen && (
                <View style={[styles.menu, { borderColor: colors.border, marginTop: 8 }]}>
                  {OPENAI_COMPATIBLE_ENDPOINT_PRESETS.map((preset) => {
                    const selected =
                      normalizeOpenAiCompatibleBaseUrl(config.baseUrl) ===
                      normalizeOpenAiCompatibleBaseUrl(preset.url);
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.menuRow,
                          styles.endpointMenuRow,
                          {
                            backgroundColor: selected ? colors.card : colors.surface,
                          },
                        ]}
                        onPress={() => applyEndpointPreset(preset)}
                        accessibilityRole="button"
                        accessibilityLabel={`${preset.label}, ${preset.url}`}
                        accessibilityState={{ selected }}>
                        <View style={styles.endpointMenuRowText}>
                          <Text style={[typography.body, { color: colors.text }]}>
                            {preset.label}
                          </Text>
                          <Text
                            style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
                            numberOfLines={2}
                            selectable>
                            {preset.url}
                          </Text>
                        </View>
                        {selected ? (
                          <Ionicons name="checkmark" size={20} color={colors.primary} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              <Text
                style={[
                  typography.caption,
                  { color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
                ]}>
                Base URL (editable)
              </Text>
              <TextInput
                style={inputStyle}
                value={config.baseUrl}
                onChangeText={(baseUrl) => setConfig((c) => ({ ...c, baseUrl }))}
                placeholder="https://openrouter.ai/api/v1"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </SettingsSection>
          )}

          {(config.providerId === "openai" ||
            config.providerId === "groq" ||
            config.providerId === "mistral") && (
            <SettingsSection title="Endpoint">
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Using the official API URL for this provider. You only need your API key above.
              </Text>
            </SettingsSection>
          )}

          {config.providerId === "azure_openai" && (
            <SettingsSection title="Azure OpenAI">
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                Resource endpoint (Azure portal → Keys and endpoint).
              </Text>
              <TextInput
                style={[inputStyle, { marginBottom: 10 }]}
                value={config.azureEndpoint}
                onChangeText={(azureEndpoint) =>
                  setConfig((c) => ({ ...c, azureEndpoint }))
                }
                placeholder="https://your-resource.openai.azure.com"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                Deployment name
              </Text>
              <TextInput
                style={[inputStyle, { marginBottom: 10 }]}
                value={config.azureDeployment}
                onChangeText={(azureDeployment) =>
                  setConfig((c) => ({ ...c, azureDeployment }))
                }
                placeholder="my-gpt4-deployment"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                API version
              </Text>
              <TextInput
                style={inputStyle}
                value={config.azureApiVersion}
                onChangeText={(azureApiVersion) =>
                  setConfig((c) => ({ ...c, azureApiVersion }))
                }
                placeholder="2024-02-15-preview"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </SettingsSection>
          )}

          <SettingsSection title="Model">
            <TextInput
              style={inputStyle}
              value={config.model}
              onChangeText={(model) => setConfig((c) => ({ ...c, model }))}
              placeholder="Model id"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </SettingsSection>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.primary },
              saving && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text
                style={[
                  typography.bodySemiBold,
                  { color: colors.onPrimary },
                ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoid: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, textAlign: "center" },
  placeholder: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  privacyCard: {
    padding: 16,
    borderRadius: RADII.md,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: RADII.sm,
    borderWidth: 1,
  },
  menu: {
    marginTop: 8,
    borderRadius: RADII.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADII.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typography.body,
  },
  clearKey: { marginTop: 10, alignSelf: "flex-start" },
  endpointSelectText: { flex: 1, minWidth: 0, paddingRight: 8 },
  endpointMenuRow: { alignItems: "flex-start" },
  endpointMenuRowText: { flex: 1, minWidth: 0, paddingRight: 8 },
  saveBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
});

export default AiSettingsScreen;
