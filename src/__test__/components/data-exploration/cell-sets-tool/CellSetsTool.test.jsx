import React from 'react';

import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { fetchWork } from 'utils/work/fetchWork';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { makeStore } from 'redux/store';

import CellSetsTool from 'components/data-exploration/cell-sets-tool/CellSetsTool';
import { createCellSet } from 'redux/actions/cellSets';
import { loadGeneExpression } from 'redux/actions/genes';

import '__test__/test-utils/setupTests';

jest.mock('utils/work/fetchWork');

jest.mock('utils/socketConnection', () => ({
  __esModule: true,
  default: new Promise((resolve) => {
    resolve({ emit: jest.fn(), on: jest.fn(), id: '5678' });
  }),
}));

const cellSetsData = require('__test__/data/cell_sets.json');

const louvainClusters = cellSetsData.cellSets.find(({ key }) => key === 'louvain').children;
const sampleList = cellSetsData.cellSets.find(({ key }) => key === 'sample').children;

const geneExpressionData = require('__test__/data/gene_expression.json');

const experimentId = '1234';

const getClusterByName = (clusterName) => {
  const clusterKey = Object.keys(storeState.getState().cellSets.properties).filter((key) => {
    if (storeState.getState().cellSets.properties[key].name === clusterName) {
      return key;
    }

    return undefined;
  });
  return clusterKey;
};

const defaultProps = {
  experimentId,
  width: 50,
  height: 50,
};

const cellSetsToolFactory = createTestComponentFactory(CellSetsTool, defaultProps);

let storeState;
describe('CellSetsTool', () => {
  beforeEach(async () => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify(cellSetsData));
    storeState = makeStore();
  });

  it('renders correctly cell set tool with no clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    const editButtons = screen.getAllByLabelText(/Edit/);
    expect(editButtons.length).toEqual(2);

    // There should be no delete buttons.
    const deleteButtons = screen.queryByText(/Delete/);
    expect(deleteButtons).toBeNull();
  });

  it('renders correctly cell set tool with clusters in custom cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1, 2, 3, 4, 5])));
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // There should be delete buttons for clusters under Custom cell sets.
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);
  });

  it('cell set operations should not render when no cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    const cellSetOperations = screen.queryByLabelText(/of selected$/i);

    // There should be no operations rendered
    expect(cellSetOperations).toEqual(null);
  });

  it('cell set operations should render when cell sets are selected', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 3');
    userEvent.click(louvain3Cluster);

    const cellSetOperations = screen.getAllByLabelText(/of selected$/i);

    // There should be three operations rendered.
    expect(cellSetOperations.length).toEqual(3);
  });

  it('can compute a union of 2 cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 3');
    userEvent.click(louvain3Cluster);

    // select the fourth louvain cluster
    const louvain4Cluster = screen.getByText('Cluster 4');
    userEvent.click(louvain4Cluster);

    // ensure that initially we have 0 custom cell sets
    expect(screen.queryByText('New Cluster')).toBeNull();

    const unionOperation = screen.getByLabelText(/Union of selected$/i);
    userEvent.click(unionOperation);

    const saveButton = screen.getByLabelText(/Save/i);
    await act(async () => {
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    screen.getByText('New Cluster');
    const newClusterKey = getClusterByName('New Cluster');

    const cluster3CellIds = louvainClusters.find(({ name }) => name === 'Cluster 3').cellIds;
    const cluster4CellIds = louvainClusters.find(({ name }) => name === 'Cluster 4').cellIds;
    const unionCellIds = [...cluster3CellIds, ...cluster4CellIds];

    // test the union cellSet function
    const expectedUnion = new Set(unionCellIds);

    // get the cell ids of the new cluster that got created as the union of those clusters
    const actualUnion = storeState.getState().cellSets.properties[newClusterKey].cellIds;
    expect(actualUnion).toEqual(expectedUnion);
  });

  it('can compute an intersection of 2 cell sets', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the third louvain cluster
    const louvain3Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain3Cluster);

    // create a new cluster with some cells that will overlap:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'test cluster', '#3957ff', new Set([1, 2, 3, 4])));
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // select the newly created cluster
    const scratchpadCluster = screen.getByText('test cluster');
    userEvent.click(scratchpadCluster);

    const intersectOperation = screen.getByLabelText(/Intersection of selected$/i);
    userEvent.click(intersectOperation);

    const saveButton = screen.getByLabelText(/Save/i);
    await act(async () => {
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    const newClusterKey = getClusterByName('New Cluster');
    const actualIntersection = storeState.getState().cellSets.properties[newClusterKey].cellIds;
    const expectedIntersection = new Set([1, 2, 3, 4]);
    expect(actualIntersection).toEqual(expectedIntersection);
  });

  it('New cluster is not created when cancel is clicked', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // create a new cluster with some cells that will overlap:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'test cluster', '#3957ff', new Set([1, 2, 3, 4])));
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // select the newly created cluster
    const scratchpadCluster = screen.getByText('test cluster');
    userEvent.click(scratchpadCluster);

    const intersectOperation = screen.getByLabelText(/Intersection of selected$/i);
    userEvent.click(intersectOperation);

    const cancelButton = screen.getByLabelText(/Cancel/i);
    await act(async () => {
      fireEvent(
        cancelButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(screen.queryByText('New Cluster')).toBeNull();
  });

  it('New cluster is not created if it will contain no cells', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // select the second louvain cluster
    const louvain1Cluster = screen.getByText('Cluster 1');
    userEvent.click(louvain1Cluster);

    // ensure that initially we have 0 custom cell sets
    expect(screen.queryByText('New Cluster')).toBeNull();

    const intersectOperation = screen.getByLabelText(/Intersection of selected$/i);
    userEvent.click(intersectOperation);

    const saveButton = screen.getByLabelText(/Save/i);
    await act(async () => {
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(screen.queryByText('New Cluster')).toBeNull();
  });

  it('cell set operations should work appropriately for complement', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    // compute the complement
    const complementOperation = screen.getByLabelText(/Complement of selected$/i);
    userEvent.click(complementOperation);

    // save the new cluster
    const saveButton = screen.getByLabelText(/Save/i);
    await act(async () => {
      fireEvent(
        saveButton,
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    screen.getByText('New Cluster');
    const newClusterKey = getClusterByName('New Cluster');

    const cluster0CellIds = louvainClusters.find(({ name }) => name === 'Cluster 0').cellIds;
    const allCellIds = sampleList.reduce((sumCellIds, { cellIds }) => sumCellIds.concat(cellIds), []);

    const actualComplement = storeState.getState().cellSets.properties[newClusterKey].cellIds;
    const expectedComplement = new Set(
      allCellIds.filter((cellId) => !cluster0CellIds.includes(cellId)),
    );

    // complement = the whole dataset - first cluster
    expect(actualComplement).toEqual(expectedComplement);
  });

  it('selected number of cell sets is correct', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand the louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    const numCellsCluster0 = louvainClusters.find(({ name }) => name === 'Cluster 0').cellIds.length;

    screen.getByText(`${numCellsCluster0} cells selected`);
  });

  it('Scratchpad cluster deletion works ', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // create a new cluster:
    await act(async () => {
      storeState.dispatch(createCellSet(experimentId, 'New Cluster', '#3957ff', new Set([1, 2, 3, 4, 5])));
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    screen.getByText('New Cluster');

    // There should be a delete button for the scratchpad cluster.
    const deleteButtons = screen.getAllByLabelText(/Delete/);
    expect(deleteButtons.length).toEqual(1);

    // Clicking on one of the buttons...
    userEvent.click(deleteButtons[0]);

    await waitFor(() => expect(screen.queryByText('New Cluster')).toBeNull());
  });

  it('Calculates filtered cell indices correctly', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    fetchWork.mockImplementationOnce(() => new Promise((resolve) => resolve(geneExpressionData)));

    await act(async () => {
      storeState.dispatch(loadGeneExpression(experimentId, ['TestGene'], '1234'));
    });

    // expand custom cell sets tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    // select the first louvain cluster
    const louvain0Cluster = screen.getByText('Cluster 0');
    userEvent.click(louvain0Cluster);

    screen.getByText('24 cells selected');
  });

  it('Displays a cell set hidden message when cluster is hidden', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });
    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // hide the first cluster
    const hideButtons = screen.getAllByText('Hide');
    userEvent.click(hideButtons[0]);

    screen.getByText(/1 cell set is currently hidden./);
    screen.getAllByText(/Unhide all/);
  });

  it('Unhides clusters when the unhide button is presssed', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand custom cell sets tree
    const customCellSetsGroup = screen.getAllByRole('img', { name: 'down' })[1];
    userEvent.click(customCellSetsGroup);

    // hide the first and second cluster
    const hideButtonFirst = screen.getAllByText('Hide')[0];
    const hideButtonSecond = screen.getAllByText('Hide')[1];
    userEvent.click(hideButtonFirst);
    userEvent.click(hideButtonSecond);

    screen.getByText(/2 cell sets are currently hidden./);

    const unhideButton = screen.getAllByText('Unhide');
    expect(unhideButton.length).toEqual(2);

    // now unhide the first cluster
    userEvent.click(unhideButton[0]);

    screen.getByText('Unhide');
    screen.getByText(/1 cell set is currently hidden./);
    screen.getAllByText(/Unhide all/);
  });

  it('Unhides everything when the unhide all button is presssed', async () => {
    await act(async () => {
      render(
        <Provider store={storeState}>
          {cellSetsToolFactory()}
        </Provider>,
      );
    });

    // expand louvain clusters tree
    const louvainCLustersGroup = screen.getAllByRole('img', { name: 'down' })[0];
    userEvent.click(louvainCLustersGroup);

    const hideButtons = screen.getAllByText('Hide');
    expect(hideButtons.length).toEqual(14);

    // hide the first and second cluster
    const hideButtonFirst = screen.getAllByText('Hide')[0];
    const hideButtonSecond = screen.getAllByText('Hide')[1];
    userEvent.click(hideButtonFirst);
    userEvent.click(hideButtonSecond);

    await screen.findByText(/2 cell sets are currently hidden./);

    const unhideAllButton = await screen.findAllByText('Unhide all');
    expect(unhideAllButton.length).toEqual(1);

    // now unhide all clusters
    await act(async () => {
      fireEvent(
        unhideAllButton[0],
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(screen.queryByText(/2 cell sets are currently hidden./)).toBeNull();
    expect(screen.queryByText('Unhide all')).toBeNull();
  });
});
