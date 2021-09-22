import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import {
  SAMPLES_CREATE,
} from '../../actionTypes/samples';

import {
  DEFAULT_NA,
} from '../../reducers/projects/initialState';

import fetchAPI from '../../../utils/fetchAPI';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

import { throwIfRequestFailed } from '../../../utils/fetchErrors';

import { sampleTemplate } from '../../reducers/samples/initialState';
import updateExperiment from '../experiments/updateExperiment';

const createSample = (
  projectUuid,
  name,
  type,
) => async (dispatch, getState) => {
  const project = getState().projects[projectUuid];

  const createdDate = moment().toISOString();

  const experimentId = project.experiments[0];
  const experiment = getState().experiments[experimentId];

  const newSampleUuid = uuidv4();

  const newSample = {
    ...sampleTemplate,
    name,
    type,
    projectUuid,
    uuid: newSampleUuid,
    createdDate,
    lastModified: createdDate,
    metadata: project?.metadataKeys
      .reduce((acc, curr) => ({ ...acc, [curr]: DEFAULT_NA }), {}) || {},
  };

  try {
    const url = `/v1/projects/${projectUuid}/${experimentId}/samples`;

    const response = await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSample),
      },
    );

    const json = await response.json();

    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    dispatch({
      type: SAMPLES_CREATE,
      payload: { sample: newSample },
    });

    dispatch(
      updateExperiment(
        experimentId,
        { sampleIds: [...experiment.sampleIds, newSampleUuid] },
      ),
    );
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }

  return Promise.resolve(newSampleUuid);
};

export default createSample;
