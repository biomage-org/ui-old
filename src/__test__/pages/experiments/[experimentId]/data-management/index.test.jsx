import React from 'react';
import _ from 'lodash';

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { Provider } from 'react-redux';

import { makeStore } from 'redux/store';

import '__test__/test-utils/mockWorkerBackend';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import mockAPI, { generateDefaultMockAPIResponses, promiseResponse } from '__test__/test-utils/mockAPI';
import {
  experiments,
  samples,
} from '__test__/test-utils/mockData';

import DataManagementPage from 'pages/data-management';
import userEvent from '@testing-library/user-event';

import { setActiveExperiment } from 'redux/actions/experiments';
import loadEnvironment from 'redux/actions/networkResources/loadEnvironment';

jest.mock('utils/data-management/downloadFromUrl');
jest.mock('react-resize-detector', () => (props) => props.children({ width: 100, height: 100 }));

const mockNavigateTo = jest.fn();

jest.mock('utils/AppRouteProvider', () => ({
  useAppRouter: jest.fn(() => ({
    navigateTo: mockNavigateTo,
  })),
}));

jest.mock('@aws-amplify/auth', () => ({
  currentAuthenticatedUser: jest.fn(() => Promise.resolve({ attributes: { name: 'mockUserName' } })),
  federatedSignIn: jest.fn(),
}));

// Necessary due to storage being used in the default SamplesTable.
jest.mock('@aws-amplify/storage', () => ({
  configure: jest.fn(),
  get: jest.fn(() => Promise.resolve('https://mock-s3-url.com')),
  list: jest.fn(() => Promise.resolve([
    { key: '1.Example_1.zip' },
    { key: '2.Another-Example_no.2.zip' },
  ])),
}));

const experimentWithSamples = experiments.find((experiment) => experiment.samplesOrder.length > 0);
const experimentWithoutSamples = experiments.find(
  (experiment) => experiment.samplesOrder.length === 0,
);

const expectedSampleNames = [
  'Example 1',
  'Another-Example no.2',
];

const experimentWithSamplesId = experimentWithSamples.id;
const experimentWithoutSamplesId = experimentWithoutSamples.id;

const route = 'data-management';
const defaultProps = { route };

const mockAPIResponse = _.merge(
  generateDefaultMockAPIResponses(experimentWithSamplesId),
  generateDefaultMockAPIResponses(experimentWithoutSamplesId),
);
const dataManagementPageFactory = createTestComponentFactory(DataManagementPage, defaultProps);

let storeState = null;

describe('Data Management page', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    storeState = makeStore();
    storeState.dispatch(loadEnvironment('test'));
  });

  it('Shows an empty project list if there are no projects', async () => {
    const noProjectsResponse = {
      ...mockAPIResponse,
      '/experiments': () => promiseResponse(
        JSON.stringify([]),
      ),
    };

    fetchMock.mockIf(/.*/, mockAPI(noProjectsResponse));

    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    expect(screen.getByText(/Create New Project/i)).toBeInTheDocument();
  });

  it('Clicking "Create New Project" opens create new project modal', async () => {
    await act(() => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    const newProjectButton = screen.getByText(/Create New Project/i).closest('button');

    await act(async () => {
      userEvent.click(newProjectButton);
    });

    expect(screen.getByLabelText(/new project name/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/new project description/i)).toBeInTheDocument();

    expect(screen.getByText(/Create project/i)).toBeInTheDocument();
  });

  it('Has Project Details tile', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    // Select the project with samples
    await act(async () => {
      storeState.dispatch(setActiveExperiment(experimentWithSamplesId));
    });

    expect(screen.getAllByText(/Project Details/i).length).toBeGreaterThan(0);

    const addMetadataButton = screen.getByText(/Add Metadata/i).closest('button');

    expect(addMetadataButton).toBeInTheDocument();

    // We do this because the instruction to add samples also contain "Add samples"
    const addSamplesElement = screen.getAllByText(/Add Samples/i);
    const addSampleButton = addSamplesElement.find((el) => el.closest('button'));

    expect(addSampleButton).toBeInTheDocument();
    expect(addSampleButton).not.toBeDisabled();

    const downloadButton = screen.getByText(/Download/i).closest('button');

    expect(downloadButton).toBeInTheDocument();

    const processProjectButton = screen.getByText(/Process project/i).closest('button');

    expect(processProjectButton).toBeInTheDocument();
  });

  it('Shows samples table if project contain samples', async () => {
    // Change to project with samples
    await act(async () => {
      render(
        <Provider store={storeState}>
          {dataManagementPageFactory()}
        </Provider>,
      );
    });

    // There are 2 elements with the name of the project,  because of how Antd renders the element
    // so we're only choosing one
    const projectOption = screen.getAllByText(experimentWithSamples.name)[0];

    await act(async () => {
      userEvent.click(projectOption);
    });

    Object.keys(samples).forEach((sample) => {
      expect(screen.getByText(samples[sample].name)).toBeInTheDocument();
    });
  });
});
