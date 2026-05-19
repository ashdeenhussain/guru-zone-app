import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.guruzone.app',
  appName: 'Guru Zone',
  webDir: 'public',
  server: {
    // For development, we can point to localhost
    // For production, this will be your live domain
    url: 'https://guru-zone.com',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
