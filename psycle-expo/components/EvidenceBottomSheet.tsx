import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback, Animated, PanResponder, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import i18n from '../lib/i18n';
import { EvidenceBottomSheetDetails } from './EvidenceBottomSheetDetails';

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

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
            {/* Backdrop - tap to close */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            {/* Bottom Sheet */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
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
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    sectionText: {
        fontSize: 14,
        color: '#fff',
        lineHeight: 20,
    },
    verdictGuide: {
        borderTopColor: 'rgba(255,255,255,0.10)',
        borderTopWidth: 1,
        marginTop: 18,
        paddingTop: 14,
    },
    verdictGuideTitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.4,
        marginBottom: 8,
    },
    verdictGuideLine: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 12,
        lineHeight: 20,
    },
    sourceBox: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: 'rgba(34, 197, 94, 0.6)',
    },
    sourceLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 4,
    },
    sourceAuthor: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 6,
    },
    sourceTypeChip: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    sourceTypeText: {
        fontSize: 11,
        color: '#4ade80',
        fontWeight: '600',
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
