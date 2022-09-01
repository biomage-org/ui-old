/* eslint-disable no-param-reassign */
import { getAllCells } from 'utils/cellSets';

const maxLabelLength = 85;
const clustersPerLegendColumn = 20;

const generatePadding = (plotConfig, numClusters) => {
  const showLegend = plotConfig.legend.enabled;
  const legendPosition = plotConfig.legend.position;
  const axesOffset = plotConfig.axes.offset;

  const defaultPadding = {
    top: 80,
    left: 80,
    bottom: 80,
    right: 80,
  };

  if (!showLegend) return defaultPadding;

  const legendPadding = (paddingPosition, currentLegendPosition) => {
    const limitPerLineOrColumn = ['top', 'bottom'].includes(currentLegendPosition) ? 8 : clustersPerLegendColumn;
    const paddingPerLine = ['top', 'bottom'].includes(currentLegendPosition) ? 25 : maxLabelLength;

    const numLines = Math.ceil(numClusters / limitPerLineOrColumn);

    if (currentLegendPosition === paddingPosition) {
      return numLines * paddingPerLine;
    }

    return 0;
  };

  const padding = {
    top: defaultPadding.top + legendPadding('top', legendPosition) + axesOffset,
    right: defaultPadding.right + legendPadding('right', legendPosition) + axesOffset,
    bottom: defaultPadding.bottom + legendPadding('bottom', legendPosition) + axesOffset,
    left: defaultPadding.left + axesOffset,
  };

  return padding;
};

// Add/subtract 1 to give some padding to the plot
const extent = (arr) => [Math.min(...arr) - 1, Math.max(...arr) + 1];

const generateBaseSpec = (
  config,
  embeddingData,
  viewState,
  isZoomedOrPanned,
  numClusters,
) => ({
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  description: 'Trajectory analysis plot',
  width: config?.dimensions.width,
  height: config?.dimensions.height,
  autosize: 'none',
  background: config?.colour.toggleInvert,
  padding: generatePadding(config, numClusters),
  data: [
    {
      name: 'embedding',
      values: embeddingData,
      // Vega internally modifies objects during data transforms. If the plot data is frozen,
      // Vega is not able to carry out the transform and will throw an error.
      // https://github.com/vega/vega/issues/2453#issuecomment-604516777
      format: {
        type: 'json',
        copy: true,
      },
      transform: [
        { type: 'extent', field: 'x', signal: 'xext' },
        { type: 'extent', field: 'y', signal: 'yext' },
      ],
    },
    {
      name: 'labels',
      source: 'embedding',
      transform: [
        {
          type: 'aggregate', groupby: ['cellSetKey', 'cellSetName'], fields: ['x', 'y'], ops: ['mean', 'mean'], as: ['meanX', 'meanY'],
        },
      ],
    },
  ],
  signals: [
    // Signals for zooming and panning
    {
      name: 'initXdom',
      value: isZoomedOrPanned
        ? viewState.xdom
        : config.axesRanges.xAxisAuto
          ? extent(embeddingData.map((data) => data.x))
          : [config.axesRanges.xMin, config.axesRanges.xMax],
    },
    {
      name: 'initYdom',
      value: isZoomedOrPanned
        ? viewState.ydom
        : config.axesRanges.xAxisAuto
          ? extent(embeddingData.map((data) => data.y))
          : [config.axesRanges.yMin, config.axesRanges.yMax],
    },
    { name: 'xrange', update: '[0, width]' },
    { name: 'yrange', update: '[height, 0]' },
    {
      name: 'down',
      value: null,
      on: [
        { events: 'mousedown[!event.shiftKey]', update: 'xy()' },
        { events: 'mouseup[!event.shiftKey]', update: 'null' },
      ],
    },
    {
      name: 'xcur',
      value: null,
      on: [
        {
          events: 'mousedown',
          update: 'slice(xdom)',
        },
      ],
    },
    {
      name: 'ycur',
      value: null,
      on: [
        {
          events: 'mousedown',
          update: 'slice(ydom)',
        },
      ],
    },
    {
      name: 'delta',
      value: [0, 0],
      on: [
        {
          events: [
            {
              source: 'window',
              type: 'mousemove',
              between: [
                { type: 'mousedown', filter: '!event.shiftKey' },
                { source: 'window', type: 'mouseup' },
              ],
            },
          ],
          update: 'down ? [down[0]-x(), y()-down[1]] : [0,0]',
        },
      ],
    },
    {
      name: 'anchor',
      value: [0, 0],
      on: [
        {
          events: 'wheel',
          update: "[invert('xscale', x()), invert('yscale', y())]",
        },
      ],
    },
    {
      name: 'zoom',
      value: 1,
      on: [
        {
          events: 'wheel!',
          force: true,
          update: 'pow(1.001, event.deltaY * pow(2, event.deltaMode))',
        },
      ],
    },
    {
      name: 'xdom',
      update: 'initXdom',
      on: [
        {
          events: { signal: 'delta' },
          update: '[xcur[0] + span(xcur) * delta[0] / width, xcur[1] + span(xcur) * delta[0] / width]',
        },
        {
          events: { signal: 'zoom' },
          update: '[anchor[0] + (xdom[0] - anchor[0]) * zoom, anchor[0] + (xdom[1] - anchor[0]) * zoom]',
        },
      ],
    },
    {
      name: 'ydom',
      update: 'initYdom',
      on: [
        {
          events: { signal: 'delta' },
          update: '[ycur[0] + span(ycur) * delta[1] / height, ycur[1] + span(ycur) * delta[1] / height]',
        },
        {
          events: { signal: 'zoom' },
          update: '[anchor[1] + (ydom[0] - anchor[1]) * zoom, anchor[1] + (ydom[1] - anchor[1]) * zoom]',
        },
      ],
    },
    {
      name: 'size',
      update: `clamp(${config.marker.size * 4} / span(xdom), ${config.marker.size}, ${config.marker.size * 4})`,
    },
    {
      name: 'domUpdates',
      on: [
        {
          events: { signal: 'delta' },
          update: '[[xcur[0] + span(xcur) * delta[0] / width, xcur[1] + span(xcur) * delta[0] / width], [ycur[0] + span(ycur) * delta[1] / height, ycur[1] + span(ycur) * delta[1] / height]]',
        },
        {
          events: { signal: 'zoom' },
          update: '[[anchor[0] + (xdom[0] - anchor[0]) * zoom, anchor[0] + (xdom[1] - anchor[0]) * zoom], [anchor[1] + (ydom[0] - anchor[1]) * zoom, anchor[1] + (ydom[1] - anchor[1]) * zoom]]',
        },
      ],
    },
  ],
  scales: [
    {
      name: 'xscale',
      type: 'linear',
      zero: false,
      domain: { signal: 'xdom' },
      range: { signal: 'xrange' },
    },
    {
      name: 'yscale',
      type: 'linear',
      zero: false,
      domain: { signal: 'ydom' },
      range: { signal: 'yrange' },
    },
  ],
  axes: [
    {
      scale: 'xscale',
      grid: true,
      domain: true,
      orient: 'bottom',
      title: config?.axes.xAxisText,
      titleFont: config?.fontStyle.font,
      labelFont: config?.fontStyle.font,
      labelColor: config?.colour.masterColour,
      tickColor: config?.colour.masterColour,
      gridColor: config?.colour.masterColour,
      gridOpacity: (config?.axes.gridOpacity / 20),
      gridWidth: (config?.axes.gridWidth / 20),
      offset: config?.axes.offset,
      titleFontSize: config?.axes.titleFontSize,
      titleColor: config?.colour.masterColour,
      labelFontSize: config?.axes.labelFontSize,
      domainWidth: config?.axes.domainWidth,
      labelAngle: config.axes.xAxisRotateLabels ? 45 : 0,
      labelAlign: config.axes.xAxisRotateLabels ? 'left' : 'center',
    },
    {
      scale: 'yscale',
      grid: true,
      domain: true,
      orient: 'left',
      titlePadding: 5,
      gridColor: config?.colour.masterColour,
      gridOpacity: (config?.axes.gridOpacity / 20),
      gridWidth: (config?.axes.gridWidth / 20),
      tickColor: config?.colour.masterColour,
      offset: config?.axes.offset,
      title: config?.axes.yAxisText,
      titleFont: config?.fontStyle.font,
      labelFont: config?.fontStyle.font,
      labelColor: config?.colour.masterColour,
      titleFontSize: config?.axes.titleFontSize,
      titleColor: config?.colour.masterColour,
      labelFontSize: config?.axes.labelFontSize,
      domainWidth: config?.axes.domainWidth,
    },
  ],
  title:
    {
      text: config?.title.text,
      color: config?.colour.masterColour,
      anchor: config?.title.anchor,
      font: config?.fontStyle.font,
      dx: 10,
      fontSize: config?.title.fontSize,
    },
  marks: [
    {
      name: 'bounding-group',
      type: 'group',
      encode: {
        update: {
          width: { signal: 'width ' },
          height: { signal: 'height' },
          clip: { value: true },
        },
      },
      marks: [],
    },
  ],
});

const insertClusterColorsSpec = (
  spec,
  config,
  cellSetLegendsData,
  numClusters,
) => {
  if (config?.legend.enabled) {
    const positionIsRight = config.legend.position === 'right';
    const legendColumns = positionIsRight ? Math.ceil(numClusters / clustersPerLegendColumn) : 0;
    const labelLimit = positionIsRight ? maxLabelLength : 0;

    spec.scales = [
      ...spec.scales,
      {
        name: 'cellSetLabelColors',
        type: 'ordinal',
        range: cellSetLegendsData.map(({ color }) => color),
        domain: { data: 'embedding', field: 'cellSetKey' },
      },
      {
        name: 'sampleToName',
        type: 'ordinal',
        range: cellSetLegendsData.map(({ name }) => name),
      },
    ];

    spec.description = `${spec.description} showing clusters`;

    spec.legends = [
      {
        fill: 'cellSetLabelColors',
        title: 'Clusters',
        titleColor: config?.colour.masterColour,
        type: 'symbol',
        orient: config?.legend.position,
        offset: 40,
        symbolType: 'circle',
        symbolSize: 200,
        encode: {
          labels: {
            update: {
              text: {
                scale: 'sampleToName', field: 'label',
              },
              fill: { value: config?.colour.masterColour },
            },

          },
        },
        direction: positionIsRight ? 'vertical' : 'horizontal',
        labelFont: config?.fontStyle.font,
        titleFont: config?.fontStyle.font,
        columns: legendColumns,
        labelLimit,
      },
    ];
  }

  spec.scales = [
    ...spec.scales,
    {
      name: 'cellSetMarkColors',
      type: 'ordinal',
      range: { data: 'embedding', field: 'color' },
      domain: { data: 'embedding', field: 'cellSetKey' },
    },
  ];

  spec.marks[0].marks = [
    ...spec.marks[0].marks,
    {
      type: 'text',
      from: { data: 'labels' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'meanX' },
          y: { scale: 'yscale', field: 'meanY' },
          text: { field: 'cellSetName' },
          fontSize: { value: config?.labels.size },
          strokeWidth: { value: 1.2 },
          fill: { value: config?.colour.masterColour },
          fillOpacity: { value: config?.labels.enabled },
          font: { value: config?.fontStyle.font },
        },
      },
    },
    {
      name: 'embedding',
      type: 'symbol',
      from: { data: 'embedding' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'x' },
          y: { scale: 'yscale', field: 'y' },
          size: { signal: 'size' },
          stroke: { scale: 'cellSetMarkColors', field: 'cellSetKey' },
          fill: { scale: 'cellSetMarkColors', field: 'cellSetKey' },
          shape: { value: config?.marker.shape },
          fillOpacity: { value: config?.marker.opacity / 10 },
        },
      },
    },
  ];
};

const insertTrajectorySpec = (
  spec,
  pathData,
  selectedNodes,
) => {
  spec.description = `${spec.description} with trajectory`;

  spec.data = [
    ...spec?.data,
    {
      name: 'pathData',
      values: pathData,
      format: {
        type: 'json',
        copy: true,
      },
    },
    {
      name: 'highlight',
      values: selectedNodes,
      format: {
        type: 'json',
        copy: true,
      },
    },
  ];

  spec.signals = [
    ...spec.signals,
    // Signal for selection
    {
      name: 'chooseNode',
      on: [{ events: '@pathNodes:click', update: 'datum', force: true }],
    },
    {
      name: 'lassoSelection',
      value: null,
      on: [
        {
          events: 'mouseup[event.shiftKey]',
          update: "[invert('xscale', lassoStart[0]), invert('yscale', lassoStart[1]), invert('xscale', lassoEnd[0]), invert('yscale', lassoEnd[1])]",
        },
      ],
    },
    {
      name: 'lassoStart',
      value: null,
      on: [
        { events: 'mousedown[event.shiftKey]', update: 'xy()' },
        { events: 'mouseup[event.shiftKey]', update: 'null' },
      ],
    },
    {
      name: 'lassoEnd',
      value: [0, 0],
      on: [
        {
          events: [
            {
              source: 'window',
              type: 'mousemove',
              between: [
                { type: 'mousedown', filter: 'event.shiftKey' },
                { source: 'window', type: 'mouseup' },
              ],
            },
          ],
          update: 'lassoStart ? xy() : [0,0]',
        },
      ],
    },
  ];

  spec.marks[0].marks = [
    ...spec.marks[0].marks,
    {
      name: 'trajectoryPath',
      type: 'line',
      from: { data: 'pathData' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'x' },
          y: { scale: 'yscale', field: 'y' },
          size: { value: 25 },
          stroke: { value: '#ccc' },
          defined: {
            signal: 'isValid(datum["x"]) && isFinite(+datum["x"]) && isValid(datum["y"]) && isFinite(+datum["y"])',
          },
        },
      },
    },
    {
      type: 'symbol',
      name: 'pathNodes',
      interactive: true,
      from: {
        data: 'pathData',
      },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'x' },
          y: { scale: 'yscale', field: 'y' },
          size: { signal: 'size' },
          stroke: { value: 'black' },
          strokeOpacity: [
            { test: 'isValid(datum.x)', value: 1 },
            { value: 0 },
          ],
          fill: [
            { test: 'datum.selected', value: 'red' },
            { value: 'white' },
          ],
          shape: { value: 'circle' },
          fillOpacity: [
            { test: 'isValid(datum.x)', value: 1 },
            { value: 0 },
          ],
          defined: {
            signal: 'isValid(datum["x"]) && isFinite(+datum["x"]) && isValid(datum["y"]) && isFinite(+datum["y"])',
          },
        },
      },
    },
    {
      name: 'highlightNodes',
      type: 'symbol',
      from: { data: 'highlight' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'x' },
          y: { scale: 'yscale', field: 'y' },
          size: { signal: 'size' },
          fill: { value: 'red ' },
          shape: { value: 'circle' },
        },
      },
    },
    {
      name: 'selection',
      type: 'rect',
      encode: {
        update: {
          fillOpacity: { value: 0.20 },
          fill: { value: 'grey' },
          x: { signal: 'lassoStart && lassoStart[0]' },
          x2: { signal: 'lassoStart && lassoEnd[0]' },
          y: { signal: 'lassoStart && lassoStart[1]' },
          y2: { signal: 'lassoStart && lassoEnd[1]' },
        },
      },
    },
  ];
};

const insertPseudotimeSpec = (spec, config, pseudotime) => {
  const positionIsRight = config.legend.position === 'right';

  const legendColumns = positionIsRight ? 1 : 0;
  const labelLimit = positionIsRight ? 0 : maxLabelLength;

  spec.description = `${spec.description} showing pseudotime`;

  spec.data = [
    ...spec?.data,
    {
      name: 'backgroundPseudotime',
      values: pseudotime.cellsWithoutPseudotimeValue,

    },
    {
      name: 'pseudotime',
      values: pseudotime.cellsWithPseudotimeValue,
    },
  ];

  spec.scales = [
    ...spec.scales,
    {
      name: 'pseudotimeScale',
      type: 'quantize',
      range: {
        scheme: config.colour.gradient === 'default'
          ? (config.colour.toggleInvert === '#FFFFFF' ? 'purplered' : 'darkgreen')
          : config.colour.gradient,
        count: 5,
      },
      domain: { data: 'pseudotime', field: 'value' },
    },
  ];

  if (config.legend.enabled) {
    spec.legends = [
      {
        fill: 'pseudotimeScale',
        type: 'symbol',
        orient: config.legend.position,
        title: 'Pseudotime',
        gradientLength: 100,
        labelColor: config.colour.masterColour,
        titleColor: config.colour.masterColour,
        direction: positionIsRight ? 'vertical' : 'horizontal',
        symbolType: 'circle',
        symbolSize: 100,
        offset: 40,
        columns: legendColumns,
        labelLimit,
      },
    ];
  }

  spec.marks[0].marks = [
    ...spec.marks[0].marks,
    {
      type: 'symbol',
      name: 'cellsWithNoPseudotimeValue',
      from: { data: 'backgroundPseudotime' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'x' },
          y: { scale: 'yscale', field: 'y' },
          size: { value: config.marker.size },
          fill: { value: 'lightgrey' },
          shape: { value: config.marker.shape },
          fillOpacity: { value: config.marker.opacity / 10 },
        },
      },
    },
    {
      type: 'symbol',
      name: 'cellsWithPseudotimeValue',
      from: { data: 'pseudotime' },
      encode: {
        update: {
          x: { scale: 'xscale', field: 'x' },
          y: { scale: 'yscale', field: 'y' },
          size: { value: config.marker.size },
          fill: {
            scale: 'pseudotimeScale',
            field: 'value',
          },
          shape: { value: config.marker.shape },
          fillOpacity: { value: config.marker.opacity / 10 },
        },
      },
    },
  ];
};

// Filter for nodes that appear later than the current node
const getConnectedNodes = (nodeId, connectedNodes) => {
  const parseNode = (id) => Number.parseInt(id.slice(2), 10);
  const root = parseNode(nodeId);

  const filteredNodes = connectedNodes.map((id) => parseNode(id)).filter((id) => id > root);
  return filteredNodes.map((id) => `Y_${id}`);
};

// Data returned from the trajectory analysis worker is 0 centered
// This has to be remapped onto the embedding
const generateStartingNodesData = (nodes) => {
  const trajectoryNodes = [];

  Object.values(nodes).forEach((node) => {
    const connectedNodes = getConnectedNodes(node.node_id, node.connected_nodes);

    if (!connectedNodes.length) return;

    connectedNodes.forEach((connectedNodeId) => {
      const connNode = nodes[connectedNodeId];

      trajectoryNodes.push({ x: node.x, y: node.y, node_id: node.node_id });
      trajectoryNodes.push({ x: connNode.x, y: connNode.y, node_id: connectedNodeId });
      trajectoryNodes.push({ x: null, y: null, node_id: null });
    });
  });

  return trajectoryNodes;
};

const generatePseudotimeData = (
  cellSets,
  plotData,
  embeddingData,
) => {
  const selectedSampleCells = getAllCells(cellSets).map((cell) => cell.cellId);

  const cellsWithPseudotimeValue = [];
  const cellsWithoutPseudotimeValue = [];

  const filteredCells = embeddingData
    .map((coordinates, cellId) => ({ cellId, coordinates }))
    .filter(({ cellId }) => selectedSampleCells.includes(cellId))
    .filter(({ coordinates }) => coordinates !== undefined);

  filteredCells
    .forEach((data) => {
      const { cellId, coordinates } = data;
      const cellData = {
        x: coordinates[0],
        y: coordinates[1],
        value: plotData[cellId],
      };

      if (cellData.value) {
        cellsWithPseudotimeValue.push(cellData);
      } else {
        cellsWithoutPseudotimeValue.push(cellData);
      }
    });

  return {
    cellsWithPseudotimeValue,
    cellsWithoutPseudotimeValue,
  };
};

const generateTrajectoryAnalysisSpec = (
  config,
  viewState,
  plotState,
  embeddingPlotData,
  pseudotimeData,
  cellSetLegendsData,
  startingNodesData,
  selectedNodeIds,
) => {
  const spec = generateBaseSpec(
    config,
    embeddingPlotData,
    viewState,
    plotState.isZoomedOrPanned,
    cellSetLegendsData.length,
  );

  if (plotState.displayPseudotime && pseudotimeData) {
    insertPseudotimeSpec(spec, config, pseudotimeData);
  } else {
    insertClusterColorsSpec(spec, config, cellSetLegendsData, cellSetLegendsData.length);
  }

  if (plotState.displayTrajectory) {
    insertTrajectorySpec(
      spec,
      startingNodesData,
      selectedNodeIds,
    );
  }

  return spec;
};

export {
  generateTrajectoryAnalysisSpec,
  generateStartingNodesData,
  generatePseudotimeData,
};