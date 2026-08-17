import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProductBySlug, type Product } from "../../lib/api";

const PRIMARY = "#F59E0B";

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getProductBySlug(String(slug));
        if (active) setProduct(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Produsul nu a putut fi încărcat.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <ActivityIndicator style={{ marginTop: 64 }} color={PRIMARY} />;
  if (error || !product)
    return <Text style={styles.error}>{error ?? "Anunțul nu există."}</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {!!product.images?.[0] && (
        <Image source={{ uri: product.images[0] }} style={styles.hero} resizeMode="cover" />
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{product.title}</Text>
        {!!product.location_city && <Text style={styles.city}>{product.location_city}</Text>}
        <Text style={styles.price}>
          {product.price_per_day} RON <Text style={styles.perDay}>/ zi</Text>
        </Text>
        {!!product.description && <Text style={styles.desc}>{product.description}</Text>}

        <Pressable style={styles.cta} onPress={() => router.push("/")}>
          <Text style={styles.ctaText}>Trimite cerere de închiriere</Text>
        </Pressable>
        <Text style={styles.hint}>
          Conectează acest buton la RPC-ul de creare cerere / edge function-ul de checkout
          (vezi MOBILE_INTEGRATION.md).
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FCFAF8" },
  hero: { width: "100%", height: 260 },
  body: { padding: 20, gap: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#1B1917" },
  city: { fontSize: 14, color: "#78716C" },
  price: { fontSize: 18, fontWeight: "700", color: PRIMARY, marginTop: 4 },
  perDay: { fontSize: 13, fontWeight: "500", color: "#78716C" },
  desc: { fontSize: 15, lineHeight: 22, color: "#44403C", marginTop: 8 },
  cta: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: { fontSize: 12, color: "#A8A29E", marginTop: 8, textAlign: "center" },
  error: { textAlign: "center", marginTop: 64, color: "#B91C1C" },
});