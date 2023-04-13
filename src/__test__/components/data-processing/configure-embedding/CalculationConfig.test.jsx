import React from 'react';
import {
  screen, render, waitFor, fireEvent,
} from '@testing-library/react';
import { Provider } from 'react-redux';

import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import CalculationConfig from 'components/data-processing/ConfigureEmbedding/CalculationConfig';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import loadProcessingSettings from 'redux/actions/experimentSettings/processingConfig/loadProcessingSettings';
import { makeStore } from 'redux/store';
import '__test__/test-utils/setupTests';
import { selectOption } from '__test__/test-utils/rtlHelpers';
import { addChangedQCFilter } from 'redux/actions/experimentSettings';
import runCellSetsClustering from 'redux/actions/cellSets/runCellSetsClustering';

import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';
import userEvent from '@testing-library/user-event';

jest.mock('redux/actions/cellSets/runCellSetsClustering', () => jest.fn(() => ({ type: 'MOCK_ACTION' })));

const FILTER_UUID = 'configureEmbedding';

const mockOnPipelineRun = jest.fn();
const mockOnConfigChange = jest.fn();

const defaultProps = {
  experimentId: '1234',
  width: 50,
  height: 50,
  onPipelineRun: mockOnPipelineRun,
  onConfigChange: mockOnConfigChange,
};

const calculationConfigFactory = createTestComponentFactory(CalculationConfig, defaultProps);

const renderCalculationConfig = (store, props = {}) => render(
  <Provider store={store}>
    {calculationConfigFactory(props)}
  </Provider>,
);

enableFetchMocks();

const mockAPIResponses = generateDefaultMockAPIResponses(fake.EXPERIMENT_ID);

let storeState = null;

describe('Data Processing CalculationConfig', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponses));

    storeState = makeStore();
    await storeState.dispatch(loadProcessingSettings(fake.EXPERIMENT_ID));
  });

  it('Renders correctly', () => {
    renderCalculationConfig(storeState);

    expect(screen.getByText('Embedding settings')).toBeInTheDocument();
    expect(screen.getByText('Method')).toBeInTheDocument();

    // By default method is UMAP
    expect(screen.getByText('Settings for UMAP:')).toBeInTheDocument();
    expect(screen.getByText('Minimum distance')).toBeInTheDocument();
    expect(screen.getByText('Distance metric')).toBeInTheDocument();

    expect(screen.getByText('Clustering settings')).toBeInTheDocument();
    expect(screen.getByText('Clustering method')).toBeInTheDocument();
    expect(screen.getByText('Resolution')).toBeInTheDocument();
  });

  it('Renders t-SNE settings correctly', async () => {
    renderCalculationConfig(storeState);

    const methodSelector = screen.getAllByRole('combobox')[0];
    await selectOption(/t-SNE/, methodSelector);

    // Change to t-SNE
    expect(screen.getByText('Settings for t-SNE:')).toBeInTheDocument();
    expect(screen.getByText('Perplexity')).toBeInTheDocument();
    expect(screen.getByText('Learning rate')).toBeInTheDocument();
  });

  it('Changing embedding settings should show an alert', async () => {
    const spyOnConfigChange = jest.fn(() => {
      storeState.dispatch(addChangedQCFilter(FILTER_UUID));
    });

    renderCalculationConfig(storeState, {
      onConfigChange: spyOnConfigChange,
    });

    const methodSelection = screen.getAllByRole('combobox')[0];
    await selectOption(/t-SNE/, methodSelection);

    expect(spyOnConfigChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Your changes are not yet applied. To update the plots, click Run.')).toBeInTheDocument();
  });

  it('Changing resolution settings should show cluster button', async () => {
    renderCalculationConfig(storeState);

    const resolutionSettings = screen.getAllByRole('spinbutton')[1];
    fireEvent.change(resolutionSettings, { target: { value: 4.0 } });

    await waitFor(async () => {
      expect(screen.getByText('Cluster')).toBeInTheDocument();
    });

    userEvent.click(screen.getByText('Cluster'));
    expect(runCellSetsClustering).toHaveBeenCalledTimes(1);
  });

  it('Changing resolution settings to initial value should remove the cluster button ', async () => {
    renderCalculationConfig(storeState);

    const resolutionSettings = screen.getAllByRole('spinbutton')[1];
    fireEvent.change(resolutionSettings, { target: { value: 4.0 } });

    await waitFor(async () => {
      expect(screen.getByText('Cluster')).toBeInTheDocument();
    });

    // Changing back to initial value, which is 0.8
    fireEvent.change(resolutionSettings, { target: { value: 0.8 } });

    await waitFor(() => {
      expect(screen.queryByText('Cluster')).toBeNull();
    });
  });
});
