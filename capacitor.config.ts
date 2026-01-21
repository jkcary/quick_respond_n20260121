import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eaa.vocabularyagent',
  appName: 'English AI Agent',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
    // For development: enable cleartext traffic
    cleartext: true,
  },

  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
    },
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a', // Tailwind slate-900
      showSpinner: false,
    },

    // Speech Recognition will use Web Speech API via browser
    // No native plugin required

    // File system access for vocabulary data
    Filesystem: {
      iosEncryptedContainerName: 'eaa_data',
    },
  },
};

export default config;
