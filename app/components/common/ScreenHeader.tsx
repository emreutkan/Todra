import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../typography';

interface ScreenHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightComponent?: React.ReactNode;
    /** Larger Fraunces title for focal screens (e.g. Add Task) */
    titleEmphasis?: "default" | "hero";
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
                                                       title,
                                                       showBackButton = false,
                                                       onBackPress,
                                                       rightComponent,
                                                       titleEmphasis = "default",
                                                   }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Math.max(insets.top, 12),
        }]}>
            <View style={styles.headerContent}>
                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBackPress}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        accessibilityLabel="Back"
                        accessibilityRole="button"
                        accessibilityHint="Navigate to the previous screen"
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}

                <Text
                    style={[
                        titleEmphasis === "hero"
                            ? {
                                  ...typography.display,
                                  fontSize: 26,
                                  lineHeight: 30,
                                  letterSpacing: -0.35,
                              }
                            : typography.title,
                        styles.headerTitle,
                        { color: colors.text },
                    ]}
                    numberOfLines={titleEmphasis === "hero" ? 2 : 1}
                    ellipsizeMode="tail"
                >
                    {title}
                </Text>

                {rightComponent && (
                    <View style={styles.rightComponent}>
                        {rightComponent}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: SIZES.medium,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: SIZES.small,
        padding: SIZES.small / 2,
    },
    headerTitle: {
        flex: 1,
    },
    rightComponent: {
        marginLeft: SIZES.medium,
    }
});

export default ScreenHeader;