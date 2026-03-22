import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlassBar from "../common/GlassBar";
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
  const bottomInsets = useSafeAreaInsets();

  return (
    <GlassBar
      wrapperStyle={{ marginBottom: Math.max(bottomInsets.bottom, 8) }}>
      <SettingsButton onPress={onSettingsPress} showShadow={false} />
      <AddButton onPress={onAddTaskPress} showShadow={false} />
      <FilterButton onPress={onFilterPress} showShadow={false} />
    </GlassBar>
  );
};

export default BottomNavigator;
