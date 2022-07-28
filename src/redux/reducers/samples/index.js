import { EXPERIMENTS_METADATA_RENAME } from 'redux/actionTypes/experiments';
import {
  SAMPLES_CREATE,
  SAMPLES_UPDATE,
  SAMPLES_DELETE,
  SAMPLES_FILE_UPDATE,
  SAMPLES_LOADED,
  SAMPLES_SAVING,
  SAMPLES_SAVED,
  SAMPLES_ERROR,
  SAMPLES_METADATA_DELETE,
  SAMPLES_LOADING,
  SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED,
} from '../../actionTypes/samples';
import initialState from './initialState';
import samplesCreate from './samplesCreate';
import samplesUpdate from './samplesUpdate';
import samplesDelete from './samplesDelete';
import samplesFileUpdate from './samplesFileUpdate';
import samplesLoaded from './samplesLoaded';
import samplesSaving from './samplesSaving';
import samplesError from './samplesError';
import samplesSaved from './samplesSaved';
import samplesMetadataDelete from './samplesMetadataDelete';
import samplesLoading from './samplesLoading';
import samplesValueInMetadataTrackUpdated from './samplesValueInMetadataTrackUpdated';

import experimentsMetadataRename from './experimentsMetadataRename';

const samplesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAMPLES_CREATE: {
      return samplesCreate(state, action);
    }

    case SAMPLES_UPDATE: {
      return samplesUpdate(state, action);
    }

    case SAMPLES_DELETE: {
      return samplesDelete(state, action);
    }

    case SAMPLES_FILE_UPDATE: {
      return samplesFileUpdate(state, action);
    }

    case SAMPLES_LOADED: {
      return samplesLoaded(state, action);
    }

    case SAMPLES_SAVING: {
      return samplesSaving(state, action);
    }

    case SAMPLES_SAVED: {
      return samplesSaved(state, action);
    }

    case SAMPLES_ERROR: {
      return samplesError(state, action);
    }

    case SAMPLES_METADATA_DELETE: {
      return samplesMetadataDelete(state, action);
    }

    case SAMPLES_LOADING: {
      return samplesLoading(state);
    }

    case SAMPLES_VALUE_IN_METADATA_TRACK_UPDATED: {
      return samplesValueInMetadataTrackUpdated(state, action);
    }

    case EXPERIMENTS_METADATA_RENAME: {
      return experimentsMetadataRename(state, action);
    }

    default: {
      return state;
    }
  }
};

export default samplesReducer;
