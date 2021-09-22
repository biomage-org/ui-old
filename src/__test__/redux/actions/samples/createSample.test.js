import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import createSample from '../../../../redux/actions/samples/createSample';
import initialSampleState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';
import initialExperimentState, { experimentTemplate } from '../../../../redux/reducers/experiments/initialState';

import { SAMPLES_CREATE } from '../../../../redux/actionTypes/samples';

import updateExperiment from '../../../../redux/actions/experiments/updateExperiment';

jest.mock('../../../../redux/actions/experiments/updateExperiment');
updateExperiment.mockImplementation(() => async () => { });

jest.mock('localforage');

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('createSample action', () => {
  const mockSampleUuid = 'abc123';
  const mockProjectUuid = 'qwe234';
  const mockExperimentId = 'exp234';

  const mockType = '10x Chromium';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: mockSampleUuid,
  };

  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: mockProjectUuid,
    experiments: [mockExperimentId],
  };

  const mockExperiment = {
    ...experimentTemplate,
    name: 'Experiment 1',
    id: mockExperimentId,
  };

  const initialState = {
    samples: {
      ...initialSampleState,
      [mockSampleUuid]: mockSample,
    },
    experiments: {
      ...initialExperimentState,
      [mockExperimentId]: mockExperiment,
    },
    projects: {
      ...initialProjectState,
      ids: [mockProjectUuid],
      [mockProjectUuid]: mockProject,
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Runs correctly', async () => {
    const store = mockStore(initialState);

    await store.dispatch(createSample(mockProjectUuid, mockSample.name, mockType));

    // Dispatches create sample action
    const action1 = store.getActions()[0];
    expect(action1.type).toEqual(SAMPLES_CREATE);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v1/projects/${mockProjectUuid}/${mockProject.experiments[0]}/samples`);

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toEqual(expect.objectContaining({
      name: mockSample.name,
      projectUuid: mockProjectUuid,
    }));

    // Calls update experiment on success of fetch
    expect(updateExperiment).toHaveBeenCalled();
  });
});
