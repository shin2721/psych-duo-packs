import React from "react";
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Rect, ClipPath, Ellipse, Text } from "react-native-svg";
import { ViewStyle, StyleProp } from "react-native";

interface IconProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
    color?: string; // Optional override
}

// ==================== GEM ICON 💎 ====================
// A vibrant, faceted blue diamond/gem
export function GemIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="gemGrad" x1="20" y1="0" x2="80" y2="100">
                    <Stop offset="0" stopColor="#3debf6" />
                    <Stop offset="1" stopColor="#1ca2f4" />
                </LinearGradient>
            </Defs>
            {/* Shadow */}
            <Path d="M20 50 L50 95 L80 50 L50 20 Z" fill="#0c4a6e" opacity={0.3} transform="translate(0, 4)" />

            {/* Main body (bottom part) */}
            <Path d="M10 35 L50 90 L90 35 L70 10 L30 10 Z" fill="url(#gemGrad)" stroke="#1680c4" strokeWidth="2" strokeLinejoin="round" />

            {/* Top Facets */}
            <Path d="M10 35 L30 10 L70 10 L90 35 Z" fill="#67e8f9" opacity={0.4} />
            <Path d="M30 10 L50 35 L70 10 Z" fill="#cffafe" opacity={0.6} />

            {/* Bottom Facets */}
            <Path d="M10 35 L50 90 L50 35 Z" fill="#0891b2" opacity={0.2} />
            <Path d="M90 35 L50 90 L50 35 Z" fill="#06b6d4" opacity={0.1} />

            {/* Highlight/Sparkle */}
            <Circle cx="30" cy="25" r="3" fill="white" opacity={0.8} />
            <Path d="M75 20 L80 25 L75 30 L70 25 Z" fill="white" opacity={0.6} />
        </Svg>
    );
}

// ==================== STREAK FIRE ICON 🔥 ====================
// A hot orange/red flame for streaks
export function StreakIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="fireGrad" x1="50" y1="10" x2="50" y2="90">
                    <Stop offset="0" stopColor="#fbbf24" />
                    <Stop offset="0.5" stopColor="#f97316" />
                    <Stop offset="1" stopColor="#ef4444" />
                </LinearGradient>
            </Defs>
            {/* Shadow */}
            <Path d="M50 95 Q20 95 20 65 Q20 35 50 5 Q80 35 80 65 Q80 95 50 95 Z" fill="#7f1d1d" opacity={0.3} transform="translate(0, 3)" />

            {/* Main flame */}
            <Path
                d="M50 90 C30 90 15 75 15 55 C15 30 50 5 50 5 C50 5 85 30 85 55 C85 75 70 90 50 90 Z"
                fill="url(#fireGrad)"
            />

            {/* Inner lighter flame */}
            <Path
                d="M50 82 C40 82 30 72 30 60 C30 45 50 25 50 25 C50 25 70 45 70 60 C70 72 60 82 50 82 Z"
                fill="#fcd34d"
                opacity={0.8}
            />

            {/* Highlight core */}
            <Ellipse cx="50" cy="65" rx="8" ry="12" fill="#fff" opacity={0.6} />
        </Svg>
    );
}

// ==================== ENERGY BOLT ICON ⚡ ====================
// An electric blue lightning bolt
export function EnergyIcon({ size = 24, style, color }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="boltGrad" x1="40" y1="10" x2="60" y2="90">
                    <Stop offset="0" stopColor="#60a5fa" />
                    <Stop offset="1" stopColor="#2563eb" />
                </LinearGradient>
            </Defs>

            {/* Shadow */}
            <Path
                d="M55 5 L25 55 L50 55 L40 95 L80 40 L55 40 L55 5 Z"
                fill="#1e3a8a"
                opacity={0.3}
                transform="translate(2, 3)"
            />

            {/* Main bolt */}
            <Path
                d="M55 5 L25 55 L50 55 L40 95 L80 40 L55 40 L55 5 Z"
                fill={color || "url(#boltGrad)"}
                stroke="white"
                strokeWidth="3"
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

// ==================== CHEST ICON 🎁 ====================
// Closed and Open states
export function ChestIcon({ size = 24, style, open = false }: IconProps & { open?: boolean }) {
    if (open) {
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
                {/* Open Chest Back */}
                <Path d="M20 40 L80 40 L70 30 L30 30 Z" fill="#78350f" />
                {/* Box Body */}
                <Path d="M20 40 L20 80 L80 80 L80 40 Z" fill="#b45309" />
                <Rect x="20" y="45" width="60" height="5" fill="#78350f" opacity={0.3} />
                {/* Lid (Open) */}
                <Path d="M20 40 L10 15 L90 15 L80 40 Z" fill="#92400e" opacity={0.9} />
                {/* Gold Trim */}
                <Rect x="45" y="40" width="10" height="10" fill="#facc15" />
                {/* Light Rays if open */}
                <Path d="M30 30 L10 0 M50 30 L50 0 M70 30 L90 0" stroke="#fcd34d" strokeWidth="4" opacity={0.6} />
            </Svg>
        );
    }
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            {/* Lid rounded top */}
            <Path d="M20 45 C20 25 80 25 80 45 Z" fill="#d97706" />
            {/* Body */}
            <Path d="M20 45 L20 85 L80 85 L80 45 Z" fill="#b45309" />
            {/* Separation line */}
            <Rect x="18" y="43" width="64" height="6" rx="2" fill="#78350f" />
            {/* Lock */}
            <Rect x="42" y="40" width="16" height="12" rx="2" fill="#facc15" stroke="#a16207" strokeWidth="1" />
            {/* Metal corners */}
            <Path d="M20 45 L20 85 L30 85 L30 45 Z" fill="#92400e" opacity={0.5} />
            <Path d="M80 45 L80 85 L70 85 L70 45 Z" fill="#92400e" opacity={0.5} />
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
