import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS, SIZES } from '../../theme';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo

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
    return (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={onBackPress}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                )}

                <Text style={styles.headerTitle}>{title}</Text>

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
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: 'bold',
        flex: 1,
    },
    rightComponent: {
        marginLeft: SIZES.medium,
    }
});

export default ScreenHeader;