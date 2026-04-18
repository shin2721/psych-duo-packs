import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

const WEEKS = 5;
const DAYS_PER_WEEK = 7;

type Cell = {
    date: string;
    data?: StreakDay;
    isToday: boolean;
    isFuture: boolean;
};

export function StreakCalendar({ history, themeColor }: StreakCalendarProps) {
    const activeColor = themeColor ?? '#a8ff60';

    const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    };
    const rgb = activeColor.startsWith('#') ? hexToRgb(activeColor) : null;

    const getIntensityColor = (xp: number, isFuture: boolean) => {
        if (isFuture) return 'transparent';
        if (xp === 0) return rgb ? `rgba(${rgb}, 0.08)` : theme.colors.line;
        if (rgb) {
            if (xp < 20) return `rgba(${rgb}, 0.3)`;
            if (xp < 50) return `rgba(${rgb}, 0.6)`;
            return activeColor;
        }
        if (xp < 20) return 'rgba(168, 255, 96, 0.3)';
        if (xp < 50) return 'rgba(168, 255, 96, 0.6)';
        return '#a8ff60';
    };

    const getGlow = (xp: number) => {
        if (xp >= 50) return {
            shadowColor: activeColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
        };
        return {};
    };

    const buildGrid = (): { weekdayLabels: string[]; grid: Cell[][]; activeDays: number } => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = dateKey(today);

        const jsDayToday = today.getDay();
        const daysFromMonday = (jsDayToday + 6) % 7;

        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(today.getDate() - daysFromMonday);

        const start = new Date(startOfThisWeek);
        start.setDate(startOfThisWeek.getDate() - 7 * (WEEKS - 1));

        const weekdayLabels = [
            i18n.t('streakCalendar.weekdays.mon'),
            i18n.t('streakCalendar.weekdays.tue'),
            i18n.t('streakCalendar.weekdays.wed'),
            i18n.t('streakCalendar.weekdays.thu'),
            i18n.t('streakCalendar.weekdays.fri'),
            i18n.t('streakCalendar.weekdays.sat'),
            i18n.t('streakCalendar.weekdays.sun'),
        ].map((label) => String(label));

        const grid: Cell[][] = [];
        let activeDays = 0;

        for (let w = 0; w < WEEKS; w++) {
            const week: Cell[] = [];
            for (let d = 0; d < DAYS_PER_WEEK; d++) {
                const date = new Date(start);
                date.setDate(start.getDate() + w * DAYS_PER_WEEK + d);
                const dateString = dateKey(date);
                const dayData = history.find((h) => h.date === dateString);
                const isToday = dateString === todayStr;
                const isFuture = date.getTime() > today.getTime();
                if (dayData && dayData.xp > 0) activeDays += 1;
                week.push({ date: dateString, data: dayData, isToday, isFuture });
            }
            grid.push(week);
        }

        return { weekdayLabels, grid, activeDays };
    };

    const { weekdayLabels, grid, activeDays } = buildGrid();
    const totalDays = WEEKS * DAYS_PER_WEEK;

    const getAccessibleDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Intl.DateTimeFormat(i18n.locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(year, month - 1, day));
    };

    const getDayAccessibilityLabel = (cell: Cell) => {
        const formattedDate = getAccessibleDate(cell.date);
        const xp = cell.data?.xp || 0;
        const lessons = cell.data?.lessonsCompleted || 0;
        if (xp === 0 && lessons === 0) {
            return String(i18n.t('streakCalendar.dayInactive', { date: formattedDate }));
        }
        return String(i18n.t('streakCalendar.dayActive', { date: formattedDate, xp, lessons }));
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>{i18n.t('streakCalendar.title')}</Text>
                <Text style={[styles.summary, { color: activeColor }]}>
                    {activeDays} / {totalDays}
                </Text>
            </View>

            <View style={styles.weekdayRow}>
                {weekdayLabels.map((label, idx) => (
                    <Text key={idx} style={styles.weekdayLabel}>
                        {label}
                    </Text>
                ))}
            </View>

            <View style={styles.grid}>
                {grid.map((week, wIdx) => (
                    <View key={wIdx} style={styles.weekRow}>
                        {week.map((cell, dIdx) => (
                            <View
                                key={dIdx}
                                style={styles.cellSlot}
                                accessible={!cell.isFuture}
                                accessibilityLabel={cell.isFuture ? undefined : getDayAccessibilityLabel(cell)}
                            >
                                <View
                                    style={[
                                        styles.cell,
                                        { backgroundColor: getIntensityColor(cell.data?.xp || 0, cell.isFuture) },
                                        cell.isToday && { borderWidth: 1.5, borderColor: activeColor },
                                        getGlow(cell.data?.xp || 0),
                                    ]}
                                />
                            </View>
                        ))}
                    </View>
                ))}
            </View>

            <View style={styles.legend}>
                <Text style={styles.legendText}>{i18n.t('streakCalendar.less')}</Text>
                <View style={[styles.legendBox, { backgroundColor: getIntensityColor(0, false) }]} />
                <View style={[styles.legendBox, { backgroundColor: getIntensityColor(10, false) }]} />
                <View style={[styles.legendBox, { backgroundColor: getIntensityColor(30, false) }]} />
                <View style={[styles.legendBox, { backgroundColor: getIntensityColor(50, false) }]} />
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
    },
    summary: {
        fontSize: 13,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    weekdayLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10,
        color: theme.colors.sub,
        fontWeight: '600',
    },
    grid: {
        gap: 4,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    cellSlot: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cell: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
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
        borderRadius: 3,
    },
});
