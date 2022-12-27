import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { Select } from 'antd';
import { getSavedPlots } from 'redux/selectors';
import { plotUuids } from 'utils/constants';
import { updatePlotConfig } from 'redux/actions/componentConfig';

const PlotTileTitle = ({ plotType }) => {
  const dispatch = useDispatch();

  const defaultPlotUuid = plotUuids.DOT_PLOT;

  const savedPlots = useSelector(getSavedPlots());
  const [plotOptions, setPlotOptions] = useState([]);

  const changeSelectedPlot = (plotUuid) => {
    dispatch(updatePlotConfig('savedPlots', { selectedPlots: { [plotType]: plotUuid } }));
  };

  useEffect(() => {
    if (!savedPlots) return;

    const savedPlotsList = savedPlots[plotType].plots.slice(1);
    if (plotOptions.map((option) => option.value) !== savedPlotsList) {
      const newPlotOptions = savedPlotsList.map((plotUuid) => ({ label: plotUuid, value: plotUuid }));
      setPlotOptions(newPlotOptions);
    }
  }, [savedPlots]);

  return (
    <Select
      options={[{ label: 'Exploration Plot', value: defaultPlotUuid }, ...plotOptions]}
      defaultValue={defaultPlotUuid}
      onSelect={(value) => changeSelectedPlot(value)}
    />
  );
};

PlotTileTitle.propTypes = {
  plotType: PropTypes.string.isRequired,
};

export default PlotTileTitle;
