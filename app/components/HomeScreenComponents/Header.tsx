import React from 'react';
import { View, Text, StyleSheet, Animated, Platform, StatusBar as RNStatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../theme';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : RNStatusBar.currentHeight || 0;

interface HeaderProps {
    fadeAnim: Animated.Value;
}

const Header: React.FC<HeaderProps> = ({ fadeAnim }) => {
    return (
        <LinearGradient
            colors={['rgba(0,0,0,0.8)', COLORS.background]}
            style={styles.header}
        >
            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.headerTitle}>Task Planner</Text>
                <Text style={styles.headerSubtitle}>Organize your day</Text>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingTop: STATUSBAR_HEIGHT + 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: SIZES.extraLarge,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    headerSubtitle: {
        color: COLORS.text + '90',
        fontSize: SIZES.medium,
        marginTop: 5,
    },
});

export default Header;