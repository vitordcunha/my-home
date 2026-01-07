import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nossacasa.app',
  appName: 'Nossa Casa',
  webDir: 'dist',
  server: {
    // Permite que o app faça requisições para URLs externas (Supabase)
    androidScheme: 'https',
    iosScheme: 'https',
    // Importante para autenticação OAuth e deep linking
    cleartext: true,
  },
  ios: {
    // Configurações para deep linking e autenticação
    scheme: 'com.nossacasa.app',
  },
};

export default config;
