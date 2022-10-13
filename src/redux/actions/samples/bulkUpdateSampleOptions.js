import endUserMessages from 'utils/endUserMessages';
import _ from 'lodash';

import {
  SAMPLES_BULK_OPTIONS_UPDATE, SAMPLES_SAVING, SAMPLES_SAVED, SAMPLES_ERROR,
} from 'redux/actionTypes/samples';

import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';

const bulkUpdateSampleOptions = (experimentId, sampleIds, diff) => async (dispatch, getState) => {
  const url = `/v2/experiments/${experimentId}/samples/bulkUpdate/options`;

  const oldOptions = getState().samples[sampleIds[0]].options;
  const newOptions = _.merge({}, oldOptions, diff);

  dispatch({
    type: SAMPLES_SAVING,
    payload: {
      message: endUserMessages.SAVING_SAMPLE,
    },
  });

  try {
    await fetchAPI(
      url,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sampleIds,
          options: newOptions,
        }),
      },
    );

    dispatch({
      type: SAMPLES_SAVED,
    });

    dispatch({
      type: SAMPLES_BULK_OPTIONS_UPDATE,
      payload: {
        sampleUuids: sampleIds,
        diff,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default bulkUpdateSampleOptions;