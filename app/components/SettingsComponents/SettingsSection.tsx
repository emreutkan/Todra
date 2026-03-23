import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { typography } from "../../typography";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.section,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}>
      <Text
        style={[
          typography.headline,
          styles.sectionTitle,
          { color: colors.textSecondary },
        ]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    marginBottom: 16,
  },
});

export default SettingsSection;

