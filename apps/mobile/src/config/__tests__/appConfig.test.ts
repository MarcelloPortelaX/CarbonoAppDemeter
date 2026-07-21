import type { ExpoConfig } from 'expo/config';
import { createExpoConfig } from '../../../app.config';

const baseConfig: ExpoConfig = {
  name: 'Demeter Carbono',
  slug: 'demeter-carbono',
};

const originalEnvironment = process.env;

describe('Expo map configuration', () => {
  beforeEach(() => {
    process.env = { ...originalEnvironment };
    delete process.env.APP_ENV;
    delete process.env.EXPO_PUBLIC_APP_ENV;
    delete process.env.EAS_BUILD_PROFILE;
    delete process.env.GITHUB_SHA;
    delete process.env.GITHUB_RUN_NUMBER;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('uses MapLibre without requiring an API key', () => {
    const config = createExpoConfig(baseConfig);

    expect(config.extra?.appEnvironment).toBe('development');
    expect(config.extra?.mapProvider).toBe('maplibre-openfreemap');
    expect(config.plugins).toContain('@maplibre/maplibre-react-native');
  });

  it('allows preview builds without a Maps key', () => {
    process.env.APP_ENV = 'preview';

    expect(() => createExpoConfig(baseConfig)).not.toThrow();
  });

  it('keeps release provenance without exposing key configuration', () => {
    process.env.APP_ENV = 'preview';
    process.env.GITHUB_SHA = 'dc3786d123456789';
    process.env.GITHUB_RUN_NUMBER = '42';

    const config = createExpoConfig(baseConfig);
    expect(config.extra).not.toHaveProperty('googleMapsApiKey');
    expect(config.extra?.releaseProvenance).toEqual({
      gitCommitSha: 'dc3786d123456789',
      buildNumber: '42',
      buildProfile: 'preview',
    });
  });
});
