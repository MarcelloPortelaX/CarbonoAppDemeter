import type { ExpoConfig } from 'expo/config';
import { createExpoConfig } from '../../../app.config';

const baseConfig: ExpoConfig = {
  name: 'Demeter Carbono',
  slug: 'demeter-carbono',
};

const originalEnvironment = process.env;

describe('Expo Maps configuration', () => {
  beforeEach(() => {
    process.env = { ...originalEnvironment };
    delete process.env.APP_ENV;
    delete process.env.EXPO_PUBLIC_APP_ENV;
    delete process.env.EAS_BUILD_PROFILE;
    delete process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GITHUB_SHA;
    delete process.env.GITHUB_RUN_NUMBER;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('allows local development without embedding a Maps key', () => {
    const config = createExpoConfig(baseConfig);

    expect(config.extra?.appEnvironment).toBe('development');
    expect(config.extra?.mapsConfigured).toBe(false);
  });

  it('rejects preview builds without a Maps key', () => {
    process.env.APP_ENV = 'preview';

    expect(() => createExpoConfig(baseConfig)).toThrow('GOOGLE_MAPS_API_KEY');
  });

  it('passes the build key only to the native Maps plugin', () => {
    process.env.APP_ENV = 'preview';
    process.env.GOOGLE_MAPS_API_KEY = 'test-build-key';
    process.env.GITHUB_SHA = 'dc3786d123456789';
    process.env.GITHUB_RUN_NUMBER = '42';

    const config = createExpoConfig(baseConfig);
    const mapsPlugin = config.plugins?.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'react-native-maps',
    );

    expect(mapsPlugin).toEqual([
      'react-native-maps',
      { androidGoogleMapsApiKey: 'test-build-key' },
    ]);
    expect(config.extra).not.toHaveProperty('googleMapsApiKey');
    expect(config.extra?.mapsConfigured).toBe(true);
    expect(config.extra?.releaseProvenance).toEqual({
      gitCommitSha: 'dc3786d123456789',
      buildNumber: '42',
      buildProfile: 'preview',
    });
  });
});
