import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface ScreenHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightComponent?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
                                                       title,
                                                       showBackButton = false,
                                                       onBackPress,
                                                       rightComponent
                                                   }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.header, {
            backgroundColor: colors.card,
            borderBottomColor: colors.border
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
                    style={[styles.headerTitle, { color: colors.text }]}
                    numberOfLines={1}
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
        paddingTop: Platform.OS === 'ios' ? 50 : 25,
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
        fontSize: SIZES.large,
        fontWeight: 'bold',
        flex: 1,
    },
    rightComponent: {
        marginLeft: SIZES.medium,
    }
});

export default ScreenHeader;