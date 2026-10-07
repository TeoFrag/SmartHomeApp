import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useDeviceContext } from "./context/DeviceContext";

export default function LoginScreen() {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const router = useRouter();

  const { login, darkMode } = useDeviceContext();

  const theme = {
    background: darkMode ? "#121212" : "#f4f6f8",
    card: darkMode ? "#1e1e1e" : "#ffffff",
    textMain: darkMode ? "#ffffff" : "#2c3e50",
    textSub: darkMode ? "#aaaaaa" : "#7f8c8d",
    inputBg: darkMode ? "#2a2a2a" : "#f4f6f8",
    inputBorder: darkMode ? "#444444" : "#e0e6ed",
  };

  const handleLogin = async () => {
    if (!usernameInput || !passwordInput) {
      Alert.alert("Προσοχή", "Παρακαλώ συμπληρώστε email και κωδικό.");
      return;
    }

    try {
      const response = await fetch(
        "http://10.64.44.134:8000/auth/v1/token?grant_type=password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MTU0MjE3LCJleHAiOjIwMzA2NzAwMDB9.1u7FC7aK_c3E6VQUsCoTCY006_KrsCUcdPo2JUScU0U",
          },
          body: JSON.stringify({
            email: usernameInput.trim().toLowerCase(),
            password: passwordInput,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.access_token) {
        await login(data.access_token);
        router.replace("/");
      } else {
        Alert.alert(
          "Σφάλμα Σύνδεσης",
          data.error_description || "Λάθος email ή κωδικός πρόσβασης.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Σφάλμα Δικτύου",
        "Δεν ήταν δυνατή η σύνδεση με τον server. Βεβαιωθείτε ότι είστε συνδεδεμένοι στο VPN της σχολής.",
      );
      console.log("Login Error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <LinearGradient
          colors={["#4facfe", "#00f2fe"]}
          style={styles.logoCircle}
        >
          <Ionicons name="home" size={40} color="white" />
        </LinearGradient>

        <Text style={[styles.title, { color: theme.textMain }]}>
          Καλωσήρθατε
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSub }]}>
          Συνδεθείτε στο Smart Home σας
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSub }]}>Email</Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.textSub}
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, { color: theme.textMain }]}
              placeholder="π.χ. user@email.com"
              placeholderTextColor={theme.textSub}
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSub }]}>
            Κωδικός Πρόσβασης
          </Text>
          <View
            style={[
              styles.inputBox,
              {
                backgroundColor: theme.inputBg,
                borderColor: theme.inputBorder,
              },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.textSub}
              style={styles.icon}
            />
            <TextInput
              style={[styles.input, { color: theme.textMain }]}
              placeholder="••••"
              placeholderTextColor={theme.textSub}
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <LinearGradient
            colors={["#4facfe", "#00f2fe"]}
            style={styles.buttonGradient}
          >
            <Text style={styles.loginButtonText}>Είσοδος</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 30,
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 5,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    height: 55,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  loginButton: {
    width: "100%",
    marginTop: 10,
  },
  buttonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 55,
    borderRadius: 15,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
});
