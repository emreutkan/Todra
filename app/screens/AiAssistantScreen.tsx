import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { useTheme } from "../context/ThemeContext";
import { getAiApiKey, loadAiConfig } from "../services/aiSettingsStorage";
import {
  runAssistantReply,
  UiChatMessage,
} from "../services/llm/chatAgent";
import { AiUserConfig } from "../types/ai";
import { RootStackParamList } from "../types";
import { typography } from "../typography";

type Nav = NativeStackNavigationProp<RootStackParamList, "AiAssistant">;

function makeId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const WELCOME: UiChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I can list, create, update, delete, and archive your tasks. Tap the gear to choose your provider and save your API key—your key stays on this device only.",
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
      const { text, error } = await runAssistantReply(
        cfg,
        key,
        messages,
        userText
      );
      const body = error ? `Something went wrong: ${error}` : text;
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: body },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          content: `Something went wrong: ${msg}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [config, input, messages, sending]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages, sending]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[typography.title, styles.headerTitle, { color: colors.text }]}>
          AI assistant
        </Text>
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
            { backgroundColor: colors.warning + "33", borderColor: colors.border },
          ]}
          onPress={() => navigation.navigate("AiSettings")}
          activeOpacity={0.85}>
          <Ionicons name="key-outline" size={18} color={colors.text} />
          <Text style={[typography.caption, { color: colors.text, flex: 1 }]}>
            Add an API key in AI connection settings to start chatting.
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubbleRow,
                m.role === "user" ? styles.bubbleRowUser : styles.bubbleRowAssistant,
              ]}>
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor:
                      m.role === "user" ? colors.primaryMuted : colors.surface,
                    borderColor: colors.border,
                  },
                ]}>
                <Text style={[typography.body, { color: colors.text }]}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}
          {sending && (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                Thinking…
              </Text>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.composer,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Message…"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={4000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: colors.primary },
              (!input.trim() || sending) && styles.sendDisabled,
            ]}
            onPress={send}
            disabled={!input.trim() || sending}
            accessibilityLabel="Send">
            <Ionicons name="arrow-up" size={22} color={colors.onPrimary} />
          </TouchableOpacity>
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
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, textAlign: "center" },
  iconBtn: { padding: 8, width: 44, alignItems: "center" },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  bubbleRow: { marginBottom: 12, flexDirection: "row" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAssistant: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 4,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typography.body,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.45 },
});

export default AiAssistantScreen;
