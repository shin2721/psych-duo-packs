import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { getPackInfo, GenreId } from '../lib/paywall';
import i18n from '../lib/i18n';

interface PaywallModalProps {
    visible: boolean;
    genreId: GenreId;
    onClose: () => void;
    onPurchase: (genreId: string) => void;
}

export function PaywallModal({ visible, genreId, onClose, onPurchase }: PaywallModalProps) {
    const packInfo = getPackInfo(genreId);
    const benefits = [
        i18n.t('paywallModal.benefits.accessAllLevels'),
        i18n.t('paywallModal.benefits.advancedEvidenceQuestions'),
        i18n.t('paywallModal.benefits.practicalSkills'),
        i18n.t('paywallModal.benefits.lifetimeAccess'),
    ];

    const handlePurchase = () => {
        onPurchase(genreId);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Close button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.emoji}>{packInfo.emoji}</Text>
                        <Text style={styles.title}>{packInfo.name}</Text>
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
                        <Text style={styles.price}>¥{Math.round(packInfo.price * 150)}</Text>
                        <Text style={styles.priceSubtext}>{i18n.t('paywallModal.oneTimePurchase')}</Text>

                        <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
                            <Text style={styles.purchaseButtonText}>{i18n.t('paywallModal.purchasePack')}</Text>
                        </TouchableOpacity>

                        {/* Dev note */}
                        <Text style={styles.devNote}>
                            {i18n.t('paywallModal.devNote')}
                        </Text>
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
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    emoji: {
        fontSize: 64,
        marginBottom: theme.spacing.md,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.sub,
    },
    benefitsContainer: {
        marginBottom: theme.spacing.lg,
    },
    benefitsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    benefitText: {
        fontSize: 14,
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
    price: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: theme.spacing.xs,
    },
    priceSubtext: {
        fontSize: 12,
        color: theme.colors.sub,
        marginBottom: theme.spacing.lg,
    },
    purchaseButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radius.lg,
        width: '100%',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    purchaseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    devNote: {
        fontSize: 10,
        color: theme.colors.sub,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
