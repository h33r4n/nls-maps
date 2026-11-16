import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import type { PlaceKind } from './places';

export type SavedTag = 'home' | 'work' | 'fav';
export type Saved = { id: string; tag: SavedTag; name: string; detail?: string; lat: number; lng: number; kind: PlaceKind };

const KEY = 'nls.saved.v1';
let list: Saved[] = [];
const subs = new Set<(l: Saved[]) => void>();

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      list = JSON.parse(raw);
      subs.forEach((f) => f(list));
    }
  })
  .catch(() => {});

function persist(next: Saved[]) {
  list = next;
  subs.forEach((f) => f(list));
  AsyncStorage.setItem(KEY, JSON.stringify(list)).catch(() => {});
}

export const sameSpot = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) =>
  Math.abs(a.lat - b.lat) < 0.0002 && Math.abs(a.lng - b.lng) < 0.0002;

export function savePlace(p: Omit<Saved, 'id'>) {
  // Home and Work are single slots; favourites can be many.
  const rest = list.filter((s) => !sameSpot(s, p) && !(p.tag !== 'fav' && s.tag === p.tag));
  persist([...rest, { ...p, id: `${Date.now()}` }]);
}

export function removePlace(p: { lat: number; lng: number }) {
  persist(list.filter((s) => !sameSpot(s, p)));
}

export function useSaved() {
  const [l, setL] = useState(list);
  useEffect(() => {
    subs.add(setL);
    setL(list);
    return () => {
      subs.delete(setL);
    };
  }, []);
  const order: Record<SavedTag, number> = { home: 0, work: 1, fav: 2 };
  return [...l].sort((a, b) => order[a.tag] - order[b.tag]);
}

export const tagLabel = (t: SavedTag) => (t === 'home' ? 'Home' : t === 'work' ? 'Work' : 'Saved');
