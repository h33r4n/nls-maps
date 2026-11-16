import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as LiveActivity from 'expo-live-activity';
import { getState, setState } from './store';

export const GPS_TASK = 'nls-background-gps';

const ISLAND_LOOK: LiveActivity.LiveActivityConfig = {
  backgroundColor: '#0B0B0B',
  titleColor: '#FFFFFF',
  subtitleColor: '#A8A8A8',
  progressViewTint: '#FFFFFF',
  progressViewLabelColor: '#FFFFFF',
  timerType: 'circular',
  padding: { horizontal: 18, vertical: 14 },
};

function islandState(): LiveActivity.LiveActivityState {
  const s = getState();
  const kmh = s.last?.speed != null && s.last.speed >= 0 ? Math.round(s.last.speed * 3.6) : 0;
  return {
    title: `NLS · fix ${s.fixes}`,
    subtitle: s.last ? `${kmh} km/h · ${s.last.lat.toFixed(4)}, ${s.last.lng.toFixed(4)}` : 'waiting for gps…',
    progressBar: { progress: (s.fixes % 20) / 20 },
  };
}

// Must be defined at the top level (imported from index.ts) so iOS can wake it in the background.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(GPS_TASK, async ({ data, error }) => {
  if (error) {
    setState({ error: error.message });
    return;
  }
  const locs = data?.locations ?? [];
  if (!locs.length) return;
  const l = locs[locs.length - 1];
  const s = getState();
  setState({
    fixes: s.fixes + locs.length,
    backgroundFixes: s.appActive ? s.backgroundFixes : s.backgroundFixes + locs.length,
    last: { lat: l.coords.latitude, lng: l.coords.longitude, speed: l.coords.speed, time: l.timestamp },
  });
  const id = getState().islandId;
  if (id) {
    try {
      LiveActivity.updateActivity(id, islandState());
    } catch (e) {
      setState({ error: `Island update failed: ${String(e)}` });
    }
  }
});

export async function startGps(): Promise<string | null> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'Location permission was denied. Turn it on in Settings → NLS Maps → Location.';
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return 'Background location is off. Go to Settings → NLS Maps → Location and pick "Always".';
  if (await Location.hasStartedLocationUpdatesAsync(GPS_TASK)) {
    setState({ gpsOn: true });
    return null;
  }
  await Location.startLocationUpdatesAsync(GPS_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 0,
    timeInterval: 1000,
    activityType: Location.LocationActivityType.AutomotiveNavigation,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
  });
  setState({ gpsOn: true, error: null });
  return null;
}

export function startIsland(): string | null {
  if (getState().islandId) return null;
  try {
    const id = LiveActivity.startActivity(islandState(), ISLAND_LOOK);
    if (!id) return 'The Dynamic Island didn\'t start. Check Settings → NLS Maps → Live Activities is on.';
    setState({ islandId: id, error: null });
    return null;
  } catch (e) {
    return `The Dynamic Island failed to start: ${String(e)}`;
  }
}

export async function stopAll() {
  const id = getState().islandId;
  if (id) {
    try {
      LiveActivity.stopActivity(id, { ...islandState(), title: 'NLS · stopped' });
    } catch {
      // ignore
    }
  }
  if (await Location.hasStartedLocationUpdatesAsync(GPS_TASK)) {
    await Location.stopLocationUpdatesAsync(GPS_TASK);
  }
  setState({ gpsOn: false, islandId: null });
}
