import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

const getSavedPlots = () => (state) => {
  const savedPlots = state.savedPlots?.config;

  return savedPlots;
};

export default createMemoizedSelector(getSavedPlots);
