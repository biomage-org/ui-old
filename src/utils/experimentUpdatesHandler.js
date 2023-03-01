import { updateProcessingSettingsFromQC, loadedProcessingConfig, updatePipelineVersion } from 'redux/actions/experimentSettings';
import { updateBackendStatus } from 'redux/actions/backendStatus';
import { replaceLoadedConfigs, updatePlotData } from 'redux/actions/componentConfig';
import { loadCellSets, updateCellSetsClustering } from 'redux/actions/cellSets';
import { loadSamples } from 'redux/actions/samples';
import { reloadExperimentInfo } from 'redux/actions/experiments';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import { cellSetsUpdatedMessages } from 'utils/constants';
import endUserMessages from 'utils/endUserMessages';

const updateTypes = {
  QC: 'qc',
  GEM2S: 'gem2s',
  WORK_RESPONSE: 'WorkResponse',
  PLOT_CONFIG_REFRESH: 'PlotConfigRefresh',
};

const experimentUpdatesHandler = (dispatch) => (experimentId, update) => {
  if (update.status) {
    dispatch(updateBackendStatus(experimentId, update.status));
  }

  if (update.response?.error) {
    console.error('Experiment updates error:', update);
    return;
  }

  switch (update.type) {
    case updateTypes.QC: {
      return onQCUpdate(update, dispatch, experimentId);
    }
    case updateTypes.GEM2S: {
      return onGEM2SUpdate(update, dispatch, experimentId);
    }
    case updateTypes.WORK_RESPONSE: {
      return onWorkResponseUpdate(update, dispatch, experimentId);
    }
    case updateTypes.PLOT_CONFIG_REFRESH: {
      return onPlotConfigRefresh(update, dispatch);
    }
    default: {
      console.log(`Error, unrecognized message type ${update.type}`, update);
    }
  }
};

const onQCUpdate = (update, dispatch, experimentId) => {
  const { input, output, pipelineVersion } = update;

  const processingConfigUpdate = output?.config;

  if (processingConfigUpdate) {
    dispatch(updateProcessingSettingsFromQC(
      input.taskName,
      processingConfigUpdate,
      input.sampleUuid,
      false,
    ));

    Object.entries(output.plotData).forEach(([plotUuid, plotData]) => {
      dispatch(updatePlotData(plotUuid, plotData));
    });
  }

  dispatch(updatePipelineVersion(experimentId, pipelineVersion));

  // If the pipeline finished we have a new clustering, so fetch it
  if (update.status.pipeline.status === 'SUCCEEDED') {
    dispatch(loadCellSets(experimentId, true));
  }
};

const onGEM2SUpdate = (update, dispatch, experimentId) => {
  const processingConfig = update?.item?.processingConfig;
  if (processingConfig) {
    dispatch(loadedProcessingConfig(experimentId, processingConfig, true));
  }

  // If we finished subsetSeurat, then we now know which samples survived the subset
  // So load them
  if (update?.taskName === 'subsetSeurat') {
    dispatch(reloadExperimentInfo());
    dispatch(loadSamples(experimentId));
  }
};

const onWorkResponseUpdate = (update, dispatch, experimentId) => {
  const {
    request: { body: { name: workRequestName } },
  } = update;

  if (['ClusterCells', 'ScTypeAnnotate'].includes(workRequestName)) {
    dispatch(updateCellSetsClustering(experimentId));
    pushNotificationMessage('success', cellSetsUpdatedMessages[workRequestName]);
  }

  if (workRequestName === 'GetExpressionCellSets') {
    dispatch(loadCellSets(experimentId, true));
    pushNotificationMessage('success', endUserMessages.SUCCESS_NEW_CLUSTER_CREATED);
  }
};

const onPlotConfigRefresh = (update, dispatch) => {
  dispatch(replaceLoadedConfigs(update.updatedConfigs));
};

export default experimentUpdatesHandler;
export { updateTypes };
