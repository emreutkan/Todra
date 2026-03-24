import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { RADII, ThemeColors } from "../../theme";
import { ToolTraceStep } from "../../services/llm/chatAgent";
import { FONT, typography } from "../../typography";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function titleCaseTool(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  steps: ToolTraceStep[];
  colors: ThemeColors;
};

export const ToolTraceSection: React.FC<Props> = ({ steps, colors }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!steps.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[typography.captionSemiBold, styles.sectionLabel, { color: colors.textSecondary }]}>
        Tools
      </Text>
      {steps.map((step) => {
        const isOpen = Boolean(open[step.id]);
        return (
          <View
            key={step.id}
            style={[
              styles.card,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => toggle(step.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${titleCaseTool(step.name)}, ${isOpen ? "expanded" : "collapsed"}`}>
              <View style={[styles.accent, { backgroundColor: colors.accent }]} />
              <Ionicons
                name="flash-outline"
                size={18}
                color={colors.primary}
                style={styles.rowIcon}
              />
              <Text
                style={[typography.subbodySemiBold, styles.rowTitle, { color: colors.text }]}
                numberOfLines={1}>
                {titleCaseTool(step.name)}
              </Text>
              <Ionicons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {isOpen && (
              <View style={[styles.detail, { borderTopColor: colors.hairline }]}>
                <Text style={[typography.captionSemiBold, styles.detailLabel, { color: colors.secondary }]}>
                  Request
                </Text>
                <Text
                  selectable
                  style={[typography.caption, styles.monoBlock, { color: colors.text }]}>
                  {step.argumentsPretty}
                </Text>
                <Text
                  style={[
                    typography.captionSemiBold,
                    styles.detailLabel,
                    { color: colors.secondary, marginTop: 10 },
                  ]}>
                  Result
                </Text>
                <Text
                  selectable
                  style={[typography.caption, styles.monoBlock, { color: colors.text }]}>
                  {step.resultPretty}
                </Text>
                <Text style={[typography.overline, styles.thinking, { color: colors.textSecondary }]}>
                  Internal · model invoked this step; Todra ran it on your device against your stored tasks.
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    gap: 8,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  card: {
    borderRadius: RADII.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingRight: 12,
  },
  accent: {
    width: 4,
    alignSelf: "stretch",
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    marginRight: 10,
  },
  rowIcon: { marginRight: 8 },
  rowTitle: { flex: 1, fontFamily: FONT.bodySemiBold },
  detail: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  detailLabel: {
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  monoBlock: {
    fontFamily: FONT.body,
    lineHeight: 20,
  },
  thinking: {
    marginTop: 12,
    lineHeight: 14,
  },
});
