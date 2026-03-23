import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { typography } from "../../typography";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AddTaskMoreOptionsProps = {
  initiallyExpanded: boolean;
  children: React.ReactNode;
};

const AddTaskMoreOptions: React.FC<AddTaskMoreOptionsProps> = ({
  initiallyExpanded,
  children,
}) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(initiallyExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.outer}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? "Hide more options" : "Show more options"}
        accessibilityHint="Category, priority, reminders, repeat, and prerequisites"
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        style={[
          styles.header,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}>
        <Text style={[typography.bodySemiBold, { color: colors.text, flex: 1 }]}>
          More options
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    marginBottom: SIZES.extraLarge,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.base,
    borderWidth: 1,
  },
  body: {
    paddingTop: SIZES.medium,
  },
});

export default AddTaskMoreOptions;
