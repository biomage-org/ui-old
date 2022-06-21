import React from 'react';
import PropTypes from 'prop-types';
import { Tree, Skeleton } from 'antd';

import 'components/plots/hierarchical-tree-genes/HierarchicalTreeGenes.css';
import { ConsoleLogger } from '@aws-amplify/core';

const HierarchicalTreeGenes = (props) => {
  const {
    treeData,
    onGeneReorder,
  } = props;

  const onDrop = (info) => {
    const {
      dragNode, node, dropPosition, dropToGap,
    } = info;
    console.log(dragNode);
    console.log(node);
    console.log(dropPosition);
    console.log(dropToGap);

    // if dropped in place, ignore
    // dragNode.key is str, dropPosition is int
    if (dragNode.key == dropPosition) return;

    // If not dropped in gap, ignore
    if (!dropToGap) return;

    let newPosition = dropPosition - (dragNode.key < dropPosition ? 1 : 0);
    newPosition = Math.max(0, newPosition);

    onGeneReorder(dragNode.key, newPosition);
  };

  if (!treeData) return <Skeleton active />;

  return (
    <Tree
      data-testid='HierachicalTreeGenes'
      draggable
      treeData={treeData}
      onDrop={onDrop}
    />
  );
};

HierarchicalTreeGenes.defaultProps = {};

HierarchicalTreeGenes.propTypes = {
  treeData: PropTypes.array.isRequired,
  onGeneReorder: PropTypes.func.isRequired,
};

export default HierarchicalTreeGenes;
