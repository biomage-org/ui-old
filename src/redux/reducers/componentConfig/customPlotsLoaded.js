const customPlotsLoaded = (state, action) => {
  const { signedUrls, keys } = action.payload;
  return {
    ...state,
    customPlots: {
      signedUrls,
      keys,
    },
  };
};

export default customPlotsLoaded;
