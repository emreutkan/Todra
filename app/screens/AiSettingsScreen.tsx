import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  PRESET_DEFAULT_MODEL,
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
  }, []);

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
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
              onPress={() => setProviderMenuOpen((o) => !o)}>
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
              <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>
                Base URL only, e.g. https://api.openai.com/v1 or your proxy. No trailing slash
                required.
              </Text>
              <TextInput
                style={inputStyle}
                value={config.baseUrl}
                onChangeText={(baseUrl) => setConfig((c) => ({ ...c, baseUrl }))}
                placeholder="https://..."
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  scrollContent: { padding: 16, paddingBottom: 40 },
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
  saveBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
});

export default AiSettingsScreen;
