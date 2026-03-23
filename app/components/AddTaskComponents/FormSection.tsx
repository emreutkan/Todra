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
  /** default = compact; editorial = Fraunces + primary accent bar (Add Task) */
  variant?: "default" | "editorial";
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  optional = false,
  subtitle,
  variant = "editorial",
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    formGroup: {
      marginBottom: SIZES.extraLarge,
      backgroundColor: "transparent",
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "stretch",
      marginBottom: SIZES.small,
    },
    accentBar: {
      width: 3,
      borderRadius: 2,
      marginRight: SIZES.medium,
      alignSelf: "stretch",
      minHeight: 26,
    },
    labelColumn: {
      flex: 1,
    },
    labelContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    labelContent: {
      flex: 1,
    },
    labelDefault: {
      ...typography.bodySemiBold,
      fontSize: 16,
      color: colors.text,
    },
    labelEditorial: {
      ...typography.title,
      fontSize: 20,
      lineHeight: 26,
      color: colors.text,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    optionalText: {
      ...typography.caption,
      color: colors.primary,
      marginLeft: SIZES.small,
      fontFamily: typography.bodySemiBold.fontFamily,
    },
    content: {
      width: "100%",
    },
  });

  const labelStyle =
    variant === "editorial" ? styles.labelEditorial : styles.labelDefault;

  return (
    <View style={styles.formGroup}>
      <View style={styles.labelRow}>
        {variant === "editorial" ? (
          <View
            style={[styles.accentBar, { backgroundColor: colors.primary }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : null}
        <View style={styles.labelColumn}>
          <View style={styles.labelContainer}>
            <View style={styles.labelContent}>
              <Text style={labelStyle}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
            </View>
            {optional ? (
              <Text style={styles.optionalText}>Optional</Text>
            ) : null}
          </View>
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default FormSection;
