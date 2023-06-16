import { initialComponentConfigStates } from 'redux/reducers/componentConfig/initialState';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';
import getSelectedMetadataTracks from 'redux/selectors/componentConfig/getSelectedMetadataTracks';

describe('Get cell sets selector test', () => {
  const existingClusters = ['cluster-a', 'cluster-b'];
  const nonExistingCluster = [...existingClusters, 'this-doesnt-exist'];
  const mockState = {
    componentConfig: {
      interactiveHeatmap: { config: { selectedTracks: existingClusters } },
    },
    cellSets: mockCellSets,
  };
  it('should return tracks if cellsets are defined', () => {
    console.log('INITIAL COMPONENT CONFIG ', initialComponentConfigStates.interactiveHeatmap);
    expect(getSelectedMetadataTracks('interactiveHeatmap')(mockState)).toEqual(existingClusters);
  });

  it('if a metadata track doesnt exist, dont return it', () => {
    mockState.componentConfig.interactiveHeatmap.config.selectedTracks = nonExistingCluster;
    // selector still returns only the existing clusters
    expect(getSelectedMetadataTracks('interactiveHeatmap')(mockState)).toEqual(existingClusters);
  });
});