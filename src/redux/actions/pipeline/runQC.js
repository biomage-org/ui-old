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
import { getBackendStatus } from 'redux/selectors';
import pipelineStatusValues from 'utils/pipelineStatusValues';

const runOnlyConfigureEmbedding = async (experimentId, embeddingMethod, dispatch) => {
  await dispatch(saveProcessingSettings(experimentId, 'configureEmbedding'));

  dispatch({
    type: EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
    payload: {},
  });

  // Only configure embedding was changed so we run loadEmbedding
  dispatch(
    loadEmbedding(
      experimentId,
      embeddingMethod,
      true,
    ),
  );
};

const buildProcessingConfig = (processingConfig, changedQCFilters, qcStatus) => {
  // if the pipeline has failed and there aren't any changes,
  // by default start running from the first failed step
  // const stepsToRun = { ...changedQCFilters };
  console.log('initial steps to run ', changedQCFilters);
  console.log('changedQCFilters ', changedQCFilters);
  console.log('qcStatus ', qcStatus);

  const result = Array.from(changedQCFilters).map((key) => ({
    name: key,
    body: { ...processingConfig[key] },
  }));
  console.log(qcStatus.status);
  console.log(qcStatus.status === pipelineStatusValues.FAILED);
  console.log(changedQCFilters.size);
  console.log(changedQCFilters.size === 0);
  console.log(qcStatus.completedSteps.length);
  console.log(qcStatus.completedSteps.length > 0);
  if (qcStatus.status === pipelineStatusValues.FAILED
    && changedQCFilters.size === 0
    && qcStatus.completedSteps.length > 0) {
    const lastSuccessfulStep = qcStatus.completedSteps[qcStatus.completedSteps.length - 1];
    result.push({ name: lastSuccessfulStep, body: { ...processingConfig[lastSuccessfulStep] } });
    console.log('resulting steps to run ', result);
  }
  return result;
};

const runQC = (experimentId) => async (dispatch, getState) => {
  const { processing: processingConfig } = getState().experimentSettings;
  const { pipeline: pipelineStatus } = getBackendStatus(experimentId)(getState()).status;
  const { changedQCFilters } = processingConfig.meta;

  console.log('pipeline', pipelineStatus);
  console.log('processing', processingConfig);
  if (changedQCFilters.size === 1 && changedQCFilters.has('configureEmbedding')) {
    runOnlyConfigureEmbedding(
      experimentId,
      processingConfig.configureEmbedding.embeddingSettings.method,
      dispatch,
    );

    return;
  }

  const configToRun = buildProcessingConfig(processingConfig, changedQCFilters, pipelineStatus);

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
          processingConfig: configToRun,
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
