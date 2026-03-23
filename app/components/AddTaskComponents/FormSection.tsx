import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SIZES } from "../../theme";
import { typography } from "../../typography";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  optional?: boolean;
  subtitle?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  optional = false,
  subtitle,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    formGroup: {
      marginBottom: SIZES.extraLarge,
      backgroundColor: colors.background,
      borderRadius: SIZES.base,
    },
    labelContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SIZES.small,
    },
    labelContent: {
      flex: 1,
    },
    label: {
      ...typography.headline,
      color: colors.text,
    },
    subtitle: {
      ...typography.bodySmall,
      color: colors.textSecondary,
      marginTop: 4,
    },
    optionalText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: SIZES.small,
      fontStyle: "italic",
    },
    content: {
      width: "100%",
    },
  });

  return (
    <View style={styles.formGroup}>
      <View style={styles.labelContainer}>
        <View style={styles.labelContent}>
          <Text style={styles.label}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {optional ? (
          <Text style={styles.optionalText}>Optional</Text>
        ) : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default FormSection;
