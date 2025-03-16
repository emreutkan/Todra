import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Dimensions,
    Platform
} from 'react-native';
import { COLORS, SIZES } from '../../theme';
import FormSection from './FormSection';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerProps {
    dueDate: Date;
    onDateChange: (date: Date) => void;
    initialDate?: Date;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_ITEM_WIDTH = 70;
const TIME_ITEM_WIDTH = 80;

const DateTimePicker: React.FC<DateTimePickerProps> = ({
                                                           dueDate,
                                                           onDateChange,
                                                           initialDate = new Date()
                                                       }) => {
    const [isModalVisible, setModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState<'date' | 'time'>('date');
    const [selectedDate, setSelectedDate] = useState(dueDate);
    const [dateListData, setDateListData] = useState<Array<{date: Date, label: string}>>([]);
    const [timeListData, setTimeListData] = useState<Array<{time: string, label: string}>>([]);
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
    const dateListRef = React.useRef<FlatList>(null);
    const timeListRef = React.useRef<FlatList>(null);

    // Generate 30 days starting from today for the date selection
    useEffect(() => {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 60; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            let label = '';
            if (i === 0) {
                label = 'Today';
            } else if (i === 1) {
                label = 'Tomorrow';
            } else {
                label = date.toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                });
            }

            dates.push({ date, label });
        }
        setDateListData(dates);

        // Find index of current selected date in the list
        const currentDay = new Date(dueDate);
        currentDay.setHours(0, 0, 0, 0);

        const indexOfToday = dates.findIndex(item =>
            item.date.getDate() === currentDay.getDate() &&
            item.date.getMonth() === currentDay.getMonth() &&
            item.date.getFullYear() === currentDay.getFullYear()
        );

        setSelectedDateIndex(indexOfToday >= 0 ? indexOfToday : 0);
    }, []);

    // Generate time slots in 30-minute intervals
    useEffect(() => {
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute of [0, 30]) {
                // Format: 9:00 AM
                const timeString = `${hour}:${minute === 0 ? '00' : minute}`;
                const date = new Date();
                date.setHours(hour);
                date.setMinutes(minute);

                const formattedTime = date.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                times.push({
                    time: timeString,
                    label: formattedTime
                });
            }
        }
        setTimeListData(times);

        // Find index of current selected time in the list
        const currentHour = dueDate.getHours();
        const currentMinute = dueDate.getMinutes();
        const roundedMinute = currentMinute < 30 ? 0 : 30;

        const timeString = `${currentHour}:${roundedMinute === 0 ? '00' : roundedMinute}`;
        const indexOfTime = times.findIndex(item => item.time === timeString);

        setSelectedTimeIndex(indexOfTime >= 0 ? indexOfTime : 0);
    }, []);

    const showDateModal = () => {
        setModalMode('date');
        setModalVisible(true);

        // Scroll to the selected date
        setTimeout(() => {
            dateListRef.current?.scrollToIndex({
                index: selectedDateIndex,
                animated: true,
                viewPosition: 0.5
            });
        }, 100);
    };

    const showTimeModal = () => {
        setModalMode('time');
        setModalVisible(true);

        // Scroll to the selected time
        setTimeout(() => {
            timeListRef.current?.scrollToIndex({
                index: selectedTimeIndex,
                animated: true,
                viewPosition: 0.5
            });
        }, 100);
    };

    const hideModal = () => {
        setModalVisible(false);
    };

    const handleConfirmSelection = () => {
        if (modalMode === 'date') {
            const newDate = dateListData[selectedDateIndex].date;
            const updatedDate = new Date(selectedDate);
            updatedDate.setFullYear(newDate.getFullYear());
            updatedDate.setMonth(newDate.getMonth());
            updatedDate.setDate(newDate.getDate());
            setSelectedDate(updatedDate);

            // Optionally, show time modal right after selecting date
            hideModal();
            setTimeout(() => {
                showTimeModal();
            }, 300);
        } else {
            // Apply selected time
            const [hours, minutes] = timeListData[selectedTimeIndex].time.split(':').map(Number);
            const updatedDate = new Date(selectedDate);
            updatedDate.setHours(hours);
            updatedDate.setMinutes(minutes);
            setSelectedDate(updatedDate);
            onDateChange(updatedDate);
            hideModal();
        }
    };

    const handleSelectDate = (index: number) => {
        setSelectedDateIndex(index);
    };

    const handleSelectTime = (index: number) => {
        setSelectedTimeIndex(index);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isTomorrow = (date: Date) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.getDate() === tomorrow.getDate() &&
            date.getMonth() === tomorrow.getMonth() &&
            date.getFullYear() === tomorrow.getFullYear();
    };

    const getRelativeDay = (date: Date) => {
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        return formatDate(date);
    };

    return (
        <FormSection title="Due Date & Time">
            <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={showDateModal}
                >
                    <View style={styles.pickerContent}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.dateText}>{getRelativeDay(dueDate)}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={COLORS.text + '80'} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={showTimeModal}
                >
                    <View style={styles.pickerContent}>
                        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.dateText}>{formatTime(dueDate)}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={COLORS.text + '80'} />
                </TouchableOpacity>
            </View>

            {/* Custom Modal for Date and Time picker */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={hideModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {modalMode === 'date' ? 'Select Date' : 'Select Time'}
                            </Text>
                            <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerContainer}>
                            {modalMode === 'date' ? (
                                <FlatList
                                    ref={dateListRef}
                                    data={dateListData}
                                    keyExtractor={(item, index) => `date-${index}`}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.listContent}
                                    snapToInterval={DAY_ITEM_WIDTH}
                                    decelerationRate="fast"
                                    renderItem={({ item, index }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.dateItem,
                                                selectedDateIndex === index && styles.selectedDateItem
                                            ]}
                                            onPress={() => handleSelectDate(index)}
                                        >
                                            <Text style={[
                                                styles.dateItemWeekday,
                                                selectedDateIndex === index && styles.selectedDateText
                                            ]}>
                                                {index < 2 ? '' : item.date.toLocaleDateString(undefined, { weekday: 'short' })}
                                            </Text>
                                            <Text style={[
                                                styles.dateItemNumber,
                                                selectedDateIndex === index && styles.selectedDateText
                                            ]}>
                                                {item.label}
                                            </Text>
                                            {index < 2 && (
                                                <Text style={[
                                                    styles.dateItemDate,
                                                    selectedDateIndex === index && styles.selectedDateText
                                                ]}>
                                                    {item.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    onMomentumScrollEnd={(e) => {
                                        const index = Math.round(e.nativeEvent.contentOffset.x / DAY_ITEM_WIDTH);
                                        if (index >= 0 && index < dateListData.length) {
                                            setSelectedDateIndex(index);
                                        }
                                    }}
                                />
                            ) : (
                                <FlatList
                                    ref={timeListRef}
                                    data={timeListData}
                                    keyExtractor={(item, index) => `time-${index}`}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.listContent}
                                    snapToInterval={TIME_ITEM_WIDTH}
                                    decelerationRate="fast"
                                    renderItem={({ item, index }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.timeItem,
                                                selectedTimeIndex === index && styles.selectedTimeItem
                                            ]}
                                            onPress={() => handleSelectTime(index)}
                                        >
                                            <Text style={[
                                                styles.timeItemText,
                                                selectedTimeIndex === index && styles.selectedTimeText
                                            ]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    onMomentumScrollEnd={(e) => {
                                        const index = Math.round(e.nativeEvent.contentOffset.x / TIME_ITEM_WIDTH);
                                        if (index >= 0 && index < timeListData.length) {
                                            setSelectedTimeIndex(index);
                                        }
                                    }}
                                />
                            )}
                        </View>

                        <View style={styles.selectorIndicator}>
                            <View style={styles.selectorLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={handleConfirmSelection}
                        >
                            <Text style={styles.confirmButtonText}>
                                {modalMode === 'date' ? 'Select Date' : 'Set Time'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </FormSection>
    );
};

export default DateTimePicker;

const styles = StyleSheet.create({
    dateTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    datePickerButton: {
        flex: 3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SIZES.medium,
        marginRight: SIZES.small,
    },
    timePickerButton: {
        flex: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: SIZES.base,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SIZES.medium,
    },
    pickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        color: COLORS.text,
        fontSize: SIZES.font,
        marginLeft: SIZES.small,
    },
    timeText: {
        color: COLORS.text,
        fontSize: SIZES.font,
        marginLeft: SIZES.small,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SIZES.medium,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: SIZES.large,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
    },
    pickerContainer: {
        height: 120,
        marginVertical: SIZES.medium,
    },
    listContent: {
        paddingHorizontal: SCREEN_WIDTH / 2 - DAY_ITEM_WIDTH / 2,
        paddingVertical: SIZES.small,
        alignItems: 'center',
    },
    dateItem: {
        width: DAY_ITEM_WIDTH,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 2,
    },
    selectedDateItem: {
        backgroundColor: COLORS.primary + '20',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    dateItemWeekday: {
        color: COLORS.text + '80',
        fontSize: 13,
        marginBottom: 4,
        fontWeight: '500',
    },
    dateItemNumber: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    dateItemDate: {
        color: COLORS.text + '80',
        fontSize: 12,
        marginTop: 4,
    },
    selectedDateText: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    timeItem: {
        width: TIME_ITEM_WIDTH,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginHorizontal: 2,
    },
    selectedTimeItem: {
        backgroundColor: COLORS.primary + '20',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    timeItemText: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '500',
    },
    selectedTimeText: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    selectorIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',  // Allow touches to pass through
    },
    selectorLine: {
        position: 'absolute',
        width: DAY_ITEM_WIDTH + 20,
        height: 2,
        backgroundColor: COLORS.primary + '40',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        marginHorizontal: SIZES.medium,
        marginTop: SIZES.medium,
        paddingVertical: SIZES.medium,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    confirmButtonText: {
        color: COLORS.background,
        fontSize: SIZES.medium,
        fontWeight: '600',
    },
});