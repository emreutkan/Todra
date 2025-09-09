import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

interface InfoRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isButton?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  onPress,
  isButton = false,
}) => {
  const { colors } = useTheme();

  if (isButton && onPress) {
    return (
      <TouchableOpacity style={styles.infoButton} onPress={onPress}>
        <Text style={[styles.infoButtonText, { color: colors.primary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  infoButton: {
    paddingVertical: 8,
  },
  infoButtonText: {
    fontSize: 16,
  },
});

export default InfoRow;
