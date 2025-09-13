import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useCallback } from "react";
import { Alert, Platform, Share } from "react-native";
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
        const baseDir =
          (FileSystem as any).cacheDirectory ||
          (FileSystem as any).documentDirectory ||
          "";
        const filePath = `${baseDir}${fileName}`;
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
      // Expo SDK 53: getDocumentAsync returns { assets?: [{ uri, name, size, mimeType }], canceled }
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if ((result as any).canceled) return;

      const asset = (result as any).assets?.[0];
      const uri = asset?.uri || (result as any).uri; // fallback for older shapes
      if (!uri) throw new Error("No file selected");

      const fileContent = await FileSystem.readAsStringAsync(uri);

      // Ask user how to import
      Alert.alert("Import Data", "How would you like to import the data?", [
        {
          text: "Merge",
          onPress: async () => {
            const ok = await importData(fileContent, "merge");
            if (ok) {
              Alert.alert("Done", "Data merged successfully.");
            } else {
              Alert.alert("Import Failed", "Could not merge data.");
            }
          },
        },
        {
          text: "Replace",
          style: "destructive",
          onPress: async () => {
            const ok = await importData(fileContent, "replace");
            if (ok) {
              Alert.alert("Done", "Data replaced successfully.");
            } else {
              Alert.alert("Import Failed", "Could not replace data.");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]);
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

  return {
    handleViewAllTasks,
    handleViewArchivedTasks,
    handleExportData,
    handleImportData,
    handleClearAllTasks,
  };
};
