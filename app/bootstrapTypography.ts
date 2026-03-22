import { Text, TextInput } from "react-native";
import { FONT } from "./typography";

/**
 * Apply Nunito Sans as the default for unstyled Text / TextInput after fonts load.
 */
export function applyGlobalTypography(): void {
  const body = { fontFamily: FONT.body };

  const T = Text as typeof Text & {
    defaultProps?: { style?: object | object[] };
  };
  T.defaultProps = {
    ...T.defaultProps,
    style: [body, T.defaultProps?.style].filter(Boolean),
  };

  const TI = TextInput as typeof TextInput & {
    defaultProps?: { style?: object | object[] };
  };
  TI.defaultProps = {
    ...TI.defaultProps,
    style: [body, TI.defaultProps?.style].filter(Boolean),
  };
}
