import Constants from 'expo-constants';

// Filled in at build time from GitHub Secrets (see app.config.js). Empty = feature waits for its key.
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const KEYS = {
  tomtom: extra.tomtomKey || '',
  vicRoads: extra.vicRoadsKey || '',
  ptvDevId: extra.ptvDevId || '',
  ptvKey: extra.ptvKey || '',
};
