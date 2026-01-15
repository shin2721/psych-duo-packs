import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';
import { dateKey } from '../lib/streaks';

interface StreakDay {
    date: string;
    xp: number;
    lessonsCompleted: number;
}

interface StreakCalendarProps {
    history: StreakDay[];
}

export function StreakCalendar({ history }: StreakCalendarProps) {
    // Generate last 30 days
    const getLast30Days = () => {
        const days: { date: string; data?: StreakDay }[] = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = dateKey(date);  // ローカル時間基準

            const dayData = history.find(h => h.date === dateString);
            days.push({ date: dateString, data: dayData });
        }

        return days;
    };

    const days = getLast30Days();

    const getIntensityColor = (xp: number) => {
        if (xp === 0) return theme.colors.line;
        if (xp < 20) return 'rgba(168, 255, 96, 0.25)';
        if (xp < 50) return 'rgba(168, 255, 96, 0.55)';
        return '#a8ff60';
    };

    const getGlow = (xp: number) => {
        if (xp >= 50) return {
            shadowColor: '#a8ff60',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
        };
        return {};
    };

    const getDayLabel = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate();
        return day === 1 || day === 15 ? day.toString() : '';
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Learning Activity</Text>
            <View style={styles.calendar}>
                {days.map((day, index) => (
                    <View key={index} style={styles.dayContainer}>
                        <View
                            style={[
                                styles.day,
                                {
                                    backgroundColor: getIntensityColor(day.data?.xp || 0),
                                },
                                getGlow(day.data?.xp || 0),
                            ]}
                        />
                        {getDayLabel(day.date) && (
                            <Text style={styles.dayLabel}>{getDayLabel(day.date)}</Text>
                        )}
                    </View>
                ))}
            </View>
            <View style={styles.legend}>
                <Text style={styles.legendText}>Less</Text>
                <View style={[styles.legendBox, { backgroundColor: theme.colors.line }]} />
                <View style={[styles.legendBox, { backgroundColor: 'rgba(168, 255, 96, 0.25)' }]} />
                <View style={[styles.legendBox, { backgroundColor: 'rgba(168, 255, 96, 0.55)' }]} />
                <View style={[styles.legendBox, { backgroundColor: '#a8ff60' }]} />
                <Text style={styles.legendText}>More</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 12,
    },
    calendar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    dayContainer: {
        alignItems: 'center',
    },
    day: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    dayLabel: {
        fontSize: 8,
        color: theme.colors.sub,
        marginTop: 2,
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 12,
        gap: 4,
    },
    legendText: {
        fontSize: 12,
        color: theme.colors.sub,
    },
    legendBox: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
});
