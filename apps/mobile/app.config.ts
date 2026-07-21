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
  const gitCommitSha =
    process.env.GITHUB_SHA ?? process.env.EAS_BUILD_GIT_COMMIT_HASH ?? 'local';
  const buildNumber = process.env.GITHUB_RUN_NUMBER ?? process.env.BUILD_NUMBER ?? 'local';
  const buildProfile = process.env.EAS_BUILD_PROFILE ?? environment;

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
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: './assets/brand-symbol.png',
        backgroundColor: '#020A07',
      },
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      userInterfaceStyle: 'automatic',
    },
    plugins: [
      'expo-router',
      '@maplibre/maplibre-react-native',
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
      mapProvider: 'maplibre-openfreemap',
      releaseProvenance: {
        gitCommitSha,
        buildNumber,
        buildProfile,
      },
      eas: {
        projectId: '687b4ec3-9a18-40fc-b7f9-b12babbe1d71',
      },
    },
  };
}

export default ({ config }: ConfigContext): ExpoConfig => createExpoConfig(config);
