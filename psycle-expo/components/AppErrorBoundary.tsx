import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../lib/i18n";
import { theme } from "../lib/theme";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  resetKey: number;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    resetKey: 0,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ui-error-boundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="warning-outline" size={28} color={theme.colors.warn} />
            </View>
            <Text style={styles.title}>{String(i18n.t("common.error"))}</Text>
            <Text style={styles.body}>{String(i18n.t("common.unexpectedError"))}</Text>
            <Pressable style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>{String(i18n.t("common.retry"))}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      );
    }

    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.sub,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  button: {
    minWidth: 160,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
