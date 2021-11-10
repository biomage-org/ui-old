import { act } from 'react-dom/test-utils';
import _ from 'lodash';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import { loadPlotConfig } from 'redux/actions/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import endUserMessages from 'utils/endUserMessages';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import fake from '__test__/test-utils/constants';

import { makeStore } from 'redux/store';

jest.mock('utils/pushNotificationMessage');

let testStore = null;

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'cellSizeDistributionHistogramMain';
const plotType = 'cellSizeDistributionHistogram';

const mockData = {
  plotData: [1, 2, 3, 4],
  config: {},
};

const mockConfigData = _.merge({}, initialPlotConfigStates[plotType], mockData);

describe('loadPlotConfig', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    testStore = makeStore();
  });

  it('Loads config properly', async () => {
    fetchMock.mockResponse(() => Promise.resolve(new Response(JSON.stringify(mockConfigData))));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    // Expect componentConfig to contain key for plotUuid
    expect(testStore.getState().componentConfig[plotUuid]).toBeDefined();

    const plotConfig = testStore.getState().componentConfig[plotUuid];

    expect(plotConfig.config).toBeDefined();
    expect(plotConfig.loading).toBeDefined();
    expect(plotConfig.error).toBeDefined();
    expect(plotConfig.plotType).toBe(plotType);

    expect(plotConfig.plotData).toBeDefined();
    expect(_.isEqual(plotConfig.plotData, mockData.plotData)).toBe(true);

    expect(plotConfig).toMatchSnapshot();
  });

  it('Loads default initial config for plots if plot config is not found', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 404, body: JSON.stringify('Plot config not found') }));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    // Expect componentConfig to contain key for plotUuid
    expect(testStore.getState().componentConfig[plotUuid]).toBeDefined();

    const plotConfig = testStore.getState().componentConfig[plotUuid];

    expect(plotConfig.config).toBeDefined();
    expect(plotConfig.loading).toBeDefined();
    expect(plotConfig.error).toBeDefined();
    expect(plotConfig.plotType).toBe(plotType);

    expect(plotConfig.plotData).toBeDefined();
    expect(plotConfig.plotData.length).toEqual(0);

    expect(plotConfig).toMatchSnapshot();
  });

  it('Non-200 response shows an error message', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 500, body: JSON.stringify('Server error') }));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    // Expect componentConfig to contain key for plotUuid
    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', endUserMessages.ERROR_FETCHING_PLOT_CONFIG);
  });

  it('Invalid response format to show an error notification', async () => {
    fetchMock.mockResponse(() => Promise.resolve(new Response('a text body')));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', expect.anything());
  });
});
