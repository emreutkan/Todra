import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import AddButton from "./AddButton";
import FilterButton from "./FilterButton";
import SettingsButton from "./SettingsButton";

const BottomNavigator = ({
  onFilterPress,
  onAddTaskPress,
  onSettingsPress,
}: {
  onFilterPress: () => void;
  onAddTaskPress: () => void;
  onSettingsPress: () => void;
}) => {
  const { colors } = useTheme();
  const bottomInsets = useSafeAreaInsets();
  return (
    <View style={[styles.wrapper, { marginBottom: bottomInsets.bottom }]}>
      <BlurView
        style={styles.container}
        intensity={100}
        tint="systemUltraThinMaterialLight">
        <SettingsButton onPress={onSettingsPress} showShadow={false} />
        <AddButton onPress={onAddTaskPress} showShadow={false} />
        <FilterButton onPress={onFilterPress} showShadow={false} />
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 100,
    overflow: "hidden",
    alignSelf: "flex-end",
    marginRight: 10,
  },
  container: {
    // borderWidth: 1,
    // minWidth: 56 * 3 + 16 * 2 + 36,
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 12,
    zIndex: 1000,
    backgroundColor: "transparent",
    flexShrink: 0,
  },
});

export default BottomNavigator;
