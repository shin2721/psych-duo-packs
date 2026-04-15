import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';
import { dateKey } from '../lib/streaks';
import i18n from '../lib/i18n';

interface StreakDay {
    date: string;
    xp: number;
    lessonsCompleted: number;
}

interface StreakCalendarProps {
    history: StreakDay[];
    themeColor?: string;
}

export function StreakCalendar({ history, themeColor }: StreakCalendarProps) {
    const activeColor = themeColor ?? '#a8ff60';

    // Generate last 30 days
    const getLast30Days = () => {
        const days: { date: string; data?: StreakDay; isToday?: boolean }[] = [];
        const today = new Date();
        const todayStr = dateKey(today);

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = dateKey(date);  // ローカル時間基準

            const dayData = history.find(h => h.date === dateString);
            days.push({ date: dateString, data: dayData, isToday: dateString === todayStr });
        }

        return days;
    };

    const days = getLast30Days();

    const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };
    const rgb = activeColor.startsWith('#') ? hexToRgb(activeColor) : null;

    const getIntensityColor = (xp: number) => {
        if (xp === 0) return theme.colors.line;
        if (rgb) {
            if (xp < 20) return `rgba(${rgb}, 0.25)`;
            if (xp < 50) return `rgba(${rgb}, 0.60)`;
            return activeColor;
        }
        if (xp < 20) return 'rgba(168, 255, 96, 0.25)';
        if (xp < 50) return 'rgba(168, 255, 96, 0.60)';
        return '#a8ff60';
    };

    const getGlow = (xp: number) => {
        if (xp >= 50) return {
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 5,
        };
        return {};
    };

    const getDayLabel = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate();
        return day === 1 || day === 15 ? day.toString() : '';
    };

    const getAccessibleDate = (dateString: string) => {
        const [year, month, day] = dateString.split("-").map(Number);
        return new Intl.DateTimeFormat(i18n.locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(new Date(year, month - 1, day));
    };

    const getDayAccessibilityLabel = (day: { date: string; data?: StreakDay }) => {
        const formattedDate = getAccessibleDate(day.date);
        const xp = day.data?.xp || 0;
        const lessons = day.data?.lessonsCompleted || 0;

        if (xp === 0 && lessons === 0) {
            return String(i18n.t("streakCalendar.dayInactive", { date: formattedDate }));
        }

        return String(
            i18n.t("streakCalendar.dayActive", {
                date: formattedDate,
                xp,
                lessons,
            })
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{i18n.t('streakCalendar.title')}</Text>
            <View style={styles.calendar}>
                {days.map((day, index) => (
                    <View
                        key={index}
                        style={styles.dayContainer}
                        accessible
                        accessibilityLabel={getDayAccessibilityLabel(day)}
                    >
                        <View
                            style={[
                                styles.day,
                                {
                                    backgroundColor: getIntensityColor(day.data?.xp || 0),
                                },
                                day.isToday && {
                                    borderWidth: 1.5,
                                    borderColor: activeColor,
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
                <Text style={styles.legendText}>{i18n.t('streakCalendar.less')}</Text>
                <View accessible={false} importantForAccessibility="no" style={[styles.legendBox, { backgroundColor: theme.colors.line }]} />
                <View accessible={false} importantForAccessibility="no" style={[styles.legendBox, { backgroundColor: getIntensityColor(10) }]} />
                <View accessible={false} importantForAccessibility="no" style={[styles.legendBox, { backgroundColor: getIntensityColor(30) }]} />
                <View accessible={false} importantForAccessibility="no" style={[styles.legendBox, { backgroundColor: getIntensityColor(50) }]} />
                <Text style={styles.legendText}>{i18n.t('streakCalendar.more')}</Text>
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
        width: 14,
        height: 14,
        borderRadius: 3,
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
        width: 14,
        height: 14,
        borderRadius: 3,
    },
});
