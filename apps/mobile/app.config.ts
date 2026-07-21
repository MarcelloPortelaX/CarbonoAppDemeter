import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppEnvironment = 'development' | 'preview' | 'production';

function resolveEnvironment(): AppEnvironment {
  const configured = process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV;

  if (configured === 'preview' || configured === 'production') {
    return configured;
  }

  return 'development';
}

export function createExpoConfig(baseConfig: Partial<ExpoConfig>): ExpoConfig {
  const environment = resolveEnvironment();
  const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const isNativeReleaseBuild = Boolean(process.env.EAS_BUILD_PROFILE) || environment !== 'development';

  if (isNativeReleaseBuild && !mapsApiKey) {
    throw new Error(
      'GOOGLE_MAPS_API_KEY is required for preview and production Android builds.',
    );
  }

  return {
    ...baseConfig,
    name: 'Demeter Carbono',
    slug: 'demeter-carbono',
    owner: 'demeterrealm',
    version: '0.2.0',
    orientation: 'portrait',
    scheme: 'demetercarbono',
    userInterfaceStyle: 'automatic',
    icon: './assets/brand-symbol.png',
    ios: {
      ...baseConfig.ios,
      supportsTablet: true,
      bundleIdentifier: 'com.demeter.carbono',
      userInterfaceStyle: 'automatic',
    },
    android: {
      ...baseConfig.android,
      package: 'com.demeter.carbono',
      adaptiveIcon: {
        foregroundImage: './assets/brand-symbol.png',
        backgroundColor: '#020A07',
      },
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      userInterfaceStyle: 'automatic',
    },
    plugins: [
      'expo-router',
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: mapsApiKey ?? '',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'O Demeter usa sua localização para facilitar a delimitação da área.',
        },
      ],
      'expo-system-ui',
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          image: './assets/brand-symbol.png',
          imageWidth: 220,
          resizeMode: 'contain',
          backgroundColor: '#F6F8F6',
          dark: {
            image: './assets/brand-symbol.png',
            backgroundColor: '#020A07',
          },
        },
      ],
      'expo-font',
      'expo-status-bar',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...baseConfig.extra,
      appEnvironment: environment,
      mapsConfigured: Boolean(mapsApiKey),
      eas: {
        projectId: '687b4ec3-9a18-40fc-b7f9-b12babbe1d71',
      },
    },
  };
}

export default ({ config }: ConfigContext): ExpoConfig => createExpoConfig(config);
