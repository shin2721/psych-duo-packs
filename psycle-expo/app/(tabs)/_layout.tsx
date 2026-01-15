import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { StarBackground } from "../../components/StarBackground";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";

// 蛍の色（温かみのある黄色〜緑）
const FIREFLY_COLOR = "#eaff00";

function FireflyTabBarIcon({ name, color, size, focused }: { name: keyof typeof Ionicons.glyphMap; color: string; size: number; focused: boolean }) {
  // Firefly animations
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused) {
      // Appear
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

      // Floating movement (Breathing & Bobbing)
      const float = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(translateY, { toValue: -4, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(translateX, { toValue: 3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(translateX, { toValue: -3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ])
      );
      float.start();

      return () => float.stop();
    } else {
      // Disappear
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [focused]);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={name} size={size} color={color} />

      {/* Tiny Firefly Particle */}
      <Animated.View
        style={{
          position: "absolute",
          top: -2,
          right: -4,
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: FIREFLY_COLOR,
          opacity,
          transform: [{ translateY }, { translateX }],
          shadowColor: FIREFLY_COLOR,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
        }}
      />
    </View>
  );
}

const TransparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "transparent",
  },
};

export default function TabLayout() {
  return (
    <ThemeProvider value={TransparentTheme}>
      <View style={{ flex: 1 }}>
        {/* Global Star Background */}
        <StarBackground />

        <Tabs
          // @ts-ignore
          sceneContainerStyle={{ backgroundColor: "transparent" }}
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "rgba(15, 23, 42, 0.8)", // Semi-transparent surface color
              borderTopColor: "rgba(255,255,255,0.1)",
              borderTopWidth: 0,
              height: 88,
              paddingTop: 8,
              position: 'absolute', // Float tab bar over background
              bottom: 0,
              left: 0,
              right: 0,
              elevation: 0,
            },
            tabBarBackground: () => (
              // Blur effect could be added here if using Expo Blur, 
              // but for now just semi-transparent View is fine.
              <View style={{ flex: 1, backgroundColor: "rgba(11, 18, 32, 0.85)" }} />
            ),
            tabBarActiveTintColor: theme.colors.text,
            tabBarInactiveTintColor: theme.colors.sub,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "600",
              marginTop: 4,
            },
          }}
        >
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen
            name="course"
            options={{
              title: "学ぶ",
              tabBarIcon: ({ color, size, focused }) => (
                <FireflyTabBarIcon name="leaf" size={size} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="quests"
            options={{
              title: "クエスト",
              tabBarIcon: ({ color, size, focused }) => (
                <FireflyTabBarIcon name="home" size={size} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="leaderboard"
            options={{
              title: "ランキング",
              tabBarIcon: ({ color, size, focused }) => (
                <FireflyTabBarIcon name="trophy" size={size} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="friends"
            options={{
              title: "フレンド",
              tabBarIcon: ({ color, size, focused }) => (
                <FireflyTabBarIcon name="people" size={size} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="shop"
            options={{
              title: "ショップ",
              tabBarIcon: ({ color, size, focused }) => (
                <FireflyTabBarIcon name="storefront" size={size} color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "プロフィール",
              tabBarIcon: ({ color, size, focused }) => (
                <FireflyTabBarIcon name="person" size={size} color={color} focused={focused} />
              ),
            }}
          />
        </Tabs>
      </View>
    </ThemeProvider>
  );
}
