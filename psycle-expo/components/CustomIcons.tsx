import React from "react";
import Svg, { Path, Circle, Defs, LinearGradient, RadialGradient, Stop, G, Rect, ClipPath, Ellipse, Text } from "react-native-svg";
import { ViewStyle, StyleProp } from "react-native";

interface IconProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
    color?: string; // Optional override
}

// ==================== GEM ICON 💎 ====================
// Emerald crystal with proper facet depth, specular highlight, ambient halo.
// Color ignores `color` prop intentionally — gems are semantically green.
export function GemIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="gemBody" x1="50" y1="10" x2="50" y2="90">
                    <Stop offset="0" stopColor="#34d399" />
                    <Stop offset="0.5" stopColor="#10b981" />
                    <Stop offset="1" stopColor="#047857" />
                </LinearGradient>
                <LinearGradient id="gemTop" x1="50" y1="10" x2="50" y2="40">
                    <Stop offset="0" stopColor="#a7f3d0" />
                    <Stop offset="1" stopColor="#10b981" />
                </LinearGradient>
                <LinearGradient id="gemHighlight" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
                    <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                </LinearGradient>
            </Defs>
            {/* Ambient halo */}
            <Circle cx="50" cy="52" r="46" fill="#10b981" opacity={0.12} />
            {/* Body (bottom facets) */}
            <Path d="M10 38 L50 92 L90 38 L74 12 L26 12 Z" fill="url(#gemBody)" />
            {/* Table (top plane) — lighter facets separated from body */}
            <Path d="M10 38 L26 12 L74 12 L90 38 Z" fill="url(#gemTop)" />
            {/* Central top facet triangle */}
            <Path d="M26 12 L50 38 L74 12 Z" fill="#6ee7b7" opacity={0.85} />
            {/* Girdle seam (body/top boundary) */}
            <Path d="M10 38 L90 38" stroke="#065f46" strokeWidth="1.2" strokeOpacity={0.75} />
            {/* Facet rib down to culet */}
            <Path d="M50 38 L50 92" stroke="#065f46" strokeWidth="0.8" strokeOpacity={0.4} />
            <Path d="M26 12 L50 92" stroke="#065f46" strokeWidth="0.6" strokeOpacity={0.3} />
            <Path d="M74 12 L50 92" stroke="#065f46" strokeWidth="0.6" strokeOpacity={0.3} />
            {/* Specular highlight — defines the material */}
            <Path d="M28 16 L38 14 L42 32 L32 34 Z" fill="url(#gemHighlight)" opacity={0.9} />
            {/* Sparkle speck */}
            <Circle cx="33" cy="22" r="1.5" fill="#ffffff" opacity={0.95} />
        </Svg>
    );
}

// ==================== STREAK ICON 🔥 ====================
// Three-tongue flame with rising embers. Warm crafted palette, not stock SVG.
// Color is semantic (fire = orange/red), ignores `color` prop.
export function StreakIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="flameOuter" x1="50" y1="10" x2="50" y2="95">
                    <Stop offset="0" stopColor="#fb923c" />
                    <Stop offset="0.6" stopColor="#ef4444" />
                    <Stop offset="1" stopColor="#991b1b" />
                </LinearGradient>
                <LinearGradient id="flameInner" x1="50" y1="30" x2="50" y2="88">
                    <Stop offset="0" stopColor="#fef3c7" />
                    <Stop offset="0.5" stopColor="#fbbf24" />
                    <Stop offset="1" stopColor="#f97316" />
                </LinearGradient>
            </Defs>
            {/* Warm halo */}
            <Ellipse cx="50" cy="60" rx="46" ry="42" fill="#f97316" opacity={0.18} />
            {/* Outer flame: 3 tongues (main + 2 side licks) */}
            <Path
                d="M50 92 C28 92 14 77 14 58
                   C14 40 22 28 32 22
                   C32 32 36 38 40 40
                   C42 28 50 14 50 6
                   C50 14 58 28 60 40
                   C64 38 68 32 68 22
                   C78 28 86 40 86 58
                   C86 77 72 92 50 92 Z"
                fill="url(#flameOuter)"
            />
            {/* Inner hotter flame */}
            <Path
                d="M50 86 C36 86 26 74 26 60
                   C26 46 38 32 44 22
                   C46 36 50 42 50 42
                   C50 42 54 36 56 22
                   C62 32 74 46 74 60
                   C74 74 64 86 50 86 Z"
                fill="url(#flameInner)"
                opacity={0.9}
            />
            {/* Bright core */}
            <Ellipse cx="50" cy="68" rx="7" ry="11" fill="#fffbeb" opacity={0.7} />
            {/* Rising embers */}
            <Circle cx="38" cy="14" r="1.6" fill="#fbbf24" opacity={0.9} />
            <Circle cx="64" cy="10" r="1.2" fill="#fbbf24" opacity={0.75} />
            <Circle cx="72" cy="22" r="1" fill="#fde68a" opacity={0.6} />
        </Svg>
    );
}

// ==================== ENERGY BOLT ICON ⚡ ====================
// Tapered bolt with inner hotline, amber-gold palette (not generic blue).
// Color is semantic (energy = amber/electric-gold), ignores `color` prop.
export function EnergyIcon({ size = 24, style }: IconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="boltBody" x1="50" y1="5" x2="50" y2="95">
                    <Stop offset="0" stopColor="#fde047" />
                    <Stop offset="0.5" stopColor="#f59e0b" />
                    <Stop offset="1" stopColor="#b45309" />
                </LinearGradient>
                <LinearGradient id="boltInner" x1="50" y1="10" x2="50" y2="90">
                    <Stop offset="0" stopColor="#fffbeb" stopOpacity={0.95} />
                    <Stop offset="1" stopColor="#fbbf24" stopOpacity={0.3} />
                </LinearGradient>
            </Defs>
            {/* Halo */}
            <Ellipse cx="50" cy="50" rx="46" ry="46" fill="#f59e0b" opacity={0.16} />
            {/* Main bolt */}
            <Path
                d="M56 5 L22 55 L46 55 L38 95 L82 42 L56 42 Z"
                fill="url(#boltBody)"
                stroke="#78350f"
                strokeWidth="1.2"
                strokeOpacity={0.6}
                strokeLinejoin="round"
            />
            {/* Inner hotline — a thinner bolt overlaid for a "lit filament" feel */}
            <Path
                d="M54 14 L32 52 L48 52 L43 80 L72 44 L54 44 Z"
                fill="url(#boltInner)"
            />
            {/* Spark particles */}
            <Circle cx="18" cy="38" r="1.6" fill="#fde047" opacity={0.9} />
            <Circle cx="85" cy="30" r="1.2" fill="#fde047" opacity={0.8} />
            <Circle cx="80" cy="72" r="1.4" fill="#fde047" opacity={0.75} />
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

// ==================== CHRYSALIS REWARD POD ====================
// A teardrop/chrysalis pod (not a circle) hanging with a thin tether.
// Closed: dim pod with a firefly glow inside.
// Opened: pod splits, firefly escapes trailing light.
// `color` accepts the course themeColor so it tints subtly but keeps warm
// inner light consistent (reads as "reward" across all courses).
export function ChestIcon({ size = 24, style, open = false, color }: IconProps & { open?: boolean }) {
    const tint = color || "#ec4899";
    if (open) {
        return (
            <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
                <Defs>
                    <RadialGradient id="podBurst" cx="50%" cy="45%" r="55%">
                        <Stop offset="0" stopColor="#fffbeb" stopOpacity={1} />
                        <Stop offset="0.35" stopColor="#fde68a" stopOpacity={0.9} />
                        <Stop offset="0.75" stopColor={tint} stopOpacity={0.4} />
                        <Stop offset="1" stopColor={tint} stopOpacity={0} />
                    </RadialGradient>
                </Defs>
                {/* Ambient halo */}
                <Circle cx="50" cy="45" r="48" fill={tint} opacity={0.12} />
                <Circle cx="50" cy="45" r="32" fill="#fde68a" opacity={0.22} />
                {/* Rays (6 tapered) */}
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const x1 = 50 + Math.cos(rad) * 18;
                    const y1 = 45 + Math.sin(rad) * 18;
                    const x2 = 50 + Math.cos(rad) * 40;
                    const y2 = 45 + Math.sin(rad) * 40;
                    return (
                        <Path
                            key={deg}
                            d={`M${x1} ${y1} L${x2} ${y2}`}
                            stroke="#fef3c7"
                            strokeWidth="2"
                            strokeLinecap="round"
                            opacity={0.8}
                        />
                    );
                })}
                {/* Split pod shells (left and right curled open) */}
                <Path d="M30 58 Q22 50 26 38 Q32 32 38 38 L38 58 Z" fill={tint} opacity={0.85} />
                <Path d="M70 58 Q78 50 74 38 Q68 32 62 38 L62 58 Z" fill={tint} opacity={0.85} />
                {/* Escaping firefly / bright core */}
                <Circle cx="50" cy="45" r="14" fill="url(#podBurst)" />
                <Circle cx="50" cy="45" r="5" fill="#fffbeb" />
                {/* Floating sparks */}
                <Circle cx="24" cy="22" r="1.8" fill="#fef3c7" opacity={0.85} />
                <Circle cx="78" cy="26" r="1.4" fill="#fef3c7" opacity={0.75} />
                <Circle cx="82" cy="70" r="1.6" fill="#fef3c7" opacity={0.8} />
                <Circle cx="22" cy="72" r="1.3" fill="#fef3c7" opacity={0.7} />
            </Svg>
        );
    }
    // Closed: chrysalis pod with internal firefly glow
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
            <Defs>
                <LinearGradient id="podShell" x1="50" y1="20" x2="50" y2="90">
                    <Stop offset="0" stopColor={tint} stopOpacity={0.85} />
                    <Stop offset="0.6" stopColor={tint} stopOpacity={0.55} />
                    <Stop offset="1" stopColor={tint} stopOpacity={0.3} />
                </LinearGradient>
                <RadialGradient id="podInnerLight" cx="50%" cy="55%" r="35%">
                    <Stop offset="0" stopColor="#fef3c7" stopOpacity={0.95} />
                    <Stop offset="0.6" stopColor={tint} stopOpacity={0.5} />
                    <Stop offset="1" stopColor={tint} stopOpacity={0} />
                </RadialGradient>
            </Defs>
            {/* Soft halo */}
            <Ellipse cx="50" cy="56" rx="36" ry="42" fill={tint} opacity={0.15} />
            {/* Tether (hanging from top) */}
            <Path d="M50 8 L50 22" stroke={tint} strokeWidth="1.5" strokeOpacity={0.55} strokeLinecap="round" />
            <Circle cx="50" cy="8" r="2" fill={tint} opacity={0.6} />
            {/* Pod body — teardrop/chrysalis (wide mid, narrow top) */}
            <Path
                d="M50 22
                   C30 22 20 42 20 60
                   C20 80 34 92 50 92
                   C66 92 80 80 80 60
                   C80 42 70 22 50 22 Z"
                fill="url(#podShell)"
                stroke={tint}
                strokeWidth="1"
                strokeOpacity={0.6}
            />
            {/* Seam (suggests it will open) */}
            <Path d="M50 26 L50 86" stroke="#fef3c7" strokeWidth="0.8" strokeOpacity={0.5} strokeDasharray="2,3" />
            {/* Inner firefly glow — offset low so it reads as contained light */}
            <Circle cx="50" cy="62" r="20" fill="url(#podInnerLight)" />
            <Circle cx="50" cy="62" r="4" fill="#fffbeb" opacity={0.95} />
            {/* Surface highlight (specular on shell) */}
            <Path d="M36 32 Q30 44 32 58" stroke="#fef3c7" strokeWidth="1.5" strokeOpacity={0.4} strokeLinecap="round" fill="none" />
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
