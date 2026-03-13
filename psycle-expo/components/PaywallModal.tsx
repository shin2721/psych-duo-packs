import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import i18n from '../lib/i18n';
import { getPlanPrice } from '../lib/pricing';
import { Button } from './ui';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
    onUpgrade: () => void | Promise<void>;
}

export function PaywallModal({ visible, onClose, onUpgrade }: PaywallModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const proMonthlyPrice = (() => {
        try {
            return getPlanPrice('pro', 'monthly');
        } catch {
            return i18n.t('shop.subscription.pro.price');
        }
    })();

    const benefits = [
        i18n.t('paywallModal.benefits.accessAllLevels'),
        i18n.t('paywallModal.benefits.smartReview'),
        i18n.t('paywallModal.benefits.mistakesHub'),
        i18n.t('paywallModal.benefits.unlimitedEnergy'),
        i18n.t('paywallModal.benefits.adFree'),
    ];

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    const handleUpgrade = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            await Promise.resolve(onUpgrade());
        } catch (error) {
            console.error('[PaywallModal] Upgrade failed:', error);
        } finally {
            if (mountedRef.current) {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Close button */}
                    <TouchableOpacity
                        style={[styles.closeButton, isSubmitting && styles.closeButtonDisabled]}
                        onPress={handleClose}
                        disabled={isSubmitting}
                        accessibilityRole="button"
                        accessibilityLabel={`${i18n.t('common.close')}: ${i18n.t('paywallModal.title')}`}
                        accessibilityState={{ disabled: isSubmitting }}
                    >
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="sparkles" size={48} color={theme.colors.primary} />
                        <Text style={styles.title}>{i18n.t('paywallModal.title')}</Text>
                        <Text style={styles.subtitle}>{i18n.t('paywallModal.unlockLevels')}</Text>
                    </View>

                    {/* Benefits */}
                    <ScrollView style={styles.benefitsContainer}>
                        <Text style={styles.benefitsTitle}>{i18n.t('paywallModal.benefitsTitle')}</Text>
                        {benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Price and Purchase Button */}
                    <View style={styles.footer}>
                        <Text style={styles.priceFrom}>
                            {i18n.t('paywallModal.priceFrom', { price: proMonthlyPrice })}
                        </Text>
                        <Button
                            label={String(isSubmitting ? i18n.t('common.processing') : i18n.t('shop.subscription.subscribe'))}
                            onPress={handleUpgrade}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            style={styles.purchaseButton}
                        />
                        <Text style={styles.cancelAnytime}>{i18n.t('paywallModal.cancelAnytime')}</Text>
                        <Text style={styles.ctaNote}>{i18n.t('paywallModal.ctaNote')}</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modal: {
        backgroundColor: theme.colors.bg,
        borderRadius: theme.radius.xl,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        padding: theme.spacing.xl,
    },
    closeButton: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 10,
        padding: theme.spacing.sm,
    },
    closeButtonDisabled: {
        opacity: 0.5,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.text,
    },
    subtitle: {
        ...theme.typography.label,
        color: theme.colors.sub,
    },
    benefitsContainer: {
        marginBottom: theme.spacing.lg,
    },
    benefitsTitle: {
        ...theme.typography.label,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    benefitText: {
        ...theme.typography.label,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    footer: {
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.line,
        paddingTop: theme.spacing.lg,
    },
    priceFrom: {
        ...theme.typography.body,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    purchaseButton: {
        width: '100%',
        marginBottom: theme.spacing.md,
    },
    cancelAnytime: {
        marginTop: theme.spacing.sm,
        ...theme.typography.caption,
        color: theme.colors.sub,
        textAlign: 'center',
    },
    ctaNote: {
        marginTop: 4,
        ...theme.typography.caption,
        color: theme.colors.sub,
        textAlign: 'center',
    },
});
