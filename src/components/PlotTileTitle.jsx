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

    const savedPlotsList = savedPlots[plotType].plots.slice(1);
    if (plotOptions.map((option) => option.value) !== savedPlotsList) {
      const newPlotOptions = savedPlotsList.map((uuid) => ({ label: uuid, value: uuid }));
      setPlotOptions(newPlotOptions);
    }
  }, [savedPlots]);

  return (
    <Select
      options={[{ label: 'Exploration Plot', value: plotUuid }, ...plotOptions]}
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
