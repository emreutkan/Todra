import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { MarkdownMessage } from "../components/AiChat/MarkdownMessage";
import { ToolTraceSection } from "../components/AiChat/ToolTraceSection";
import { useTheme } from "../context/ThemeContext";
import { getAiApiKey, loadAiConfig } from "../services/aiSettingsStorage";
import { runAssistantReply, UiChatMessage } from "../services/llm/chatAgent";
import { AiUserConfig } from "../types/ai";
import { RADII } from "../theme";
import { RootStackParamList } from "../types";
import { FONT, typography } from "../typography";

type Nav = NativeStackNavigationProp<RootStackParamList, "AiAssistant">;

function makeId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const WELCOME: UiChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi — I can **list**, **create**, **update**, **delete**, and **archive** your tasks.\n\n" +
    "Your setup is **BYOK** (bring your own key): open the gear, pick a provider, and save your API key. " +
    "It stays in **SecureStore** on this device only.\n\n" +
    "When I use a tool, tap the row to see the **request** and **result**.",
};

const AiAssistantScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<UiChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState<AiUserConfig | null>(null);
  const [apiKeyPresent, setApiKeyPresent] = useState(false);

  const reloadConnection = useCallback(async () => {
    const [c, k] = await Promise.all([loadAiConfig(), getAiApiKey()]);
    setConfig(c);
    setApiKeyPresent(Boolean(k?.trim()));
  }, []);

  useEffect(() => {
    reloadConnection();
  }, [reloadConnection]);

  useEffect(() => {
    const unsub = navigation.addListener("focus", () => {
      reloadConnection();
    });
    return unsub;
  }, [navigation, reloadConnection]);

  const send = useCallback(async () => {
    const userText = input.trim();
    if (!userText || sending) return;
    setInput("");
    const userMsg: UiChatMessage = {
      id: makeId(),
      role: "user",
      content: userText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const cfg = config ?? (await loadAiConfig());
      const key = (await getAiApiKey()) || "";
      const { text, error, toolTrace } = await runAssistantReply(
        cfg,
        key,
        messages,
        userText
      );
      const hasTools = toolTrace.length > 0;
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: error || text,
          toolSteps: hasTools ? toolTrace : undefined,
          isError: Boolean(error),
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: msg,
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [config, input, messages, sending]);

  useEffect(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    );
  }, [messages, sending]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.background, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <StatusBar style={isDark ? "light" : "dark"} />

      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[typography.title, { color: colors.text, textAlign: "center" }]}>
            Assistant
          </Text>
          <View style={styles.byokRow}>
            <View style={[styles.byokPill, { backgroundColor: colors.primaryMuted }]}>
              <Text style={[typography.overline, { color: colors.primary, letterSpacing: 1 }]}>
                BYOK
              </Text>
            </View>
            <Text
              style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}
              numberOfLines={1}>
              Your key · your provider
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate("AiSettings")}
          accessibilityLabel="AI settings">
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {!apiKeyPresent && (
        <TouchableOpacity
          style={[
            styles.banner,
            {
              backgroundColor: colors.warning + "28",
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => navigation.navigate("AiSettings")}
          activeOpacity={0.88}>
          <View style={[styles.bannerIcon, { backgroundColor: colors.card }]}>
            <Ionicons name="key-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={[typography.subbodySemiBold, { color: colors.text }]}>
              Connect your API key
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              Open AI connection — stored only on this device.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 72}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {messages.map((m) =>
            m.role === "user" ? (
              <View key={m.id} style={[styles.row, styles.rowUser]}>
                <View
                  style={[
                    styles.userBubble,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.primary,
                      shadowColor: colors.shadowColor,
                    },
                  ]}>
                  <Text style={[typography.body, { color: colors.text }]}>{m.content}</Text>
                </View>
              </View>
            ) : (
              <View key={m.id} style={[styles.row, styles.rowAssistant]}>
                <View style={styles.assistantTrack}>
                  <View style={[styles.assistantRail, { backgroundColor: colors.accent }]} />
                  <View
                    style={[
                      styles.assistantBubble,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}>
                    {m.isError ? (
                      <View>
                        <Text style={[typography.subbodySemiBold, { color: colors.error }]}>
                          Something went wrong
                        </Text>
                        <Text
                          selectable
                          style={[
                            typography.caption,
                            {
                              color: colors.textSecondary,
                              marginTop: 8,
                              fontFamily: FONT.body,
                            },
                          ]}>
                          {m.content}
                        </Text>
                      </View>
                    ) : (
                      <MarkdownMessage
                        content={m.content}
                        colors={colors}
                        isDark={isDark}
                      />
                    )}
                    {m.toolSteps && m.toolSteps.length > 0 && (
                      <ToolTraceSection steps={m.toolSteps} colors={colors} />
                    )}
                  </View>
                </View>
              </View>
            )
          )}
          {sending && (
            <View style={styles.typingBlock}>
              <View style={[styles.typingDots, { backgroundColor: colors.surface }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[typography.captionMedium, { color: colors.textSecondary }]}>
                  Working on your tasks…
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.composerShell,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
          <View
            style={[
              styles.composerInner,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your tasks…"
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={4000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendFab,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.shadowColor,
                },
                (!input.trim() || sending) && styles.sendFabDisabled,
              ]}
              onPress={send}
              disabled={!input.trim() || sending}
              accessibilityLabel="Send message">
              <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  byokRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    maxWidth: "100%",
  },
  byokPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  iconBtn: { padding: 10, width: 46, alignItems: "center" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: RADII.md,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 28 },
  row: { marginBottom: 18 },
  rowUser: { alignItems: "flex-end" },
  rowAssistant: { alignItems: "flex-start" },
  userBubble: {
    maxWidth: "86%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderBottomRightRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  assistantTrack: {
    maxWidth: "92%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  assistantRail: {
    width: 4,
    borderRadius: 3,
    marginRight: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  assistantBubble: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderTopLeftRadius: 6,
  },
  typingBlock: { alignItems: "flex-start", marginBottom: 8 },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  composerShell: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  composerInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 22,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    fontFamily: FONT.body,
    fontSize: 16,
    lineHeight: 22,
  },
  sendFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sendFabDisabled: { opacity: 0.38 },
});

export default AiAssistantScreen;
