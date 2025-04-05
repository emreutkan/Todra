import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Animated,
    Dimensions
} from 'react-native';
import FormSection from './FormSection';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { format, addDays, isSameDay, isToday, isTomorrow, getHours, getMinutes } from 'date-fns';

interface DateTimePickerProps {
    dueDate: Date;
    onDateChange: (date: Date) => void;
    initialDate?: Date;
}

const { width } = Dimensions.get('window');

const DateTimePicker: React.FC<DateTimePickerProps> = ({
                                                           dueDate,
                                                           onDateChange,
                                                           initialDate = new Date()
                                                       }) => {
    const { colors } = useTheme();
    const [isModalVisible, setModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
    const [tempDate, setTempDate] = useState<Date>(new Date(dueDate));
    const [animation] = useState(new Animated.Value(0));

    // Generate dates (30 days)
    const generateDates = useCallback(() => {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const date = addDays(today, i);
            dates.push(date);
        }
        return dates;
    }, []);

    // Generate hours
    const generateTimeSlots = useCallback(() => {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute of [0, 30]) {
                const time = new Date();
                time.setHours(hour, minute, 0, 0);
                slots.push(time);
            }
        }
        return slots;
    }, []);

    const dates = generateDates();
    const timeSlots = generateTimeSlots();

    const formatDateLabel = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return format(date, 'EEE, MMM d');
    };

    const handleTabChange = (tab: 'date' | 'time') => {
        setActiveTab(tab);
        Animated.timing(animation, {
            toValue: tab === 'date' ? 0 : 1,
            duration: 300,
            useNativeDriver: false
        }).start();
    };

    const handleDateSelection = (date: Date) => {
        const newDate = new Date(tempDate);
        newDate.setFullYear(date.getFullYear());
        newDate.setMonth(date.getMonth());
        newDate.setDate(date.getDate());
        setTempDate(newDate);
        handleTabChange('time');
    };

    const handleTimeSelection = (time: Date) => {
        const newDate = new Date(tempDate);
        newDate.setHours(getHours(time));
        newDate.setMinutes(getMinutes(time));
        setTempDate(newDate);
    };

    const handleSave = () => {
        onDateChange(tempDate);
        setModalVisible(false);
    };

    const openModal = () => {
        setTempDate(new Date(dueDate));
        setActiveTab('date');
        animation.setValue(0);
        setModalVisible(true);
    };

    const translateX = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -width]
    });

    return (
        <FormSection title="Due Date & Time">
            <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={openModal}
                activeOpacity={0.7}
            >
                <View style={[styles.dateTimeDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.dateSection}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.icon} />
                        <Text style={[styles.dateText, { color: colors.text }]}>
                            {isToday(dueDate) ? 'Today' :
                                isTomorrow(dueDate) ? 'Tomorrow' :
                                    format(dueDate, 'EEE, MMM d, yyyy')}
                        </Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.timeSection}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.icon} />
                        <Text style={[styles.timeText, { color: colors.text }]}>
                            {format(dueDate, 'h:mm a')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, {
                        backgroundColor: colors.background,
                        borderColor: colors.border
                    }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Set Due Date & Time
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.tab,
                                    activeTab === 'date' && [styles.activeTab, { borderBottomColor: colors.primary }]
                                ]}
                                onPress={() => handleTabChange('date')}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: activeTab === 'date' ? colors.primary : colors.textSecondary }
                                ]}>
                                    Date
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.tab,
                                    activeTab === 'time' && [styles.activeTab, { borderBottomColor: colors.primary }]
                                ]}
                                onPress={() => handleTabChange('time')}
                            >
                                <Text style={[
                                    styles.tabText,
                                    { color: activeTab === 'time' ? colors.primary : colors.textSecondary }
                                ]}>
                                    Time
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerContainer}>
                            <Animated.View
                                style={[styles.pickerContent, {
                                    transform: [{ translateX }],
                                    width: width * 2,
                                }]}
                            >
                                <View style={[styles.datePickerContainer, { width }]}>
                                    <FlatList
                                        data={dates}
                                        keyExtractor={(item) => item.toISOString()}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={[
                                                    styles.dateItem,
                                                    isSameDay(item, tempDate) && [styles.selectedItem, {
                                                        backgroundColor: colors.primary + '20',
                                                        borderColor: colors.primary
                                                    }],
                                                    { backgroundColor: colors.card }
                                                ]}
                                                onPress={() => handleDateSelection(item)}
                                            >
                                                <Text style={[
                                                    styles.dayText,
                                                    { color: isSameDay(item, tempDate) ? colors.primary : colors.text }
                                                ]}>
                                                    {format(item, 'EEE')}
                                                </Text>
                                                <Text style={[
                                                    styles.dateNumber,
                                                    { color: isSameDay(item, tempDate) ? colors.primary : colors.text }
                                                ]}>
                                                    {format(item, 'd')}
                                                </Text>
                                                <Text style={[
                                                    styles.monthText,
                                                    { color: isSameDay(item, tempDate) ? colors.primary : colors.textSecondary }
                                                ]}>
                                                    {format(item, 'MMM')}
                                                </Text>
                                                {(isToday(item) || isTomorrow(item)) && (
                                                    <View style={[
                                                        styles.todayBadge,
                                                        {
                                                            backgroundColor: isToday(item) ? colors.primary : colors.success,
                                                            borderColor: isToday(item) ? colors.primary : colors.success
                                                        }
                                                    ]}>
                                                        <Text style={styles.todayText}>
                                                            {isToday(item) ? 'Today' : 'Tmrw'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                        numColumns={4}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>

                                <View style={[styles.timePickerContainer, { width }]}>
                                    <FlatList
                                        data={timeSlots}
                                        keyExtractor={(item) => item.toISOString()}
                                        renderItem={({ item }) => {
                                            const isSelected =
                                                getHours(item) === getHours(tempDate) &&
                                                getMinutes(item) === getMinutes(tempDate);

                                            return (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.timeItem,
                                                        isSelected && [styles.selectedItem, {
                                                            backgroundColor: colors.primary + '20',
                                                            borderColor: colors.primary
                                                        }],
                                                        { backgroundColor: colors.card }
                                                    ]}
                                                    onPress={() => handleTimeSelection(item)}
                                                >
                                                    <Text style={[
                                                        styles.timeText,
                                                        { color: isSelected ? colors.primary : colors.text }
                                                    ]}>
                                                        {format(item, 'h:mm a')}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        }}
                                        numColumns={3}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>
                            </Animated.View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.footerButton, styles.saveButton, { backgroundColor: colors.primary }]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>
                                    Set Date & Time
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </FormSection>
    );
};

const styles = StyleSheet.create({
    dateTimeButton: {
        width: '100%',
    },
    dateTimeDisplay: {
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        height: 54,
        alignItems: 'center',
    },
    dateSection: {
        flex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    timeSection: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    divider: {
        width: 1,
        height: '70%',
    },
    icon: {
        marginRight: 8,
    },
    dateText: {
        fontSize: 15,
        fontWeight: '500',
    },
    timeText: {
        fontSize: 15,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    tabContainer: {
        flexDirection: 'row',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomWidth: 3,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    pickerContainer: {
        overflow: 'hidden',
        maxHeight: 400,
    },
    pickerContent: {
        flexDirection: 'row',
    },
    datePickerContainer: {
        padding: 12,
    },
    timePickerContainer: {
        padding: 12,
    },
    dateItem: {
        flex: 1,
        margin: 6,
        height: 80,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
        overflow: 'hidden',
        position: 'relative',
    },
    timeItem: {
        flex: 1,
        margin: 6,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedItem: {
        borderWidth: 2,
    },
    dayText: {
        fontSize: 12,
        marginBottom: 4,
    },
    dateNumber: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    monthText: {
        fontSize: 12,
        marginTop: 2,
    },
    todayBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    todayText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    footerButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        marginRight: 8,
        borderWidth: 1,
    },
    saveButton: {
        marginLeft: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DateTimePicker;