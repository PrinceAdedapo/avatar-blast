import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.threex.avatarblast',
  appName: 'Avatar Blast',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2500,
      launchFadeOutDuration: 600,
      backgroundColor: '#000000',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    backgroundColor: '#000000',
  },
};

export default config;
