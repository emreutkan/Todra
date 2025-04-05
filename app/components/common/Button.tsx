import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { SIZES } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outlined';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    accessibilityLabel?: string;
    icon?: string;
    iconPosition?: 'left' | 'right';
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
                                           icon,
                                           iconPosition = 'left'
                                       }) => {
    const { colors, isDark } = useTheme();

    // Get button colors based on variant
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
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
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

    // Get button dimensions based on size
    const getButtonDimensions = () => {
        switch (size) {
            case 'small':
                return {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    fontSize: 14,
                    iconSize: 16,
                    borderRadius: 12,
                };
            case 'large':
                return {
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    fontSize: 18,
                    iconSize: 22,
                    borderRadius: 20,
                };
            default: // medium
                return {
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    fontSize: 16,
                    iconSize: 20,
                    borderRadius: 16,
                };
        }
    };

    const buttonStyles = getButtonStyles();
    const buttonDimensions = getButtonDimensions();

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: buttonStyles.backgroundColor,
                    borderColor: buttonStyles.borderColor,
                    paddingVertical: buttonDimensions.paddingVertical,
                    paddingHorizontal: buttonDimensions.paddingHorizontal,
                    borderRadius: buttonDimensions.borderRadius,
                    opacity: disabled ? 0.6 : 1,
                    width: fullWidth ? '100%' : undefined,
                    borderWidth: variant === 'outlined' || variant === 'secondary' ? 1 : 0,
                },
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            accessibilityLabel={accessibilityLabel || title}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
        >
            {loading ? (
                <ActivityIndicator size="small" color={buttonStyles.textColor} />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon as any}
                            size={buttonDimensions.iconSize}
                            color={buttonStyles.textColor}
                            style={styles.leftIcon}
                        />
                    )}
                    <Text
                        style={[
                            styles.buttonText,
                            {
                                color: buttonStyles.textColor,
                                fontSize: buttonDimensions.fontSize,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon as any}
                            size={buttonDimensions.iconSize}
                            color={buttonStyles.textColor}
                            style={styles.rightIcon}
                        />
                    )}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    buttonText: {
        fontWeight: '600',
        textAlign: 'center',
    },
    leftIcon: {
        marginRight: 8,
    },
    rightIcon: {
        marginLeft: 8,
    }
});

export default Button;