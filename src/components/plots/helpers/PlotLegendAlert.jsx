import React, { useEffect } from 'react';
import {
  Space,
  Alert,
} from 'antd';
import PropTypes from 'prop-types';

const NUM_LEGEND_ITEMS_LIMIT = 50;

const PlotLegendAlert = (props) => {
  const {
    isLegendEnabled, numLegendItems, updateFn, children,
  } = props;

  useEffect(() => {
    const shouldShowLegend = numLegendItems < NUM_LEGEND_ITEMS_LIMIT;

    if (isLegendEnabled !== shouldShowLegend) updateFn({ legend: { enabled: shouldShowLegend } });
  }, [numLegendItems]);

  return (
    <center>
      <Space direction='vertical'>
        {numLegendItems > NUM_LEGEND_ITEMS_LIMIT && (
          <Alert
            message={(
              <p>
                {`The plot legend contains ${numLegendItems} items, making the legend very large.`}
                <br />
                The plot legend is hidden to not interfere with the display of the plot.
                <br />
                You can display the plot legend, by changing the settings under
                {' '}
                <b>Legend &gt; Toggle Legend</b>
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
