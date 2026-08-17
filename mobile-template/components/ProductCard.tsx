import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Product } from "../lib/api";

const PRIMARY = "#F59E0B";

export default function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress?: () => void;
}) {
  const image = product.images?.[0];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {product.title}
        </Text>
        {!!product.location_city && (
          <Text style={styles.city} numberOfLines={1}>
            {product.location_city}
          </Text>
        )}
        <Text style={styles.price}>
          {product.price_per_day} RON <Text style={styles.perDay}>/ zi</Text>
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 16, overflow: "hidden", backgroundColor: "#fff" },
  image: { width: "100%", aspectRatio: 16 / 11, borderRadius: 16, backgroundColor: "#EFEAE4" },
  placeholder: { backgroundColor: "#EFEAE4" },
  body: { paddingVertical: 8, gap: 2 },
  title: { fontSize: 14, fontWeight: "600", color: "#1B1917" },
  city: { fontSize: 12, color: "#78716C" },
  price: { fontSize: 14, fontWeight: "700", color: PRIMARY, marginTop: 2 },
  perDay: { fontSize: 12, fontWeight: "500", color: "#78716C" },
});