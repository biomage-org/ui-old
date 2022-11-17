const customPlotsLoaded = (state, action) => {
  const { signedUrls } = action.payload;
  return {
    ...state,
    customPlots: {
      signedUrls,
    },
  };
};

export default customPlotsLoaded;
