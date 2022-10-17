import _ from 'lodash';
import React from 'react';
import { Provider } from 'react-redux';
import {
  render, screen, waitFor,
} from '@testing-library/react';
import fake from '__test__/test-utils/constants';
import NormalizedMatrixIndex, { plotUuid } from 'pages/experiments/[experimentId]/plots-and-tables/normalized-matrix/index';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { plotNames } from 'utils/constants';

import { makeStore } from 'redux/store';
import { selectOption } from '__test__/test-utils/rtlHelpers';
import mockAPI, { generateDefaultMockAPIResponses, promiseResponse, statusResponse } from '__test__/test-utils/mockAPI';

import fetchWork from 'utils/work/fetchWork';
import writeToFileURL from 'utils/writeToFileURL';
import downloadFromUrl from 'utils/downloadFromUrl';

jest.mock('utils/work/fetchWork');
jest.mock('utils/writeToFileURL');
jest.mock('utils/downloadFromUrl');

jest.mock('react-resize-detector', () => (props) => {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return children({ width: 800, height: 800 });
});

describe('Normalized matrix index page', () => {
  let storeState = null;

  const mockResponse = jest.fn();
  // simulating intial load of plot
  const customAPIResponses = {
    [`/plots/${plotUuid}`]: mockResponse,
  };
  const mockApiResponses = _.merge(
    generateDefaultMockAPIResponses(fake.EXPERIMENT_ID), customAPIResponses,
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(mockApiResponses));
    storeState = makeStore();
  });

  const renderNormalizedMatrixIndex = async () => {
    await act(async () => render(
      <Provider store={storeState}>
        <NormalizedMatrixIndex
          experimentId={fake.EXPERIMENT_ID}
        />
      </Provider>,
    ));
  };

  it('Renders correctly', async () => {
    mockResponse.mockImplementation((req) => {
      if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
      return statusResponse(404, 'Not Found');
    });

    await renderNormalizedMatrixIndex();
    expect(screen.getByText(plotNames.NORMALIZED_EXPRESSION_MATRIX)).toBeInTheDocument();

    expect(screen.getByText(/Select the parameters for subsetting the normalized expression matrix./i)).toBeInTheDocument();

    expect(screen.getByText(/Subset by samples/i)).toBeInTheDocument();
    expect(screen.getByText(/Subset by metadata group/i)).toBeInTheDocument();
    expect(screen.getByText(/Subset by clusters/i)).toBeInTheDocument();
    expect(screen.getByText(/Subset by custom cell sets/i)).toBeInTheDocument();
  });

  it('Dispatches download with no subset', async () => {
    mockResponse.mockImplementation((req) => {
      if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
      return statusResponse(404, 'Not Found');
    });

    const result = 'csvFormatData';
    const writeToFileURLResult = 'writeToFileURL';

    fetchWork.mockImplementationOnce(() => Promise.resolve(result));
    writeToFileURL.mockImplementationOnce(() => writeToFileURLResult);

    await renderNormalizedMatrixIndex();

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Download' }));
    });

    expect(fetchWork).toHaveBeenCalledWith(
      fake.EXPERIMENT_ID,
      expect.objectContaining({
        name: 'GetNormalizedExpression',
        subsetBy: {
          louvain: [], metadata: [], sample: [], scratchpad: [],
        },
      }),
      expect.anything(),
    );

    await waitFor(() => {
      expect(writeToFileURL).toHaveBeenCalledWith(result);
      expect(downloadFromUrl).toHaveBeenCalledWith(writeToFileURLResult, 'NormalizedExpression.csv');
    });
  });

  it('Dispatches download with subset', async () => {
    mockResponse.mockImplementation((req) => {
      if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
      return statusResponse(404, 'Not Found');
    });

    const result = 'csvFormatData';
    const writeToFileURLResult = 'writeToFileURL';

    fetchWork.mockImplementationOnce(() => Promise.resolve(result));
    writeToFileURL.mockImplementationOnce(() => writeToFileURLResult);

    await renderNormalizedMatrixIndex();

    const sampleSelect = screen.getAllByRole('combobox')[0];
    await act(async () => {
      await selectOption('WT1', sampleSelect);
    });

    const louvainSelect = screen.getAllByRole('combobox')[2];
    await act(async () => {
      await selectOption('Cluster 1', louvainSelect);
      await selectOption('Cluster 5', louvainSelect);
    });

    await act(async () => {
      userEvent.click(screen.getByRole('button', { name: 'Download' }));
    });

    expect(fetchWork).toHaveBeenCalledWith(
      fake.EXPERIMENT_ID,
      expect.objectContaining({
        name: 'GetNormalizedExpression',
        subsetBy: {
          louvain: ['louvain-1', 'louvain-5'], metadata: [], sample: ['ab568662-27fa-462c-9435-625594341314'], scratchpad: [],
        },
      }),
      expect.anything(),
    );

    await waitFor(() => {
      expect(writeToFileURL).toHaveBeenCalledWith(result);
      expect(downloadFromUrl).toHaveBeenCalledWith(writeToFileURLResult, 'NormalizedExpression.csv');
    });
  });

  it('Displays the persisted config', async () => {
    mockResponse.mockImplementation((req) => {
      if (req.method === 'PUT') return promiseResponse(JSON.stringify('OK'));
      return promiseResponse(JSON.stringify({
        config: {
          louvain: ['louvain-3', 'louvain-6'],
          sample: ['b62028a1-ffa0-4f10-823d-93c9ddb88898'],
          metadata: [],
          scratchpad: [],
        },
      }));
    });

    const result = 'csvFormatData';
    const writeToFileURLResult = 'writeToFileURL';

    fetchWork.mockImplementationOnce(() => Promise.resolve(result));
    writeToFileURL.mockImplementationOnce(() => writeToFileURLResult);

    await renderNormalizedMatrixIndex();

    expect(screen.getByText('Cluster 3')).toBeDefined();
    expect(screen.getByText('Cluster 6')).toBeDefined();
    expect(screen.getByText('KO')).toBeDefined();
  });
});