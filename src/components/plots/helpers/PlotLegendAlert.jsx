import React, { useEffect, useRef } from 'react';
import {
  Space,
  Alert,
} from 'antd';
import PropTypes from 'prop-types';

const NUM_LEGEND_ITEMS_LIMIT = 50;

const PlotLegendAlert = (props) => {
  const {
    isLegendEnabled,
    numLegendItems,
    updateFn,
    children,
  } = props;

  const hasLegendBeenToggled = useRef(false);
  const shouldShowLegend = numLegendItems < NUM_LEGEND_ITEMS_LIMIT;

  useEffect(() => {
    if (isLegendEnabled !== shouldShowLegend) updateFn({ legend: { enabled: shouldShowLegend } });
  }, [numLegendItems]);

  useEffect(() => {
    if (isLegendEnabled !== shouldShowLegend) hasLegendBeenToggled.current = true;
  }, [isLegendEnabled]);

  useEffect(() => {
    // Reset on page revisit
    hasLegendBeenToggled.current = false;
  }, []);

  return (
    <center>
      <Space direction='vertical'>
        {numLegendItems > NUM_LEGEND_ITEMS_LIMIT
          && !hasLegendBeenToggled.current
          && !isLegendEnabled
        && (
          <Alert
            message={(
              <p>
                {'We have hidden the plot legend, because it is too large and it interferes '}
                {'with the display of the plot.'}
                <br />
                {'You can still display the plot legend by changing the value of "Toggle Legend" option '}
                {'in Plot Styling settings under "Legend"'}
                .
              </p>
            )}
            type='warning'
          />
        )}
        {children}
      </Space>
    </center>
  );
};

PlotLegendAlert.propTypes = {
  numLegendItems: PropTypes.number.isRequired,
  isLegendEnabled: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  updateFn: PropTypes.func.isRequired,
};

export default PlotLegendAlert;
