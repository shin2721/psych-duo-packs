import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback, Animated, PanResponder, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import i18n from '../lib/i18n';
import { EvidenceBottomSheetDetails } from './EvidenceBottomSheetDetails';
import { VERDICT_COLORS } from './evidenceVerdictColors';
import type { VerdictWeight } from '../types/question';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5; // Slightly taller to show source info
const SHEET_SURFACE = '#111C33';

interface EvidenceBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    source_id?: string;
    expandedDetails?: {
        claim_type?: string;
        evidence_type?: string;
        citation_role?: string;
        verdict_weight?: VerdictWeight;
        best_for?: string[];
        limitations?: string[];
        try_this?: string;
    };
}

export function EvidenceBottomSheet({ visible, onClose, source_id, expandedDetails }: EvidenceBottomSheetProps) {
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 150,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0.6,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: SHEET_HEIGHT,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 150,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    // Pan responder for swipe down gesture
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const shouldClose =
                    gestureState.dy > 150 ||
                    (gestureState.dy > 90 && gestureState.vy > 1.1);

                if (shouldClose) {
                    onClose();
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    if (!visible) return null;

    const listSeparator = i18n.locale.startsWith('ja') ? '、' : ', ';
    // 判定の色を上端の帯にだけ通す。判定が変わるとシートの表情が変わる。
    const accentColor = VERDICT_COLORS[expandedDetails?.verdict_weight ?? 'grey'];

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
            {/* Backdrop - tap to close */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            {/* Bottom Sheet */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
                <View style={[styles.accentBand, { backgroundColor: accentColor }]} />
                {/* Handle bar + Close button row。下スワイプで閉じる操作はこの行だけが拾う。
                    シート全体で拾うと、内側のスクロールが動かせなくなる。 */}
                <View style={styles.headerRow} {...panResponder.panHandlers}>
                    <View style={styles.handle} />
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                        accessibilityRole="button"
                        accessibilityLabel={`${i18n.t('common.close')}: ${i18n.t('lesson.showDetails')}`}
                    >
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* 根拠の中身。開いた時点で出す——判断の要約を挟むと、
                    種明かしとただし書きが既に言ったことを曖昧な言葉で繰り返すことになる。 */}
                <ScrollView
                    style={styles.detailsScroll}
                    contentContainerStyle={styles.detailsScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <EvidenceBottomSheetDetails
                        expandedDetails={expandedDetails}
                        listSeparator={listSeparator}
                        sourceId={source_id}
                        styles={styles}
                    />
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: SHEET_HEIGHT,
        // theme.colors.card は半透明で、後ろのレッスン本文が透けて読めなくなる。
        // このシートだけ不透明の同系色にする。
        backgroundColor: SHEET_SURFACE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
        overflow: 'hidden',
    },
    accentBand: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    detailsScroll: {
        flex: 1,
    },
    detailsScrollContent: {
        paddingBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
    },
    closeButton: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },
    summaryBox: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    summaryText: {
        fontSize: 15,
        color: '#fff',
        lineHeight: 22,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    chipText: {
        fontSize: 12,
        color: '#a5b4fc',
        fontWeight: '600',
    },
    section: {
        marginBottom: 14,
    },
    sectionLabelRow: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 5,
    },
    sectionLabelGap: {
        marginBottom: 5,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.62)',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    sectionText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        lineHeight: 19,
    },
    verdict: {
        borderBottomColor: 'rgba(255,255,255,0.10)',
        borderBottomWidth: 1,
        marginBottom: 18,
        paddingBottom: 16,
    },
    verdictClaim: {
        borderLeftWidth: 3,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 21,
        marginBottom: 10,
        paddingLeft: 10,
    },
    verdictHeadRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    strengthBlock: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 11,
    },
    strengthBlockBelowVerdict: {
        marginTop: 14,
    },
    strengthHeaderRow: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 7,
    },
    strengthBadge: {
        alignItems: 'center',
        borderRadius: 999,
        flexDirection: 'row',
        marginLeft: 8,
        paddingHorizontal: 9,
        paddingVertical: 3,
    },
    strengthDots: {
        fontSize: 9,
        letterSpacing: 1.5,
        marginRight: 6,
    },
    strengthBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    verdictStrength: {
        color: 'rgba(255,255,255,0.74)',
        fontSize: 13,
        lineHeight: 19,
    },
    verdictStrengthStrong: {
        color: 'rgba(255,255,255,0.96)',
        fontWeight: '600',
    },
    strengthList: {
        borderLeftColor: 'rgba(255,255,255,0.12)',
        borderLeftWidth: 2,
        marginTop: 9,
        paddingLeft: 8,
    },
    strengthItem: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginBottom: 2,
    },
    strengthDot: {
        color: 'rgba(255,255,255,0.32)',
        fontSize: 12,
        lineHeight: 17,
        width: 12,
    },
    strengthItemText: {
        color: 'rgba(255,255,255,0.5)',
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
    },
    verdictChip: {
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 5,
    },
    verdictChipText: {
        color: '#0B1220',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    verdictText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 24,
    },
    bulletText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        lineHeight: 21,
        marginBottom: 2,
    },
    sourceBox: {
        borderTopColor: 'rgba(255,255,255,0.09)',
        borderTopWidth: 1,
        marginBottom: 12,
        paddingTop: 12,
    },
    sourceAuthor: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 7,
    },
    sourcePillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    sourcePill: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    sourcePillText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
    },
    // Try Value Summary styles
    tryValueSummary: {
        marginBottom: 16,
    },
    actionHint: {
        fontSize: 15,
        fontWeight: '500',
        color: '#60a5fa',
        marginBottom: 12,
        lineHeight: 20,
    },
    tryValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tryValueLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    tryValueBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    tryValueText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    basisLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    safetyNote: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
    },
    detailsToggle: {
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: 8,
    },
    detailsToggleText: {
        fontSize: 14,
        color: '#a5b4fc',
        fontWeight: '500',
    },
});
