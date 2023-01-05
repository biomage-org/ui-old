import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { Select } from 'antd';
import { getSavedPlots, getPlotConfigs } from 'redux/selectors';
import { loadPlotConfig } from 'redux/actions/componentConfig';

const PlotTileTitle = (props) => {
  const {
    experimentId,
    plotType,
    plotUuid,
    setPlotUuid,
  } = props;

  const dispatch = useDispatch();

  const savedPlots = useSelector(getSavedPlots());
  const savedPlotConfigs = useSelector(getPlotConfigs(savedPlots?.[plotType].plots));

  const [plotOptions, setPlotOptions] = useState([]);

  useEffect(() => {
    if (!savedPlots) return;

    const savedPlotsList = savedPlots[plotType].plots;
    if (plotOptions.map((option) => option.value) !== savedPlotsList) {
      const newPlotOptions = savedPlotsList.map((uuid, index) => ({ label: index === 0 ? 'Exploration Plot' : uuid, value: uuid }));
      setPlotOptions(newPlotOptions);
    }
  }, [savedPlots]);

  const selectNewPlot = (newPlotUuid) => {
    if (!savedPlotConfigs[newPlotUuid]) {
      dispatch(loadPlotConfig(experimentId, newPlotUuid, plotType));
    }

    setPlotUuid(newPlotUuid);
  };

  return (
    <Select
      options={plotOptions}
      value={plotUuid}
      onSelect={(value) => selectNewPlot(value)}
      dropdownMatchSelectWidth={false}
    />
  );
};

PlotTileTitle.propTypes = {
  experimentId: PropTypes.string.isRequired,
  plotType: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  setPlotUuid: PropTypes.func.isRequired,
};

export default PlotTileTitle;
