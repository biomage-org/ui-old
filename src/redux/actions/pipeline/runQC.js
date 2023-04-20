import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_QC_START,
  EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
} from 'redux/actionTypes/experimentSettings';

import { saveProcessingSettings } from 'redux/actions/experimentSettings';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { loadEmbedding } from 'redux/actions/embedding';
import { runCellSetsClustering } from 'redux/actions/cellSets';

const configureEmbeddingStepKey = 'configureEmbedding';

const runOnlyConfigureEmbedding = async (experimentId, originalConfig, newConfig, dispatch) => {
  const {
    embeddingSettings: { method: oldEmbeddingMethod },
    clusteringSettings: {
      method: oldClusteringMethod,
      methodSettings: oldClusteringSettings,
    },
  } = originalConfig;

  const {
    embeddingSettings: { method: newEmbeddingMethod },
    clusteringSettings: {
      method: newClusteringMethod,
      methodSettings: newClusteringSettings,
    },
  } = newConfig;

  await dispatch(saveProcessingSettings(experimentId, configureEmbeddingStepKey));

  dispatch({
    type: EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
    payload: {},
  });

  if (newClusteringSettings[newClusteringMethod].resolution
    !== oldClusteringSettings[oldClusteringMethod].resolution
  ) {
    dispatch(
      runCellSetsClustering(
        experimentId,
        newClusteringSettings[newClusteringMethod].resolution,
      ),
    );
  }

  if (newEmbeddingMethod !== oldEmbeddingMethod) {
    dispatch(
      loadEmbedding(
        experimentId,
        newEmbeddingMethod,
        true,
      ),
    );
  }
};

const runQC = (experimentId) => async (dispatch, getState) => {
  const { processing, originalProcessing } = getState().experimentSettings;
  const { changedQCFilters } = processing.meta;

  if (changedQCFilters.size === 1 && changedQCFilters.has(configureEmbeddingStepKey)) {
    runOnlyConfigureEmbedding(
      experimentId,
      originalProcessing.configureEmbedding,
      processing.configureEmbedding,
      dispatch,
    );

    return;
  }

  const changesToProcessingConfig = Array.from(changedQCFilters).map((key) => {
    const currentConfig = processing[key];
    return {
      name: key,
      body: currentConfig,
    };
  });

  try {
    // We are only sending the configuration that we know changed
    // with respect to the one that is already persisted in dynamodb
    // The api will then merge this with the full config saved in dynamodb to get an updated version

    // We don't need to manually save any processing config because it is done by
    // the api once the pipeline finishes successfully
    await fetchAPI(
      `/v2/experiments/${experimentId}/qc`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processingConfig: changesToProcessingConfig,
        }),
      },
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_QC_START,
      payload: {},
    });

    dispatch(loadBackendStatus(experimentId));
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_STARTING_PIPLELINE);

    // get the backend status only if the error is not  a permission issue
    if (errorMessage !== endUserMessages.ERROR_NO_PERMISSIONS) {
      dispatch(loadBackendStatus(experimentId));
    }
  }
};

export default runQC;
