import { usePropertyStore } from '../propertyStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// To test migration, we need to access the migrate function from the persist options.
// Zustand's persist middleware exposes it, but it's easier to just pull it from the store's options if possible,
// or we can test the behavior by hydrating the store.
// Since we don't have direct access to the persist options outside, we can extract the migrate function from the store's persist config if it's exposed,
// or we can just mock AsyncStorage to return old state and see if it migrates on rehydrate.

describe('propertyStore persistence', () => {
  beforeEach(() => {
    // Clear storage before each test
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    AsyncStorage.clear();
    const initialState = usePropertyStore.getState();
    // In zustand persist v4, rehydrate with empty storage doesn't reset the store.
    // Let's reset it manually.
    usePropertyStore.setState({ hydrated: false, properties: initialState.properties, passports: initialState.passports, outbox: [] });
  });

  it('hydrates empty storage safely', async () => {
    await usePropertyStore.persist.rehydrate();
    const state = usePropertyStore.getState();
    expect(state.hydrated).toBe(true);
    // Should use default demo properties since storage is empty
    expect(state.properties.length).toBeGreaterThan(0);
  });

  it('migrates legacy syncStatus to remoteStatus', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    
    // Write legacy v2 state
    const legacyState = {
      state: {
        properties: [
          { id: 'p1', syncStatus: 'synced' },
          { id: 'p2', syncStatus: 'error' },
          { id: 'p3', syncStatus: 'pending' },
        ],
        passports: {},
        outbox: []
      },
      version: 2
    };
    
    await AsyncStorage.setItem('demeter-carbono.mobile.v3', JSON.stringify(legacyState));
    
    // Rehydrate
    await usePropertyStore.persist.rehydrate();
    
    const state = usePropertyStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.properties[0]!.remoteStatus).toBe('created');
    expect(state.properties[1]!.remoteStatus).toBe('error');
    expect(state.properties[2]!.remoteStatus).toBe('local');
    
    // Ensure syncStatus is removed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((state.properties[0] as any).syncStatus).toBeUndefined();
  });

  it('handles corrupted JSON safely', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('demeter-carbono.mobile.v3', '{ invalid json');
    
    await usePropertyStore.persist.rehydrate();
    const state = usePropertyStore.getState();
    
    expect(state.hydrated).toBe(true); // Should still become hydrated
  });

  it('handles partially corrupted state gracefully during migration', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    
    // Invalid state structure
    const corruptedState = {
      state: {
        properties: null,
        passports: "not an object",
        outbox: {}
      },
      version: 2
    };
    
    await AsyncStorage.setItem('demeter-carbono.mobile.v3', JSON.stringify(corruptedState));
    
    await usePropertyStore.persist.rehydrate();
    
    const state = usePropertyStore.getState();
    expect(state.hydrated).toBe(true);
    expect(Array.isArray(state.properties)).toBe(true);
    expect(typeof state.passports).toBe('object');
    expect(Array.isArray(state.outbox)).toBe(true);
  });
});
