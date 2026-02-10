import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'AnimeIme',
  webDir: 'www',
  plugins: {
    Geolocation: {
      // Android settings
      permissions: {
        android: {
          location: 'when_in_use' // or 'always'
        }
      }
    }
  }
};

export default config;
