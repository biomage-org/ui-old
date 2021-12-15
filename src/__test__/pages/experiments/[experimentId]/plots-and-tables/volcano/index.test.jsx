import React from 'react';

import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent } from '@testing-library/react';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import _ from 'lodash';

import mockAPI, {
  generateDefaultMockAPIResponses,
  statusResponse,
  delayedResponse,
  workerResponse,
} from '__test__/test-utils/mockAPI';

import volcanoPlotPage from 'pages/experiments/[experimentId]/plots-and-tables/volcano';

import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import { loadBackendStatus } from 'redux/actions/backendStatus';

import mockDiffExprResult from '__test__/data/differential_expression_0_All_WT1.json';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import { seekFromAPI } from 'utils/work/seekWorkResponse';

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'volcanoPlotMain';
const defaultProps = { experimentId };

jest.mock('object-hash', () => {
  const objectHash = jest.requireActual('object-hash');
  const mockWorkResultETag = jest.requireActual('__test__/test-utils/mockWorkResultETag').default;

  const mockWorkRequestETag = () => 'differential-expression';

  return mockWorkResultETag(objectHash, mockWorkRequestETag);
});

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true,
  seekFromAPI: jest.fn(),
  seekFromS3: () => Promise.resolve(null),
}));

jest.mock('@aws-amplify/auth', () => ({}));

// Worker responses are fetched from S3, so these endpoints are added to fetchMock
// the URL for the endpoints are generated by the functions passed to mockETag above
const mockWorkerResponses = {
  'differential-expression': mockDiffExprResult,
};

const customAPIResponses = {
  [`/plots-tables/${plotUuid}`]: () => statusResponse(404, 'Not Found'),
};

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  customAPIResponses,
  mockWorkerResponses,
);

const volcanoPlotPageFactory = createTestComponentFactory(volcanoPlotPage, defaultProps);
const renderVolcanoPlotPage = async (store) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {volcanoPlotPageFactory()}
      </Provider>,
    )
  ));
};

let storeState = null;

const runComparison = async () => {
  // Choose cell set 1
  const selectCellSet1 = screen.getByRole('combobox', { name: /Compare cell set/i });
  await act(async () => {
    fireEvent.change(selectCellSet1, { target: { value: 'Cluster 0' } });
  });

  const cellSet1Option = screen.getByText(/Cluster 0/);
  await act(async () => {
    fireEvent.click(cellSet1Option);
  });

  // Select the 2nd cell set
  const selectCellSet2 = screen.getByRole('combobox', { name: /and cell set/i });
  await act(async () => {
    fireEvent.change(selectCellSet2, { target: { value: 'All' } });
  });

  const cellSet2Option = screen.getByText(/All other cells/);
  await act(async () => {
    fireEvent.click(cellSet2Option);
  });

  // With all samples
  const selectSampleOrGroup = screen.getByRole('combobox', { name: /within sample/i });
  await act(async () => {
    fireEvent.change(selectSampleOrGroup, { target: { value: 'WT1' } });
  });

  const sampleOrGroupOption = screen.getByText(/WT1/);
  await act(async () => {
    fireEvent.click(sampleOrGroupOption);
  });

  // Run the comparison
  await act(async () => {
    userEvent.click(screen.getByText(/Compute/i));
  });
};

describe('Volcano plot page', () => {
  beforeEach(async () => {
    seekFromAPI.mockClear();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();
    await storeState.dispatch(loadBackendStatus(experimentId));
  });

  it('Loads controls and elements', async () => {
    await renderVolcanoPlotPage(storeState);

    expect(screen.getByText(/Differential expression/i)).toBeInTheDocument();
    expect(screen.getByText(/Main schema/i)).toBeInTheDocument();
    expect(screen.getByText(/Data thresholding/i)).toBeInTheDocument();
    expect(screen.getByText(/Axes and margins/i)).toBeInTheDocument();
    expect(screen.getByText(/Colours/i)).toBeInTheDocument();
    expect(screen.getByText(/Markers/i)).toBeInTheDocument();
    expect(screen.getByText(/Add labels/i)).toBeInTheDocument();
    expect(screen.getByText(/Legend/i)).toBeInTheDocument();
  });

  it('Asks the user to make comparison to get started', async () => {
    await renderVolcanoPlotPage(storeState);

    expect(screen.getByText(/Create a comparison to get started/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();
  });

  it('Loads the plot when user has made comparisons', async () => {
    seekFromAPI.mockImplementation(
      (a, b, c, requested) => Promise.resolve(_.cloneDeep(mockWorkerResponses[requested])),
    );

    await renderVolcanoPlotPage(storeState);

    await runComparison();

    // The plot should show up
    expect(screen.getByRole('graphics-document', { name: 'Vega visualization' })).toBeInTheDocument();

    // The CSV download button should be enabled
    const csvButton = screen.getByText(/Export as CSV/i).closest('button');
    expect(csvButton).toBeEnabled();
  });

  it('Shows loader if diff expression is still loading', async () => {
    seekFromAPI.mockImplementation(() => delayedResponse({ body: 'Not found', status: 404 }));

    await renderVolcanoPlotPage(storeState);

    await runComparison();

    expect(screen.getByText(/We're getting your data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();

    // The CSV download button should be disabled
    const csvButton = screen.getByText(/Export as CSV/i).closest('button');
    expect(csvButton).toBeDisabled();
  });

  it('Shows platform error if loading diff expression result failed ', async () => {
    seekFromAPI.mockImplementation(() => workerResponse('Not Found', 404));

    await renderVolcanoPlotPage(storeState);

    await runComparison();

    expect(screen.getByText(/Could not load differential expression data/i)).toBeInTheDocument();
    expect(screen.queryByRole('graphics-document', { name: 'Vega visualization' })).toBeNull();

    // The CSV download button should be disabled
    const csvButton = screen.getByText(/Export as CSV/i).closest('button');
    expect(csvButton).toBeDisabled();
  });
});
