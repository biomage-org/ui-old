/* eslint-disable no-param-reassign */
import produce from 'immer';

import _ from 'lodash';

const experimentsLoaded = produce((draft, action) => {
  const { experiments } = action.payload;

  console.log('experimentsDebug');
  console.log(experiments);

  // const newActiveExperimentId = state.meta.activeExperimentId;

  // // If the current active experiment no longer exists, change it
  // if (!Object.keys(state).includes(newActiveExperimentId)) {
  //   newActiveExperimentId = experiments[0]?.id;
  // }

  // WIP would be better to store experiments inside a special property for it
  // instead of having to store the ids apart to differentiate experiment entries from meta
  const ids = _.map(experiments, 'id');

  draft.meta.activeExperimentId = experiments[0].id;
  draft.meta.loading = false;
  draft.ids = ids;

  experiments.forEach((experiment) => {
    // WIP, deal with this before emrging
    experiment.sampleIds = experiment.samplesOrder;

    draft[experiment.id] = experiment;
  });
});

export default experimentsLoaded;
