import { LOAD_CUSTOM_PLOTS } from 'redux/actionTypes/componentConfig';
import fetchAPI from 'utils/http/fetchAPI';

const loadCustomPlots = (experimentId) => async (dispatch) => {
  const { signedUrls, keys } = await fetchAPI(`/v2/customPlots/${experimentId}/imageUrl`);
  console.log('SIGNED URLS ', signedUrls);
  dispatch({
    type: LOAD_CUSTOM_PLOTS,
    payload: {
      signedUrls,
      keys,
    },
  });
};

export default loadCustomPlots;
