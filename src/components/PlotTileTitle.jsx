import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Select } from 'antd';
import { getSavedPlots } from 'redux/selectors';

const PlotTileTitle = ({ plotType, plotUuid, setPlotUuid }) => {
  const savedPlots = useSelector(getSavedPlots());
  const [plotOptions, setPlotOptions] = useState([]);

  useEffect(() => {
    if (!savedPlots) return;

    const savedPlotsList = savedPlots[plotType].plots;
    if (plotOptions.map((option) => option.value) !== savedPlotsList) {
      const newPlotOptions = savedPlotsList.map((uuid, index) => ({ label: index === 0 ? 'Exploration Plot' : uuid, value: uuid }));
      setPlotOptions(newPlotOptions);
    }
  }, [savedPlots]);

  return (
    <Select
      options={plotOptions}
      value={plotUuid}
      onSelect={(value) => setPlotUuid(value)}
    />
  );
};

PlotTileTitle.propTypes = {
  plotType: PropTypes.string.isRequired,
  plotUuid: PropTypes.string.isRequired,
  setPlotUuid: PropTypes.func.isRequired,
};

export default PlotTileTitle;
