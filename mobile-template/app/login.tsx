import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";

const PRIMARY = "#F59E0B";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "login") await signIn(email.trim(), password);
      else await signUp(email.trim(), password, fullName.trim());
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Eroare", e?.message ?? "Ceva nu a mers bine.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Eroare", e?.message ?? "Autentificarea Google a eșuat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>Rentli</Text>
      <Text style={styles.subtitle}>
        {mode === "login" ? "Bine ai revenit" : "Creează-ți contul"}
      </Text>

      {mode === "signup" && (
        <TextInput
          style={styles.input}
          placeholder="Nume complet"
          value={fullName}
          onChangeText={setFullName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Parolă"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryBtn} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {mode === "login" ? "Autentificare" : "Creează cont"}
          </Text>
        )}
      </Pressable>

      <Pressable style={styles.ghostBtn} onPress={google} disabled={busy}>
        <Text style={styles.ghostBtnText}>Continuă cu Google</Text>
      </Pressable>

      <Pressable onPress={() => setMode(mode === "login" ? "signup" : "login")}>
        <Text style={styles.switch}>
          {mode === "login" ? "Nu ai cont? Înregistrează-te" : "Ai deja cont? Autentifică-te"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCFAF8", padding: 24, justifyContent: "center", gap: 12 },
  brand: { fontSize: 32, fontWeight: "800", color: PRIMARY, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#78716C", textAlign: "center", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7E2DC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  ghostBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7E2DC",
    backgroundColor: "#fff",
  },
  ghostBtnText: { color: "#1B1917", fontWeight: "600", fontSize: 15 },
  switch: { textAlign: "center", color: "#78716C", marginTop: 12 },
});