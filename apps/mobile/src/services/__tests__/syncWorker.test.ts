import { processOutbox } from '../syncWorker';
import { usePropertyStore } from '../../state/propertyStore';
import * as api from '../api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../api', () => {
  const actual = jest.requireActual('../api');
  return {
    ...actual,
    submitAssessment: jest.fn(),
    confirmBoundary: jest.fn(),
    createProperty: jest.fn(),
    updateBoundary: jest.fn(),
  };
});
const mockedApi = api as jest.Mocked<typeof api>;

describe('syncWorker - submit_assessment', () => {
  beforeEach(() => {
    usePropertyStore.setState({
      properties: [],
      outbox: [],
      passports: {},
      hydrated: true,
    });
    jest.clearAllMocks();
  });

  const createDummyProperty = (id: string, remoteStatus: import('../../domain/models').RemoteStatus) => ({
    id,
    remoteStatus,
    name: 'Test',
    municipality: 'City',
    state: 'ST',
    areaHa: 10,
    status: 'draft' as const,
    landUse: 'agriculture' as const,
    boundary: [],
    createdAt: new Date().toISOString()
  });

  it('blocks submit_assessment if property is not synced (remoteStatus !== created)', async () => {
    usePropertyStore.setState({
      properties: [createDummyProperty('p1', 'local')],
      outbox: [{ id: 'op1', kind: 'submit_assessment', propertyId: 'p1', payload: { year: 2024 }, status: 'pending', attempt: 0, createdAt: new Date().toISOString() }],
    });

    await processOutbox();
    
    expect(mockedApi.submitAssessment).not.toHaveBeenCalled();
    const ops = usePropertyStore.getState().outbox;
    expect(ops).toHaveLength(1); // not removed
  });

  it('blocks submit_assessment if there are pending boundary operations', async () => {
    usePropertyStore.setState({
      properties: [createDummyProperty('p1', 'created')],
      outbox: [
        { id: 'op1', kind: 'confirm_boundary', propertyId: 'p1', boundaryId: 'b1', status: 'pending', attempt: 0, createdAt: new Date().toISOString() },
        { id: 'op2', kind: 'submit_assessment', propertyId: 'p1', payload: { year: 2024 }, status: 'pending', attempt: 0, createdAt: new Date().toISOString() },
      ],
    });
    
    mockedApi.confirmBoundary.mockResolvedValueOnce({ boundary_id: 'b1', points: [] });

    await processOutbox();
    
    expect(mockedApi.submitAssessment).not.toHaveBeenCalled();
  });

  it('removes submit_assessment after success', async () => {
    usePropertyStore.setState({
      properties: [createDummyProperty('p1', 'created')],
      outbox: [{ id: 'op1', kind: 'submit_assessment', propertyId: 'p1', payload: { year: 2024 }, status: 'pending', attempt: 0, createdAt: new Date().toISOString() }],
    });
    
    mockedApi.submitAssessment.mockResolvedValueOnce(undefined);

    await processOutbox();
    
    expect(mockedApi.submitAssessment).toHaveBeenCalled();
    const ops = usePropertyStore.getState().outbox;
    expect(ops).toHaveLength(0);
  });

  it('marks submit_assessment retryable on network error', async () => {
    usePropertyStore.setState({
      properties: [createDummyProperty('p1', 'created')],
      outbox: [{ id: 'op1', kind: 'submit_assessment', propertyId: 'p1', payload: { year: 2024 }, status: 'pending', attempt: 0, createdAt: new Date().toISOString() }],
    });
    
    mockedApi.submitAssessment.mockRejectedValueOnce(new Error('Network request failed'));

    await processOutbox();
    
    expect(mockedApi.submitAssessment).toHaveBeenCalled();
    const ops = usePropertyStore.getState().outbox;
    expect(ops[0].status).toBe('retryable');
  });

  it('marks submit_assessment failed on 422', async () => {
    usePropertyStore.setState({
      properties: [createDummyProperty('p1', 'created')],
      outbox: [{ id: 'op1', kind: 'submit_assessment', propertyId: 'p1', payload: { year: 2024 }, status: 'pending', attempt: 0, createdAt: new Date().toISOString() }],
    });
    
    mockedApi.submitAssessment.mockRejectedValueOnce(new api.ApiError('Invalid data', 422));

    await processOutbox();
    
    expect(mockedApi.submitAssessment).toHaveBeenCalled();
    const ops = usePropertyStore.getState().outbox;
    expect(ops[0].status).toBe('failed');
  });

  it('does not re-execute failed operations', async () => {
    usePropertyStore.setState({
      properties: [createDummyProperty('p1', 'created')],
      outbox: [{ id: 'op1', kind: 'submit_assessment', propertyId: 'p1', payload: { year: 2024 }, status: 'failed', attempt: 1, createdAt: new Date().toISOString() }],
    });
    
    await processOutbox();
    
    expect(mockedApi.submitAssessment).not.toHaveBeenCalled();
    const ops = usePropertyStore.getState().outbox;
    expect(ops[0].status).toBe('failed'); // remains failed
  });
});
