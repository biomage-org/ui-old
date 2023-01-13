import React, { useEffect } from 'react';
import {
  Space,
  Alert,
} from 'antd';
import PropTypes from 'prop-types';

const NUM_LEGEND_ITEMS_LIMIT = 50;

const PlotLegendAlert = (props) => {
  const {
    numLegendItems, updateFn, children,
  } = props;

  useEffect(() => {
    if (numLegendItems > NUM_LEGEND_ITEMS_LIMIT) {
      updateFn({ legend: { enabled: numLegendItems < NUM_LEGEND_ITEMS_LIMIT } });
    }
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
                We have hidden the plot legend to not interfere with the display of the plot.
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
  numLegendItems: PropTypes.number,
  children: PropTypes.node,
  updateFn: PropTypes.func.isRequired,
};

PlotLegendAlert.defaultProps = {
  numLegendItems: 0,
  children: null,
};

export default PlotLegendAlert;
