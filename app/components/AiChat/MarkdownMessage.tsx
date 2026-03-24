import React, { useMemo } from "react";
import { TextStyle } from "react-native";
import Markdown from "react-native-markdown-display";
import { ThemeColors } from "../../theme";
import { FONT } from "../../typography";

type Props = {
  content: string;
  colors: ThemeColors;
  isDark: boolean;
};

export const MarkdownMessage: React.FC<Props> = ({
  content,
  colors,
  isDark,
}) => {
  const mdStyles = useMemo(
    () => ({
      body: {
        color: colors.text,
        fontFamily: FONT.body,
        fontSize: 16,
        lineHeight: 24,
      } as TextStyle,
      paragraph: {
        marginTop: 0,
        marginBottom: 10,
        color: colors.text,
      },
      strong: {
        fontFamily: FONT.bodyBold,
        color: colors.text,
      },
      em: {
        fontFamily: FONT.bodyMedium,
        fontStyle: "italic" as const,
        color: colors.text,
      },
      bullet_list: {
        marginBottom: 8,
      },
      ordered_list: {
        marginBottom: 8,
      },
      list_item: {
        marginBottom: 4,
      },
      heading1: {
        fontFamily: FONT.display,
        fontSize: 22,
        lineHeight: 28,
        color: colors.text,
        marginBottom: 8,
        marginTop: 4,
      },
      heading2: {
        fontFamily: FONT.display,
        fontSize: 18,
        lineHeight: 24,
        color: colors.text,
        marginBottom: 6,
        marginTop: 8,
      },
      heading3: {
        fontFamily: FONT.bodySemiBold,
        fontSize: 17,
        lineHeight: 24,
        color: colors.text,
        marginBottom: 4,
        marginTop: 6,
      },
      code_inline: {
        fontFamily: FONT.bodyMedium,
        backgroundColor: isDark ? colors.surface : colors.inputBackground,
        color: colors.secondary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 14,
      },
      fence: {
        fontFamily: FONT.body,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 12,
        marginVertical: 8,
        color: colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
      },
      link: {
        color: colors.primary,
        textDecorationLine: "underline" as const,
      },
      blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
        paddingLeft: 12,
        marginVertical: 8,
        backgroundColor: colors.primaryMuted,
        paddingVertical: 8,
        paddingRight: 8,
      },
      hr: {
        backgroundColor: colors.border,
        height: 1,
        marginVertical: 14,
      },
    }),
    [colors, isDark]
  );

  return <Markdown style={mdStyles}>{content}</Markdown>;
};
