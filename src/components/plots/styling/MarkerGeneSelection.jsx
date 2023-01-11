import React, { useState } from 'react';
import _ from 'lodash';
import propTypes from 'prop-types';
import {
  Space,
  Radio,
  InputNumber,
  Button,
} from 'antd';

import GeneReorderTool from 'components/plots/GeneReorderTool';
import GeneSearchBar from 'components/plots/GeneSearchBar';

const MarkerGeneSelection = (props) => {
  const {
    config, plotUuid, genesToDisable, onUpdate, onReset, onGenesChange, onGenesSelect,
  } = props;
  const [numGenes, setNumGenes] = useState(config.nMarkerGenes);

  const renderOptions = () => {
    if (_.isEmpty(config)) return <></>;

    if (config.useMarkerGenes) {
      return (
        <div>
          <p>Number of marker genes per cluster</p>
          <Space direction='horizontal' size='small'>
            <InputNumber
              aria-label='Number of genes input'
              size='small'
              value={numGenes}
              onChange={(value) => setNumGenes(value)}
            />
            <Button
              onClick={() => onUpdate({ nMarkerGenes: numGenes })}
              disabled={numGenes === config.nMarkerGenes}
              type='primary'
              size='small'
            >
              Run
            </Button>
          </Space>
        </div>
      );
    }

    return (
      <Space direction='vertical' size='small'>
        <p style={{ margin: 0 }}>
          Type in a gene name and select it to add it to the plot.
          To add multiple genes, separate them with a space or comma.
        </p>
        <p>
          Drag and drop genes to re-order them.
          Hold an element above or below the table to scroll.
        </p>
        <GeneSearchBar
          genesToDisable={genesToDisable}
          onSelect={onGenesSelect}
        />
        <GeneReorderTool
          plotUuid={plotUuid}
          onDelete={onGenesChange}
        />
        <Button
          type='primary'
          onClick={onReset}
          size='small'
        >
          Reset
        </Button>
      </Space>
    );
  };

  return (
    <>
      <Space direction='vertical' size='middle'>
        <Radio.Group
          onChange={(e) => onUpdate({ useMarkerGenes: e.target.value })}
          value={config.useMarkerGenes}
        >
          <Radio value={false}>Custom genes</Radio>
          <Radio value>Marker genes</Radio>
        </Radio.Group>
        {renderOptions()}
      </Space>
    </>
  );
};

MarkerGeneSelection.propTypes = {
  onUpdate: propTypes.func.isRequired,
  config: propTypes.object,
  onReset: propTypes.func.isRequired,
  plotUuid: propTypes.string.isRequired,
  genesToDisable: propTypes.array,
  onGenesChange: propTypes.func.isRequired,
  onGenesSelect: propTypes.func.isRequired,
};

MarkerGeneSelection.defaultProps = {
  config: {},
  genesToDisable: [],
};

export default MarkerGeneSelection;
