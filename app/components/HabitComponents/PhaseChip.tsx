import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { typography } from "../../typography";

type Props = {
  label: string;
  habitColor: string;
};

const PhaseChip: React.FC<Props> = ({ label, habitColor }) => {
  const { colors } = useTheme();
  if (!label) return null;

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: `${habitColor}26`,
          borderColor: `${habitColor}40`,
        },
      ]}>
      <Text style={[typography.captionSemiBold, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default PhaseChip;
