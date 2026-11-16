import { registerRootComponent } from 'expo';

// Registers the background GPS task before anything else runs.
import './src/nav';
import App from './App';

registerRootComponent(App);
