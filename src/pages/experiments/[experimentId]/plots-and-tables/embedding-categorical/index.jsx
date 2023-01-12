/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';
import {
  Collapse,
  Select,
  Skeleton,
  Space,
  Alert,
} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { getCellSets, getCellSetsHierarchy } from 'redux/selectors';
import {
  updatePlotConfig,
  loadPlotConfig,
} from 'redux/actions/componentConfig/index';
import Header from 'components/Header';
import { loadCellSets } from 'redux/actions/cellSets';
import CategoricalEmbeddingPlot from 'components/plots/CategoricalEmbeddingPlot';
import PlotContainer from 'components/plots/PlotContainer';
import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import { plotNames } from 'utils/constants';

const { Panel } = Collapse;

const plotUuid = 'embeddingCategoricalMain';
const plotType = 'embeddingCategorical';
const NUM_LEGEND_SHOW_LIMIT = 50;

const EmbeddingCategoricalPage = ({ experimentId }) => {
  const dispatch = useDispatch();
  const config = useSelector((state) => state.componentConfig[plotUuid]?.config);
  const cellSets = useSelector(getCellSets());
  const hierarchy = useSelector(getCellSetsHierarchy());

  const numLegendItems = hierarchy.find(
    ({ key }) => key === config?.selectedCellSet,
  )?.children?.length;

  useEffect(() => {
    if (!config) dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    dispatch(loadCellSets(experimentId));
  }, []);

  const generateGroupByOptions = () => {
    if (!cellSets.accessible) {
      return [];
    }
    return hierarchy.map(({ key, children }) => ({
      value: key,
      label: `${cellSets.properties[key].name} (${children.length} ${children === 1 ? 'child' : 'children'})`,
    }));
  };

  const updatePlotWithChanges = (obj) => {
    dispatch(updatePlotConfig(plotUuid, obj));
  };

  useEffect(() => {
    if (!config) return;
    if (!numLegendItems) return;

    dispatch(
      updatePlotConfig(
        plotUuid,
        { legend: { enabled: numLegendItems < NUM_LEGEND_SHOW_LIMIT } },
      ),
    );
  }, [!config]);

  const plotStylingConfig = [
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
    {
      panelTitle: 'Colour Inversion',
      controls: ['colourInversion'],
    },
    {
      panelTitle: 'Markers',
      controls: ['markers'],
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

  const renderExtraPanels = () => (
    <>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={updatePlotWithChanges}
          cellSets={cellSets}
        />
      </Panel>
      <Panel header='Group by' key='group-by'>
        <p>
          Select the cell set category you would like to group cells by.
        </p>
        {config ? (
          <Select
            labelInValue
            style={{ width: '100%' }}
            placeholder='Select cell set...'
            value={{ value: config.selectedCellSet }}
            options={generateGroupByOptions()}
            onChange={({ value }) => updatePlotWithChanges({ selectedCellSet: value })}
          />
        ) : <Skeleton.Input style={{ width: '100%' }} active />}
      </Panel>
    </>
  );

  return (
    <>
      <Header title={plotNames.CATEGORICAL_EMBEDDING} />
      <PlotContainer
        experimentId={experimentId}
        plotUuid={plotUuid}
        plotType={plotType}
        plotStylingConfig={plotStylingConfig}
        plotInfo='In order to rename existing clusters or create new ones, use the cell set tool, located in the Data Exploration page.'
        extraControlPanels={renderExtraPanels()}
        defaultActiveKey='group-by'
      >
        <center>
          <Space direction='vertical'>
            {numLegendItems > NUM_LEGEND_SHOW_LIMIT && (
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
            <CategoricalEmbeddingPlot
              experimentId={experimentId}
              config={config}
              plotUuid={plotUuid}
              onUpdate={updatePlotWithChanges}
            />
          </Space>
        </center>
      </PlotContainer>
    </>
  );
};
EmbeddingCategoricalPage.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default EmbeddingCategoricalPage;
