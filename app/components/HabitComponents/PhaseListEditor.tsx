import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { RADII } from "../../theme";
import { typography } from "../../typography";

type Props = {
  phases: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const PhaseListEditor: React.FC<Props> = ({
  phases,
  onChange,
  onAdd,
  onRemove,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {phases.map((phase, index) => (
        <View
          key={`phase-${index}`}
          style={[
            styles.row,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}>
          <Text style={[typography.captionSemiBold, { color: colors.textSecondary }]}>
            {index + 1}.
          </Text>
          <TextInput
            value={phase}
            onChangeText={(t) => onChange(index, t)}
            placeholder="Phase name"
            placeholderTextColor={colors.textSecondary}
            style={[
              typography.body,
              styles.input,
              { color: colors.text },
            ]}
          />
          <TouchableOpacity
            onPress={() => onRemove(index)}
            hitSlop={12}
            accessibilityLabel={`Remove phase ${index + 1}`}
            accessibilityRole="button"
            disabled={phases.length <= 1}>
            <Ionicons
              name="trash-outline"
              size={20}
              color={phases.length <= 1 ? colors.disabled : colors.error}
            />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.addBtn, { borderColor: colors.primary }]}
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Add phase">
        <Ionicons name="add" size={22} color={colors.primary} />
        <Text style={[typography.bodySemiBold, { color: colors.primary }]}>
          Add phase
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 40,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
});

export default PhaseListEditor;
