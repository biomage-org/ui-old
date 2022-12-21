import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Select } from 'antd';

const PlotTileTitle = ({ plotType }) => {
  const savedPlotsConfig = useSelector((state) => state.componentConfig.savedPlots?.config || {});
  const [plotSelectOptions, setPlotSelectOptions] = useState([]);

  useEffect(() => {
    if (!savedPlotsConfig[plotType]) return;

    const newPlotsList = savedPlotsConfig[plotType].slice(1);
    const newPlotOptions = newPlotsList.map((plotUuid) => ({ label: plotUuid, value: plotUuid }));
    setPlotSelectOptions(newPlotOptions);
  }, [savedPlotsConfig]);

  return (
    <Select
      options={[{ label: 'Exploration Plot', value: plotType }, ...plotSelectOptions]}
      defaultValue={plotType}
    />
  );
};

PlotTileTitle.propTypes = {
  plotType: PropTypes.string.isRequired,
};

export default PlotTileTitle;
