import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useCallback } from "react";
import { Alert, Linking, Platform, Share } from "react-native";
import { useSettings } from "../context/SettingsContext";
import { RootStackParamList } from "../types";

type SettingsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

export const useSettingsActions = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { exportData, importData, clearAllTasks } = useSettings();

  const handleViewAllTasks = useCallback(() => {
    navigation.navigate("AllTasks");
  }, [navigation]);

  const handleViewArchivedTasks = useCallback(() => {
    navigation.navigate("ArchivedTasks");
  }, [navigation]);

  const handleExportData = useCallback(async () => {
    try {
      // Get the exported data
      const data = await exportData();

      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `TaskPlanner_Backup_${timestamp}.json`;

      // On Android, write to a temporary file first
      if (Platform.OS === "android") {
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, data);

        // Share the file
        const shareResult = await Share.share({
          title: "Task Planner Data Export",
          url: filePath,
        });

        if (shareResult.action === Share.sharedAction) {
          Alert.alert("Success", "Your data has been successfully exported!");
        }
      }
      // On iOS, share content directly
      else {
        const shareResult = await Share.share({
          title: "Task Planner Data Export",
          message: data,
        });

        if (shareResult.action === Share.sharedAction) {
          Alert.alert("Success", "Your data has been successfully exported!");
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        "There was a problem exporting your data. Please try again."
      );
    }
  }, [exportData]);

  const handleImportData = useCallback(async () => {
    try {
      // Open document picker to select a JSON file
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if ((result as any).type === "success") {
        // Read the file content
        const fileContent = await FileSystem.readAsStringAsync(
          (result as any).uri
        );
        const success = await importData(fileContent);

        if (success) {
          Alert.alert(
            "Import Successful",
            "Your data has been successfully imported. The app will refresh to show the imported data."
          );
        } else {
          Alert.alert(
            "Import Failed",
            "There was a problem with the file format. Please ensure you're using a valid TaskPlanner backup file."
          );
        }
      }
    } catch (error) {
      Alert.alert(
        "Import Failed",
        "There was a problem importing your data. Please try again."
      );
    }
  }, [importData]);

  const handleClearAllTasks = useCallback(() => {
    Alert.alert(
      "Clear All Tasks",
      "Are you sure you want to delete all tasks? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            const success = await clearAllTasks();
            if (success) {
              Alert.alert("Success", "All tasks have been deleted.");
            } else {
              Alert.alert("Error", "Failed to delete tasks. Please try again.");
            }
          },
        },
      ]
    );
  }, [clearAllTasks]);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL("https://yourapp.com/privacy-policy");
  }, []);

  const handleTermsOfService = useCallback(() => {
    Linking.openURL("https://yourapp.com/terms-of-service");
  }, []);

  const handleSendFeedback = useCallback(() => {
    Linking.openURL(
      "mailto:support@yourapp.com?subject=TaskPlanner%20Feedback"
    );
  }, []);

  return {
    handleViewAllTasks,
    handleViewArchivedTasks,
    handleExportData,
    handleImportData,
    handleClearAllTasks,
    handlePrivacyPolicy,
    handleTermsOfService,
    handleSendFeedback,
  };
};
