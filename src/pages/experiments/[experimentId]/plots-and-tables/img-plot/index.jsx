import React, { useEffect, useState, useRef } from 'react';
import {
  Row, Col, Space, Collapse, Typography,
} from 'antd';

import Loader from 'components/Loader';
import PlatformError from 'components/PlatformError';

import { useSelector, useDispatch } from 'react-redux';
import { loadCustomPlots } from 'redux/actions/componentConfig';
import PropTypes from 'prop-types';
import Header from 'components/Header';

import { plotNames } from 'utils/constants';

const { Panel } = Collapse;

const plotType = 'ImgPlot';

const CustomPlot = (props) => {
  // eslint-disable-next-line react/prop-types
  const { experimentId, plotUuid = 'ImgPlot' } = props;
  const dispatch = useDispatch();
  const customPlotImages = useSelector((state) => state.componentConfig?.customPlots?.signedUrls) || [];

  useEffect(() => {
    dispatch(loadCustomPlots(experimentId));
  }, []);

  return (
    <>
      {/* <PlotHeader
        title='Ridge Plot'
        plotUuid={plotUuid}
        experimentId={experimentId}
      /> */}

      <Header title={plotNames.IMG_PLOT} />
      <Space direction='vertical' style={{ width: '100%', padding: '0 10px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <Space direction='vertical' style={{ width: '100%' }}>
              {customPlotImages.map((image, indx) => (
                <Collapse defaultActiveKey='1' accordion>
                  <Panel header='Preview' key='1'>
                    <center>
                      <img src={image} alt={`generic plot ${indx}`} style={{ width: '100%', height: '100%' }} />
                    </center>
                  </Panel>
                </Collapse>
              ))}
            </Space>
          </Col>
        </Row>
      </Space>
    </>
  );
};

CustomPlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default CustomPlot;
