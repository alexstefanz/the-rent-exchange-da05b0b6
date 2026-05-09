import { useEffect, useState } from "react";

const KEY = "rentli_recently_viewed_v1";
const MAX = 10;

export interface RecentItem {
  id: string;
  slug?: string | null;
  title: string;
  image?: string;
  price: number;
  city?: string | null;
  viewedAt: number;
}

const read = (): RecentItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
};

const write = (items: RecentItem[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX))); } catch {}
};

export const trackRecentlyViewed = (item: Omit<RecentItem, "viewedAt">) => {
  const list = read().filter(i => i.id !== item.id);
  list.unshift({ ...item, viewedAt: Date.now() });
  write(list);
};

export const useRecentlyViewed = (excludeId?: string) => {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    setItems(read().filter(i => i.id !== excludeId));
  }, [excludeId]);
  return items;
};