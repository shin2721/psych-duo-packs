import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TouchableWithoutFeedback, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { getEvidenceSummary, getTryValueColor } from '../lib/evidenceSummary';

// Import curated sources for bibliographic info
import curatedSourcesData from '../data/curated_sources.json';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.5; // Slightly taller to show source info

// Type for source entry
interface SourceEntry {
    author: string;
    year: number;
    title: string;
    type: string;
    notes?: string;
}

// Helper to get source info
const getSourceInfo = (sourceId: string | undefined): SourceEntry | null => {
    if (!sourceId) return null;
    const sources = (curatedSourcesData as any).sources || {};
    return sources[sourceId] || null;
};

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
    const [showDetails, setShowDetails] = useState(false);

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
                    toValue: 0.5,
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
            setShowDetails(false); // Reset on close
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
                if (gestureState.dy > 100) {
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

    // Get evidence summary for "まず試す価値" display
    const evidenceSummary = getEvidenceSummary(expandedDetails);
    const tryValueColor = getTryValueColor(evidenceSummary.tryValue);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
            {/* Backdrop - tap to close */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            </TouchableWithoutFeedback>

            {/* Bottom Sheet */}
            <Animated.View
                style={[styles.sheet, { transform: [{ translateY }] }]}
                {...panResponder.panHandlers}
            >
                {/* Handle bar + Close button row */}
                <View style={styles.headerRow}>
                    <View style={styles.handle} />
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* まず試す価値 Summary (Always Visible) */}
                <View style={styles.tryValueSummary}>
                    {/* 判断の一言（最上段） */}
                    <Text style={styles.actionHint}>{evidenceSummary.actionHint}</Text>

                    {/* intervention のみバッジ行を表示（theory/observation は迷いを生むので非表示） */}
                    {expandedDetails?.claim_type === 'intervention' && (
                        <>
                            <View style={styles.tryValueRow}>
                                <Text style={styles.tryValueLabel}>{evidenceSummary.valueLabel}：</Text>
                                <View style={[styles.tryValueBadge, { backgroundColor: tryValueColor }]}>
                                    <Text style={styles.tryValueText}>{evidenceSummary.tryValue}</Text>
                                </View>
                            </View>
                            <Text style={styles.basisLabel}>根拠：{evidenceSummary.basisLabel}</Text>
                        </>
                    )}
                    <Text style={styles.safetyNote}>{evidenceSummary.note}</Text>
                </View>

                {/* Toggle for details */}
                <TouchableOpacity
                    onPress={() => setShowDetails(!showDetails)}
                    style={styles.detailsToggle}
                >
                    <Text style={styles.detailsToggleText}>
                        {showDetails ? "▲ 閉じる" : "▼ 詳しく見る"}
                    </Text>
                </TouchableOpacity>

                {/* Expandable Details */}
                {showDetails && (
                    <>
                        {expandedDetails?.best_for && expandedDetails.best_for.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>✅ 向いているケース</Text>
                                <Text style={styles.sectionText}>{expandedDetails.best_for.join('、')}</Text>
                            </View>
                        )}

                        {expandedDetails?.limitations && expandedDetails.limitations.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>⚠️ 限界</Text>
                                <Text style={styles.sectionText}>{expandedDetails.limitations.join('、')}</Text>
                            </View>
                        )}

                        {/* Source Info */}
                        {(() => {
                            const sourceInfo = getSourceInfo(source_id);
                            if (!sourceInfo) return null;

                            const typeLabel = {
                                'intervention': '実験研究',
                                'observational': '観察研究',
                                'theory': '理論',
                                'review': 'レビュー',
                            }[sourceInfo.type] || sourceInfo.type;

                            return (
                                <View style={styles.sourceBox}>
                                    <Text style={styles.sourceLabel}>📖 出典</Text>
                                    <Text style={styles.sourceAuthor}>{sourceInfo.author} ({sourceInfo.year})</Text>
                                    <View style={styles.sourceTypeChip}>
                                        <Text style={styles.sourceTypeText}>{typeLabel}</Text>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Disclaimer */}
                        <Text style={styles.disclaimer}>
                            ※ 効果の大きさは状況・個人差が大きいため、断定はしていません。
                        </Text>
                    </>
                )}
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
        backgroundColor: theme.colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 40,
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
    disclaimer: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 'auto',
        textAlign: 'center',
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
