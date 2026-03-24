import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SettingsListRow from "../components/SettingsComponents/SettingsListRow";
import SettingsSection from "../components/SettingsComponents/SettingsSection";
import SettingsToggle from "../components/SettingsComponents/SettingsToggle";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import { useSettingsActions } from "../hooks/useSettingsActions";
import { RootStackParamList } from "../types";
import { typography } from "../typography";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, updateSetting } = useSettings();
  const {
    handleViewAllTasks,
    handleViewArchivedTasks,
    handleExportData,
    handleImportData,
    handleClearAllTasks,
  } = useSettingsActions();

  const handleBackPress = () => {
    navigation.goBack();
  };

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
          onPress={handleBackPress}
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Navigate to the previous screen">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[typography.title, styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Notifications Section */}
        <SettingsSection title="Notifications">
          <SettingsToggle
            icon="notifications-outline"
            label="Enable Notifications"
            value={settings.notificationsEnabled}
            onValueChange={(value) =>
              updateSetting("notificationsEnabled", value)
            }
          />
          <SettingsToggle
            icon="volume-medium-outline"
            label="Sound Effects"
            value={settings.soundEnabled}
            onValueChange={(value) => updateSetting("soundEnabled", value)}
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          <SettingsToggle
            icon="moon"
            label="Dark Mode"
            value={settings.darkModeEnabled}
            onValueChange={(value) => updateSetting("darkModeEnabled", value)}
          />
          {settings.darkModeEnabled && (
            <SettingsToggle
              icon="contrast-outline"
              label="OLED black"
              value={settings.darkUseOledBlack}
              onValueChange={(value) =>
                updateSetting("darkUseOledBlack", value)
              }
            />
          )}
          <SettingsToggle
            icon="trash-outline"
            label="Confirm Before Delete"
            value={settings.confirmDeleteEnabled}
            onValueChange={(value) =>
              updateSetting("confirmDeleteEnabled", value)
            }
          />
          <SettingsToggle
            icon="archive-outline"
            label="Auto-Archive Completed Tasks"
            value={settings.autoArchiveEnabled}
            onValueChange={(value) =>
              updateSetting("autoArchiveEnabled", value)
            }
          />
          <SettingsToggle
            icon="eye-outline"
            label="Show Completed Tasks"
            value={settings.showCompletedTasks}
            onValueChange={(value) =>
              updateSetting("showCompletedTasks", value)
            }
          />
        </SettingsSection>

        {/* AI */}
        <SettingsSection title="AI assistant">
          <SettingsListRow
            icon="chatbubble-ellipses-outline"
            label="AI assistant"
            onPress={() => navigation.navigate("AiAssistant")}
          />
        </SettingsSection>

        {/* Data Management Section */}
        <SettingsSection title="Data Management">
          <SettingsListRow
            icon="list-outline"
            label="View All Tasks"
            onPress={handleViewAllTasks}
          />
          <SettingsListRow
            icon="archive-outline"
            label="View Archived Tasks"
            onPress={handleViewArchivedTasks}
            marginTop={8}
          />
          <SettingsListRow
            icon="download-outline"
            label="Export Data"
            onPress={handleExportData}
            marginTop={8}
          />
          <SettingsListRow
            icon="cloud-upload-outline"
            label="Import Data"
            onPress={handleImportData}
            marginTop={8}
          />
          <SettingsListRow
            icon="trash-bin-outline"
            label="Clear All Tasks"
            onPress={handleClearAllTasks}
            isDestructive
            marginTop={8}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
});

export default SettingsScreen;
