import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import ProductCard from "../../components/ProductCard";
import { listProducts, type Product } from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function HomeScreen() {
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await listProducts({ search });
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Nu am putut încărca anunțurile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!authLoading && !session) router.replace("/login");
  }, [authLoading, session]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Închiriază orice, oriunde</Text>
      <TextInput
        style={styles.search}
        placeholder="Caută un produs..."
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#F59E0B" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/product/${item.slug ?? item.id}`)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Niciun anunț găsit.</Text>}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCFAF8", paddingHorizontal: 12, paddingTop: 56 },
  heading: { fontSize: 22, fontWeight: "800", color: "#1B1917", marginBottom: 12, paddingHorizontal: 6 },
  search: {
    backgroundColor: "#fff",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E7E2DC",
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 12,
    marginHorizontal: 6,
  },
  empty: { textAlign: "center", color: "#78716C", marginTop: 32 },
  error: { textAlign: "center", color: "#B91C1C", marginTop: 32 },
});