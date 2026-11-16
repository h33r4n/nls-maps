import { Exo2_600SemiBold, Exo2_600SemiBold_Italic, Exo2_800ExtraBold_Italic } from '@expo-google-fonts/exo-2';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MapScreen from './src/MapScreen';

export default function App() {
  // The map shows straight away; fonts swap in as soon as they load.
  useFonts({ Exo2_600SemiBold, Exo2_600SemiBold_Italic, Exo2_800ExtraBold_Italic, SpaceMono_400Regular });

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MapScreen />
    </SafeAreaProvider>
  );
}
