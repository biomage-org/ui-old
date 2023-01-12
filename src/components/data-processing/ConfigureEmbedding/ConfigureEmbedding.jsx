import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
  Row, Col, PageHeader, Radio, Collapse, Empty, Alert, Space,
} from 'antd';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';

import { isUnisample } from 'utils/experimentPredicates';

import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import ContinuousEmbeddingPlot from 'components/plots/ContinuousEmbeddingPlot';

import {
  updatePlotConfig,
  loadPlotConfig,
  savePlotConfig,
} from 'redux/actions/componentConfig';

import PlotStyling from 'components/plots/styling/PlotStyling';
import loadCellMeta from 'redux/actions/cellMeta';
import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import Loader from 'components/Loader';
import { getCellSets } from 'redux/selectors';
import CalculationConfig from 'components/data-processing/ConfigureEmbedding/CalculationConfig';

const { Panel } = Collapse;

const ConfigureEmbedding = (props) => {
  const { experimentId, onConfigChange } = props;
  const [plot, setPlot] = useState(null);
  const dispatch = useDispatch();
  const debounceSave = useCallback(
    _.debounce((plotUuid) => dispatch(savePlotConfig(experimentId, plotUuid)), 2000), [],
  );

  const filterName = 'configureEmbedding';
  const NUM_LEGEND_SHOW_LIMIT = 50;

  const cellSets = useSelector(getCellSets());
  const cellMeta = useSelector((state) => state.cellMeta);
  const [selectedPlot, setSelectedPlot] = useState('cellCluster');

  const continuousEmbeddingPlots = ['mitochondrialContent', 'doubletScores', 'numOfGenes', 'numOfUmis'];

  const { hierarchy } = cellSets;
  const numSamples = hierarchy.find(({ key }) => key === 'sample').children.length;
  const numCellSets = hierarchy.find(({ key }) => key === 'louvain').children.length;

  useEffect(() => {
    continuousEmbeddingPlots.forEach((dataName) => {
      if (cellMeta[dataName].loading && !cellMeta[dataName].error) {
        dispatch(loadCellMeta(experimentId, dataName));
      }
    });
  }, []);

  const plots = {
    cellCluster: {
      title: 'Cell sets',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 0),
      plotType: 'embeddingPreviewByCellSets',
      plot: (config, actions) => (
        <center>
          <Space direction='vertical'>
            {numCellSets > NUM_LEGEND_SHOW_LIMIT && (
              <Alert
                message={(
                  <p>
                    {`The plot legend contains ${numCellSets} items, making the legend very large.`}
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
            <CategoricalEmbeddingPlot
              experimentId={experimentId}
              config={config}
              actions={actions}
              onUpdate={updatePlotWithChanges}
            />
          </Space>
        </center>
      )
      ,
    },
    sample: {
      title: 'Samples',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 1),
      plotType: 'embeddingPreviewBySample',
      plot: (config, actions) => (
        <center>
          <Space direction='vertical'>
            {numSamples > NUM_LEGEND_SHOW_LIMIT && (
              <Alert
                message={(
                  <p>
                    {`The plot legend contains ${numSamples} items, making the legend very large.`}
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
            <CategoricalEmbeddingPlot
              experimentId={experimentId}
              config={{
                ...config,
                legend: {
                  ...config.legend,
                  title: 'Sample Name',
                },
                selectedCellSet: 'sample',
                axes: {
                  defaultValues: [],
                },
              }}
              actions={actions}
              onUpdate={updatePlotWithChanges}
            />
          </Space>
        </center>
      ),
    },
    mitochondrialContent: {
      title: 'Mitochondrial fraction reads',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 2),
      plotType: 'embeddingPreviewMitochondrialContent',
      plot: (config, actions) => (
        <ContinuousEmbeddingPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
          plotData={cellMeta.mitochondrialContent.data}
          loading={cellMeta.mitochondrialContent.loading}
          error={cellMeta.mitochondrialContent.error}
          reloadPlotData={() => dispatch(loadCellMeta(experimentId, 'mitochondrialContent'))}
          onUpdate={updatePlotWithChanges}
        />
      ),
    },
    doubletScores: {
      title: 'Doublet score',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 3),
      plotType: 'embeddingPreviewDoubletScore',
      plot: (config, actions) => (
        <ContinuousEmbeddingPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
          plotData={cellMeta.doubletScores.data}
          loading={cellMeta.doubletScores.loading}
          error={cellMeta.doubletScores.error}
          reloadPlotData={() => dispatch(loadCellMeta(experimentId, 'doubletScores'))}
          onUpdate={updatePlotWithChanges}
        />
      ),
    },
    numOfGenes: {
      title: 'Number of genes',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 4),
      plotType: 'embeddingPreviewNumOfGenes',
      plot: (config, actions) => (
        <ContinuousEmbeddingPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
          plotData={cellMeta.numOfGenes.data}
          loading={cellMeta.numOfGenes.loading}
          error={cellMeta.numOfGenes.error}
          reloadPlotData={() => dispatch(loadCellMeta(experimentId, 'numOfGenes'))}
          onUpdate={updatePlotWithChanges}
        />
      ),
    },
    numOfUmis: {
      title: 'Number of UMIs',
      plotUuid: generateDataProcessingPlotUuid(null, filterName, 5),
      plotType: 'embeddingPreviewNumOfUmis',
      plot: (config, actions) => (
        <ContinuousEmbeddingPlot
          experimentId={experimentId}
          config={config}
          actions={actions}
          plotData={cellMeta.numOfUmis.data}
          loading={cellMeta.numOfUmis.loading}
          error={cellMeta.numOfUmis.error}
          reloadPlotData={() => dispatch(loadCellMeta(experimentId, 'numOfUmis'))}
          onUpdate={updatePlotWithChanges}
        />
      ),
    },
  };
  const categoricalEmbStylingControls = [
    {
      panelTitle: 'Colour Inversion',
      controls: ['colourInversion'],
      footer: <Alert
        message='Changing plot colours is not available here. Use the Cell sets and Metadata tool in Data Exploration to customise cell set and metadata colours'
        type='info'
      />,
    },
    {
      panelTitle: 'Markers',
      controls: [{
        name: 'markers',
        props: { showShapeType: false },
      }],
    },
    {
      panelTitle: 'Legend',
      controls: [{
        name: 'legend',
        props: {
          option: {
            positions: 'top-bottom',
          },
        },
      }],
    },
    {
      panelTitle: 'Labels',
      controls: ['labels'],
    },
  ];
  const continuousEmbStylingControls = [
    {
      panelTitle: 'Colours',
      controls: ['colourScheme', 'colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: [{
        name: 'markers',
        props: { showShapeType: false },
      }],
    },
    {
      panelTitle: 'Legend',
      controls: ['legend'],
    },
  ];

  const plotSpecificStylingControl = {
    sample: categoricalEmbStylingControls,
    cellCluster: categoricalEmbStylingControls,
    mitochondrialContent: continuousEmbStylingControls,
    doubletScores: continuousEmbStylingControls,
    numOfGenes: continuousEmbStylingControls,
    numOfUmis: continuousEmbStylingControls,
  };

  const plotStylingControlsConfig = [
    {
      panelTitle: 'Main schema',
      controls: ['dimensions'],
      children: [
        {
          panelTitle: 'Title',
          controls: ['title'],
        },
        {
          panelTitle: 'Font',
          controls: ['font'],
        },
      ],
    },
    {
      panelTitle: 'Axes and margins',
      controls: ['axesWithRanges'],
    },
    ...plotSpecificStylingControl[selectedPlot],
  ];

  const outstandingChanges = useSelector(
    (state) => state.componentConfig[plots[selectedPlot].plotUuid]?.outstandingChanges,
  );

  const plotConfigs = useSelector((state) => {
    const plotUuids = Object.values(plots).map((plotIt) => plotIt.plotUuid);

    const plotConfigsToReturn = plotUuids.reduce((acum, plotUuidIt) => {
      // eslint-disable-next-line no-param-reassign
      acum[plotUuidIt] = state.componentConfig[plotUuidIt]?.config;
      return acum;
    }, {});

    return plotConfigsToReturn;
  });

  const selectedConfig = plotConfigs[plots[selectedPlot].plotUuid];

  useEffect(() => {
    const promiseLoadConfig = Object.values(plots).map(async (obj) => {
      if (!plotConfigs[obj.plotUuid]) {
        await dispatch(loadPlotConfig(experimentId, obj.plotUuid, obj.plotType));
      }
    });

    Promise.all(promiseLoadConfig).then(() => {
      if (numCellSets > NUM_LEGEND_SHOW_LIMIT) {
        dispatch(updatePlotConfig(plots.cellCluster.plotUuid, { legend: { enabled: false } }));
      }

      if (numSamples > NUM_LEGEND_SHOW_LIMIT) {
        dispatch(updatePlotConfig(plots.sample.plotUuid, { legend: { enabled: false } }));
      }
    });
  }, []);

  useEffect(() => {
    // if we change a plot and the config is not saved yet
    if (outstandingChanges) {
      dispatch(savePlotConfig(experimentId, plots[selectedPlot].plotUuid));
    }
  }, [selectedPlot]);

  useEffect(() => {
    // Do not update anything if the cell sets are stil loading or if
    // the config does not exist yet.
    if (!selectedConfig) {
      return;
    }

    const plotActions = {
      export: true,
    };
    if (cellSets.accessible && selectedConfig) {
      setPlot(plots[selectedPlot].plot(selectedConfig, plotActions));
    }
  }, [selectedConfig, cellSets]);

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plots[selectedPlot].plotUuid, obj));
    debounceSave(plots[selectedPlot].plotUuid);
  };

  const renderExtraControlPanels = () => (
    <Panel header='Select data' key='select-data'>
      <SelectData
        config={selectedConfig}
        onUpdate={updatePlotWithChanges}
        cellSets={cellSets}
      />
    </Panel>
  );

  const renderPlot = () => {
    // Spinner for main window
    if (!selectedConfig) {
      return (
        <center>
          <Loader />
        </center>
      );
    }

    if (selectedPlot === 'sample' && cellSets.accessible && isUnisample(cellSets.hierarchy)
    ) {
      return (
        <center>
          <Empty
            style={{ width: selectedConfig.dimensions.width }}
            description='Your project has only one sample.'
          />
        </center>
      );
    }

    if (plot) {
      return plot;
    }
  };

  const radioStyle = {
    display: 'block',
    height: '30px',
  };

  return (
    <>
      <PageHeader
        title={plots[selectedPlot].title}
        style={{ width: '100%', paddingRight: '0px' }}
      />
      <Row gutter={16}>
        <Col flex='auto'>
          {renderPlot()}
        </Col>

        <Col flex='1 0px'>
          <Collapse defaultActiveKey={['plot-selector']}>
            <Panel header='Plot view' key='plot-selector'>
              <Radio.Group onChange={(e) => setSelectedPlot(e.target.value)} value={selectedPlot}>
                {Object.entries(plots).map(([key, plotObj]) => (
                  <Radio key={key} style={radioStyle} value={key}>
                    {plotObj.title}
                  </Radio>
                ))}
              </Radio.Group>
            </Panel>
          </Collapse>

          <CalculationConfig experimentId={experimentId} onConfigChange={onConfigChange} />
          <Collapse>
            <Panel header='Plot options' key='styling'>
              <div style={{ height: 8 }} />
              <PlotStyling
                formConfig={plotStylingControlsConfig}
                config={selectedConfig}
                onUpdate={updatePlotWithChanges}
                extraPanels={renderExtraControlPanels()}
              />
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </>
  );
};

ConfigureEmbedding.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onConfigChange: PropTypes.func.isRequired,
};

export default ConfigureEmbedding;
