import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
interface ActionButtonProps {
  onPress: () => void;
  styles?: StyleSheet.NamedStyles<any>;
  text?: string;
  icon?: boolean;
  iconName?: string;
  pressAnimation?: boolean;
  customPressInAnimation?: () => void;
  customPressOutAnimation?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  styles,
  text,
  icon,
  iconName,
  pressAnimation,

  customPressInAnimation,
  customPressOutAnimation,
}) => {
  const { colors } = useTheme();

  const handlePress = () => {
    if (pressAnimation) {
      customPressInAnimation?.();
    } else {
      onPress();
    }
  };

  const handlePressIn = () => {
    if (pressAnimation) {
      customPressInAnimation?.();
    } else {
      onPress();
    }
  };

  const handlePressOut = () => {
    if (pressAnimation) {
      customPressOutAnimation?.();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles, actionButtonStyles.container]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      {icon && (
        <View style={actionButtonStyles.icon}>
          <Ionicons
            name={iconName as any}
            size={SIZES.small}
            color={colors.onPrimary}
          />
        </View>
      )}
      {text && (
        <Text style={[actionButtonStyles.text, { color: colors.primary }]}>
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const actionButtonStyles = StyleSheet.create({
  container: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 62,
    justifyContent: "center",
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: SIZES.small,
    fontWeight: "600",
  },
});

export default ActionButton;
