import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SIZES } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outlined';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: any;
    textStyle?: any;
    accessibilityLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
                                           title,
                                           onPress,
                                           variant = 'primary',
                                           size = 'medium',
                                           disabled = false,
                                           loading = false,
                                           fullWidth = false,
                                           style,
                                           textStyle,
                                           accessibilityLabel,
                                       }) => {
    const { colors } = useTheme();

    // Set button colors based on variant
    const getButtonStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                    textColor: colors.onPrimary,
                };
            case 'secondary':
                return {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    textColor: colors.text,
                };
            case 'danger':
                return {
                    backgroundColor: colors.error,
                    borderColor: colors.error,
                    textColor: '#FFFFFF',
                };
            case 'success':
                return {
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                    textColor: '#FFFFFF',
                };
            case 'outlined':
                return {
                    backgroundColor: 'transparent',
                    borderColor: colors.primary,
                    textColor: colors.primary,
                };
            default:
                return {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                    textColor: colors.onPrimary,
                };
        }
    };

    // Set button size
    const getButtonSize = () => {
        switch (size) {
            case 'small':
                return {
                    paddingVertical: SIZES.small / 2,
                    paddingHorizontal: SIZES.medium,
                    fontSize: SIZES.font,
                };
            case 'large':
                return {
                    paddingVertical: SIZES.medium,
                    paddingHorizontal: SIZES.extraLarge,
                    fontSize: SIZES.large,
                };
            default:
                return {
                    paddingVertical: SIZES.small,
                    paddingHorizontal: SIZES.medium,
                    fontSize: SIZES.medium,
                };
        }
    };

    const buttonStyles = getButtonStyles();
    const buttonSize = getButtonSize();

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: buttonStyles.backgroundColor,
                    borderColor: buttonStyles.borderColor,
                    paddingVertical: buttonSize.paddingVertical,
                    paddingHorizontal: buttonSize.paddingHorizontal,
                    opacity: disabled ? 0.6 : 1,
                    width: fullWidth ? '100%' : 'auto',
                },
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            accessibilityLabel={accessibilityLabel || title}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            {loading ? (
                <ActivityIndicator size="small" color={buttonStyles.textColor} />
            ) : (
                <Text
                    style={[
                        styles.buttonText,
                        {
                            color: buttonStyles.textColor,
                            fontSize: buttonSize.fontSize,
                        },
                        textStyle,
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: SIZES.base,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
    },
    buttonText: {
        fontWeight: '600',
    },
});

export default Button;