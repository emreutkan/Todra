import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlassBar from "../common/GlassBar";
import AddButton from "./AddButton";
import AssistantNavFab from "./AssistantNavFab";
import FilterButton from "./FilterButton";
import SettingsFab from "./SettingsFab";

const BottomNavigator = ({
  onFilterPress,
  onAddTaskPress,
  onSettingsPress,
  onAssistantPress,
  activeFilterCount = 0,
}: {
  onFilterPress: () => void;
  onAddTaskPress: () => void;
  onSettingsPress: () => void;
  onAssistantPress: () => void;
  activeFilterCount?: number;
}) => {
  const bottomInsets = useSafeAreaInsets();

  return (
    <GlassBar
      wrapperStyle={{ marginBottom: Math.max(bottomInsets.bottom, 10) }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <SettingsFab onPress={onSettingsPress} showShadow={false} />
        <FilterButton
          onPress={onFilterPress}
          showShadow={false}
          activeFilterCount={activeFilterCount}
        />
        <AddButton onPress={onAddTaskPress} showShadow={false} />
        <AssistantNavFab onPress={onAssistantPress} showShadow={false} />
      </View>
    </GlassBar>
  );
};

export default BottomNavigator;
