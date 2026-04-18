import React from "react";
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop, G, Rect, ClipPath, Ellipse, Text } from "react-native-svg";
import { ViewStyle, StyleProp } from "react-native";

interface IconProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
    color?: string; // Optional override
}

// ==================== GEM ICON 💎 ====================
// Minimal faceted crystal, tinted to themeColor for cosmos coherence.
export function GemIcon({ size = 24, style, color }: IconProps) {
    const tint = color || "#ec4899";
    const gid = `gemGrad_${tint.replace("#", "")}`;
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id={gid} x1="50" y1="5" x2="50" y2="95">
                    <Stop offset="0" stopColor={tint} stopOpacity={0.9} />
                    <Stop offset="1" stopColor={tint} stopOpacity={0.35} />
                </LinearGradient>
            </Defs>
            {/* Soft outer glow */}
            <Path d="M10 35 L50 90 L90 35 L70 12 L30 12 Z" fill={tint} opacity={0.18} transform="scale(1.08) translate(-4 -4)" />
            {/* Body */}
            <Path
                d="M10 35 L50 90 L90 35 L70 12 L30 12 Z"
                fill={`url(#${gid})`}
                stroke={tint}
                strokeWidth="1.5"
                strokeOpacity={0.75}
                strokeLinejoin="round"
            />
            {/* Facet lines only, no fills */}
            <Path d="M10 35 L90 35" stroke={tint} strokeWidth="1" strokeOpacity={0.4} />
            <Path d="M30 12 L50 35 L70 12" stroke={tint} strokeWidth="1" strokeOpacity={0.4} fill="none" />
            <Path d="M50 35 L50 90" stroke="#ffffff" strokeWidth="1" strokeOpacity={0.35} />
        </Svg>
    );
}

// ==================== STREAK ICON 🔥 ====================
// A soft ember/flame in themeColor. No cartoon yellow core, no red shadow.
export function StreakIcon({ size = 24, style, color }: IconProps) {
    const tint = color || "#f97316";
    const gid = `emberGrad_${tint.replace("#", "")}`;
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id={gid} x1="50" y1="5" x2="50" y2="95">
                    <Stop offset="0" stopColor="#fef3c7" stopOpacity={0.95} />
                    <Stop offset="0.55" stopColor={tint} stopOpacity={0.9} />
                    <Stop offset="1" stopColor={tint} stopOpacity={0.3} />
                </LinearGradient>
            </Defs>
            {/* Glow */}
            <Path
                d="M50 92 C28 92 14 76 14 56 C14 30 50 6 50 6 C50 6 86 30 86 56 C86 76 72 92 50 92 Z"
                fill={tint}
                opacity={0.18}
                transform="scale(1.12) translate(-6 -6)"
            />
            {/* Flame */}
            <Path
                d="M50 92 C28 92 14 76 14 56 C14 30 50 6 50 6 C50 6 86 30 86 56 C86 76 72 92 50 92 Z"
                fill={`url(#${gid})`}
            />
            {/* Inner light core */}
            <Ellipse cx="50" cy="62" rx="10" ry="16" fill="#fef3c7" opacity={0.45} />
        </Svg>
    );
}

// ==================== ENERGY BOLT ICON ⚡ ====================
// Clean bolt in themeColor. No thick white stroke, no blue gradient.
export function EnergyIcon({ size = 24, style, color }: IconProps) {
    const tint = color || "#ec4899";
    const gid = `boltGrad_${tint.replace("#", "")}`;
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id={gid} x1="50" y1="5" x2="50" y2="95">
                    <Stop offset="0" stopColor={tint} stopOpacity={0.95} />
                    <Stop offset="1" stopColor={tint} stopOpacity={0.55} />
                </LinearGradient>
            </Defs>
            {/* Glow */}
            <Path
                d="M55 5 L25 55 L50 55 L40 95 L80 40 L55 40 L55 5 Z"
                fill={tint}
                opacity={0.25}
                transform="scale(1.1) translate(-5 -5)"
            />
            {/* Bolt */}
            <Path
                d="M55 5 L25 55 L50 55 L40 95 L80 40 L55 40 L55 5 Z"
                fill={`url(#${gid})`}
                stroke={tint}
                strokeWidth="1.5"
                strokeOpacity={0.8}
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ==================== TROPHY ICON 🏆 ====================
// Gold cup
export function TrophyIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="goldGrad" x1="0" y1="0" x2="100" y2="100">
                    <Stop offset="0" stopColor="#fde047" />
                    <Stop offset="0.5" stopColor="#eab308" />
                    <Stop offset="1" stopColor="#a16207" />
                </LinearGradient>
            </Defs>

            {/* Cup Body */}
            <Path d="M20 20 H80 L70 60 C70 75 50 80 50 80 C50 80 30 75 30 60 L20 20 Z" fill="url(#goldGrad)" />

            {/* Base */}
            <Path d="M40 80 L60 80 L65 95 L35 95 Z" fill="#854d0e" />

            {/* Handles */}
            <Path d="M20 25 C5 25 5 50 20 50" stroke="#ca8a04" strokeWidth="6" fill="none" />
            <Path d="M80 25 C95 25 95 50 80 50" stroke="#ca8a04" strokeWidth="6" fill="none" />

            {/* Shine */}
            <Path d="M30 25 L40 25 L35 70 Z" fill="white" opacity={0.3} />
        </Svg>
    );
}

// ==================== REWARD ORB (Luminous bud / bloom) ====================
// Replaces the cartoony treasure chest with a soft glowing orb that matches the
// cosmos/firefly world. Accepts `color` to tint with the course themeColor.
export function ChestIcon({ size = 24, style, open = false, color }: IconProps & { open?: boolean }) {
    const tint = color || "#ec4899";
    const gradId = open ? "rewardBloom" : "rewardBud";
    if (open) {
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
                <Defs>
                    <LinearGradient id={gradId} x1="50" y1="10" x2="50" y2="90">
                        <Stop offset="0" stopColor="#fef3c7" />
                        <Stop offset="0.5" stopColor={tint} stopOpacity={0.9} />
                        <Stop offset="1" stopColor={tint} stopOpacity={0.2} />
                    </LinearGradient>
                </Defs>
                {/* Outer halo */}
                <Circle cx="50" cy="50" r="45" fill={tint} opacity={0.12} />
                <Circle cx="50" cy="50" r="32" fill={tint} opacity={0.22} />
                {/* Rays */}
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const x1 = 50 + Math.cos(rad) * 22;
                    const y1 = 50 + Math.sin(rad) * 22;
                    const x2 = 50 + Math.cos(rad) * 42;
                    const y2 = 50 + Math.sin(rad) * 42;
                    return (
                        <Path
                            key={deg}
                            d={`M${x1} ${y1} L${x2} ${y2}`}
                            stroke="#fef3c7"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            opacity={0.75}
                        />
                    );
                })}
                {/* Core bloom */}
                <Circle cx="50" cy="50" r="18" fill={`url(#${gradId})`} />
                <Circle cx="50" cy="50" r="8" fill="#fffbeb" opacity={0.95} />
                {/* Sparkles */}
                <Circle cx="22" cy="22" r="2" fill="#fef3c7" opacity={0.9} />
                <Circle cx="78" cy="30" r="1.5" fill="#fef3c7" opacity={0.8} />
                <Circle cx="80" cy="75" r="2" fill="#fef3c7" opacity={0.85} />
                <Circle cx="25" cy="78" r="1.5" fill="#fef3c7" opacity={0.75} />
            </Svg>
        );
    }
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#fef3c7" stopOpacity={0.95} />
                    <Stop offset="0.35" stopColor={tint} stopOpacity={0.85} />
                    <Stop offset="0.8" stopColor={tint} stopOpacity={0.25} />
                    <Stop offset="1" stopColor={tint} stopOpacity={0} />
                </RadialGradient>
            </Defs>
            {/* Faint outer halo */}
            <Circle cx="50" cy="50" r="44" fill={tint} opacity={0.08} />
            {/* Seed of light — soft radial fade, no hard outline */}
            <Circle cx="50" cy="50" r="40" fill={`url(#${gradId})`} />
            {/* Offset micro sparkle for organic character */}
            <Circle cx="42" cy="44" r="2" fill="#fffbeb" opacity={0.9} />
        </Svg>
    );
}

// ==================== GENRE ICONS (Duolingo Style) ====================

// 🧠 Mental (Pink Heart)
export function MentalIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Path
                d="M50 90 C50 90 90 65 90 35 C90 15 70 5 50 35 C30 5 10 15 10 35 C10 65 50 90 50 90 Z"
                fill="#ec4899"
            />
            {/* Shine */}
            <Path d="M25 25 Q35 15 45 25" stroke="#fbcfe8" strokeWidth="5" strokeLinecap="round" opacity={0.6} />
        </Svg>
    );
}

// 💰 Money (Gold Bag)
export function MoneyIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            {/* Bag Body */}
            <Path
                d="M50 15 L70 30 C85 40 90 80 80 90 L20 90 C10 80 15 40 30 30 Z"
                fill="#eab308"
            />
            {/* Tie string */}
            <Path d="M30 30 L70 30" stroke="#854d0e" strokeWidth="6" strokeLinecap="round" />
            {/* Dollar Sign */}
            <Text
                x="50" y="75"
                fontSize="40"
                fontWeight="bold"
                fill="#fff"
                textAnchor="middle"
                opacity={0.9}
            >$</Text>
        </Svg>
    );
}

// 💼 Work (Blue Briefcase)
export function WorkIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            {/* Handle */}
            <Path d="M35 30 L35 20 C35 15 65 15 65 20 L65 30" stroke="#1e3a8a" strokeWidth="6" fill="none" />
            {/* Case Body */}
            <Rect x="15" y="30" width="70" height="55" rx="4" fill="#3b82f6" />
            {/* Flap */}
            <Path d="M15 30 L85 30 L85 50 L15 50 Z" fill="#2563eb" />
            {/* Lock */}
            <Rect x="42" y="40" width="16" height="12" rx="2" fill="#93c5fd" />
        </Svg>
    );
}

// ❤️ Health (Dumbbell)
export function HealthIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            {/* Bar */}
            <Rect x="20" y="45" width="60" height="10" rx="2" fill="#9ca3af" />
            {/* Weights Left */}
            <Rect x="10" y="30" width="10" height="40" rx="2" fill="#ef4444" />
            <Rect x="22" y="25" width="8" height="50" rx="2" fill="#dc2626" />
            {/* Weights Right */}
            <Rect x="80" y="30" width="10" height="40" rx="2" fill="#ef4444" />
            <Rect x="70" y="25" width="8" height="50" rx="2" fill="#dc2626" />
            {/* Shine */}
            <Path d="M12 35 L12 65" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
            <Path d="M82 35 L82 65" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" opacity={0.5} />
        </Svg>
    );
}

// 🤝 Social (Orange People/Hands) -> Using simplified stylized people for clearer icon at small sizes
export function SocialIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            {/* Person 1 (Left, Orange) */}
            <Circle cx="35" cy="35" r="15" fill="#f97316" />
            <Path d="M10 90 Q10 60 35 60 Q60 60 60 90" fill="#f97316" />

            {/* Person 2 (Right, Yellow/Orange overlapping) */}
            <Circle cx="65" cy="35" r="15" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
            <Path d="M40 90 Q40 60 65 60 Q90 60 90 90" fill="#fbbf24" stroke="#fff" strokeWidth="2" />
        </Svg>
    );
}

// 📚 Study (Green Book)
export function StudyIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            {/* Book Cover */}
            <Rect x="20" y="15" width="60" height="70" rx="4" fill="#22c55e" />
            {/* Pages (side) */}
            <Path d="M80 15 L90 20 L90 80 L80 85 Z" fill="#f0fdf4" />
            <Path d="M20 85 L80 85 L90 80 L30 80 Z" fill="#dcfce7" />
            {/* Bookmark */}
            <Path d="M40 15 L40 50 L50 40 L60 50 L60 15 Z" fill="#ef4444" />
        </Svg>
    );
}
