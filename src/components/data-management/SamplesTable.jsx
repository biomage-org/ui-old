/* eslint-disable react/jsx-props-no-spreading */
import _ from 'lodash';
import React, {
  useEffect, useState, forwardRef, useImperativeHandle, useMemo, useCallback, useRef,
} from 'react';
import { VList } from 'virtuallist-antd';

import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Row, Col, Typography, Space,
} from 'antd';
import {
  MenuOutlined,
} from '@ant-design/icons';
import { sortableHandle, sortableContainer, sortableElement } from 'react-sortable-hoc';

import ExampleExperimentsSpace from 'components/data-management/ExampleExperimentsSpace';
import MetadataPopover from 'components/data-management/MetadataPopover';
import MetadataColumnTitle from 'components/data-management/MetadataColumn';
import { UploadCell, SampleNameCell, EditableFieldCell } from 'components/data-management/SamplesTableCells';

import {
  deleteMetadataTrack,
  createMetadataTrack,
  updateValueInMetadataTrack,
  reorderSamples,
} from 'redux/actions/experiments';

import { loadSamples } from 'redux/actions/samples';

import UploadStatus from 'utils/upload/UploadStatus';
import { arrayMoveImmutable } from 'utils/array-move';

import { metadataNameToKey, metadataKeyToName, temporaryMetadataKey } from 'utils/data-management/metadataUtils';
import integrationTestConstants from 'utils/integrationTestConstants';
import 'utils/css/data-management.css';
import { ClipLoader } from 'react-spinners';
import useConditionalEffect from 'utils/customHooks/useConditionalEffect';
import { METADATA_DEFAULT_VALUE } from 'redux/reducers/experiments/initialState';
import fileUploadSpecifications from 'utils/upload/fileUploadSpecifications';

const { Text } = Typography;

const SamplesTable = forwardRef((props, ref) => {
  const dispatch = useDispatch();

  const [fullTableData, setFullTableData] = useState([]);

  const samples = useSelector((state) => state.samples);

  const samplesLoading = useSelector((state) => state.samples.meta.loading);
  const activeExperimentId = useSelector((state) => state.experiments.meta.activeExperimentId);

  const samplesValidating = useSelector(
    (state) => state.samples.meta.validating.includes(activeExperimentId),
  );
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);

  const selectedTech = useSelector(
    (state) => state.samples[activeExperiment?.sampleIds[0]]?.type,
    _.isEqual,
  );

  // const selectedTech = samples[activeExperiment?.sampleIds[0]]?.type;
  const [sampleNames, setSampleNames] = useState(new Set());
  const DragHandle = sortableHandle(() => <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />);

  const initialTableColumns = useMemo(() => ([
    {
      fixed: 'left',
      index: 0,
      key: 'sort',
      dataIndex: 'sort',
      width: 30,
      render: () => <DragHandle />,
    },
    {
      className: `${integrationTestConstants.classes.SAMPLE_CELL}`,
      index: 1,
      key: 'sample',
      title: 'Sample',
      dataIndex: 'name',
      fixed: true,
      minWidth: '40%',
      render: (text, record, indx) => (
        <SampleNameCell cellInfo={{ text, record, indx }} />
      ),
    },
    ...fileUploadSpecifications[selectedTech]?.requiredFiles?.map((fileName, indx) => {
      const fileNameWithoutExtension = fileName.key.split('.')[0];

      console.log('fileNameWithoutExtensionDebug');

      return ({
        index: 2 + indx,
        title: <center>{fileName.displayedName}</center>,
        key: fileNameWithoutExtension,
        dataIndex: fileNameWithoutExtension,
        width: '20%',
        onCell: () => ({ style: { margin: '0px', padding: '0px' } }),
        render: (tableCellData) => tableCellData && (
          <UploadCell
            columnId={fileName.key}
            sampleUuid={tableCellData.sampleUuid}
          />
        ),
      });
    }) || [],

  ]), [selectedTech]);

  const [tableColumns, setTableColumns] = useState(initialTableColumns);

  useEffect(() => {
    const alreadyLoaded = _.isEqual(
      fullTableData.map(({ key }) => key),
      activeExperiment.sampleIds,
    );

    if (alreadyLoaded) return;

    const samplesLoaded = activeExperiment?.sampleIds.every((sampleId) => samples[sampleId]);
    if (activeExperiment?.sampleIds.length > 0 && samplesLoaded) {
      // if there are samples - build the table columns

      const sanitizedSampleNames = new Set(
        activeExperiment.sampleIds.map((id) => samples[id]?.name.trim()),
      );

      setSampleNames(sanitizedSampleNames);
      const metadataColumns = activeExperiment.metadataKeys.map(
        (metadataKey) => createInitializedMetadataColumn(metadataKeyToName(metadataKey)),
      ) || [];
      setTableColumns([...initialTableColumns, ...metadataColumns]);
    } else {
      setTableColumns([]);
      setSampleNames(new Set());
    }
  }, [samples, activeExperiment?.sampleIds]);

  useConditionalEffect(() => {
    dispatch(loadSamples(activeExperimentId));
  }, [activeExperimentId], { lazy: true });

  const deleteMetadataColumn = (name) => {
    dispatch(deleteMetadataTrack(name, activeExperimentId));
  };

  const createInitializedMetadataColumn = (name) => {
    const key = metadataNameToKey(name);

    return {
      key,
      title: () => (
        <MetadataColumnTitle
          name={name}
          sampleNames={sampleNames}
          setCells={setCells}
          deleteMetadataColumn={deleteMetadataColumn}
          activeExperimentId={activeExperimentId}
        />
      ),
      width: 200,
      dataIndex: key,
      render: (cellValue, record, rowIdx) => (
        <EditableFieldCell
          cellText={cellValue}
          dataIndex={key}
          rowIdx={rowIdx}
          onAfterSubmit={(newValue) => {
            dispatch(updateValueInMetadataTrack(activeExperimentId, record.uuid, key, newValue));
          }}
        />
      ),
    };
  };

  const onMetadataCreate = (name) => {
    dispatch(createMetadataTrack(name, activeExperimentId));
  };

  useImperativeHandle(ref, () => ({

    createMetadataColumn() {
      const key = temporaryMetadataKey(tableColumns);
      const previousTableColumns = tableColumns;
      const metadataCreateColumn = {
        key,
        fixed: 'right',
        title: () => (
          <MetadataPopover
            existingMetadata={activeExperiment.metadataKeys}
            onCreate={(name) => {
              onMetadataCreate(name);
            }}
            onCancel={() => {
              setTableColumns(previousTableColumns);
            }}
            message='Provide new metadata track name'
            visible
          >
            <Space>
              New Metadata Track
            </Space>
          </MetadataPopover>
        ),
        width: 200,
      };
      setTableColumns([...tableColumns, metadataCreateColumn]);
    },
  }));

  const MASS_EDIT_ACTIONS = [
    'REPLACE_EMPTY',
    'REPLACE_ALL',
    'CLEAR_ALL',
  ];

  const setCells = (value, metadataKey, actionType) => {
    if (!MASS_EDIT_ACTIONS.includes(actionType)) return;

    const canUpdateCell = (sampleUuid, action) => {
      if (action !== 'REPLACE_EMPTY') return true;

      const isMetadataEmpty = (uuid) => (
        !samples[uuid].metadata[metadataKey]
        || samples[uuid].metadata[metadataKey] === METADATA_DEFAULT_VALUE
      );

      return isMetadataEmpty(sampleUuid);
    };

    activeExperiment.sampleIds.forEach(
      (sampleUuid) => {
        if (canUpdateCell(sampleUuid, actionType)) {
          dispatch(updateValueInMetadataTrack(activeExperimentId, sampleUuid, metadataKey, value));
        }
      },
    );
  };

  const generateDataForItem = useCallback((sampleUuid) => {
    const sampleFileNames = fileUploadSpecifications[selectedTech]?.requiredFiles
      .map((fileName) => ([
        fileName.key.split('.')[0],
        { sampleUuid },
      ]));

    return {
      key: sampleUuid,
      name: samples[sampleUuid]?.name || 'UPLOAD ERROR: Please reupload sample',
      uuid: sampleUuid,
      ...Object.fromEntries(sampleFileNames),
      // ...fileData,
      // ...samples[sampleUuid]?.metadata,
    };
  }, [activeExperiment?.sampleIds, selectedTech, samples]);

  const noDataComponent = (
    <ExampleExperimentsSpace
      introductionText='Start uploading your samples by clicking on Add samples.'
      imageStyle={{ height: 60 }}
    />
  );

  const onSortEnd = async ({ oldIndex, newIndex }) => {
    // if (oldIndex !== newIndex) {
    //   const newData = arrayMoveImmutable(fullTableData, oldIndex, newIndex).filter((el) => !!el);
    //   const newSampleOrder = newData.map((sample) => sample.uuid);

    //   try {
    //     await dispatch(reorderSamples(activeExperimentId, oldIndex, newIndex, newSampleOrder));
    //   } catch (e) {
    //     // If the fetch fails, avoid doing setTableData(newData)
    //     return;
    //   }

    //   console.log('HOLAHOLA');

    //   setFullTableData(() => {
    //     console.log('newDataDebug');
    //     console.log(newData);
    //     return newData;
    //   });
    // }
  };

  const SortableRow = sortableElement((otherProps) => <tr {...otherProps} className={`${otherProps.className} drag-visible`} />);
  const SortableTable = sortableContainer((otherProps) => <tbody {...otherProps} />);

  const DragContainer = (otherProps) => (
    <SortableTable
      useDragHandle
      disableAutoscroll
      helperClass='row-dragging'
      onSortEnd={onSortEnd}
      {...otherProps}
    />
  );

  const DraggableRow = (otherProps) => {
    const index = fullTableData.findIndex((x) => x.key === otherProps['data-row-key']);
    return <SortableRow index={index} {...otherProps} />;
  };

  const renderLoader = () => (
    <>
      <Row justify='center'>
        <ClipLoader
          size={50}
          color='#8f0b10'
        />
      </Row>

      <Row justify='center'>
        <Text>
          {
            samplesLoading ? 'We\'re getting your samples ...'
              : samplesValidating ? 'We\'re validating your samples ...'
                : ''
          }
        </Text>
      </Row>
    </>
  );

  // const onReachEnd = (...params) => {
  //   console.log('paramsDebug');
  //   console.log(params);
  // };

  useEffect(() => {
    if (!activeExperiment?.sampleIds.length) {
      setFullTableData([]);
    }

    const alreadyInTable = () => _.isEqual(
      fullTableData.map(({ key }) => key),
      activeExperiment.sampleIds,
    );

    const anyNotLoadedYet = () => activeExperiment.sampleIds.some((sampleId) => !samples[sampleId]);

    if (alreadyInTable() || anyNotLoadedYet()) return;

    const newData = activeExperiment.sampleIds.map((sampleUuid) => generateDataForItem(sampleUuid));

    console.log('newDataDebug');
    console.log(newData);

    setFullTableData(newData);
  }, [activeExperiment?.sampleIds, samples]);

  const tableHeight = 600;
  // const tableHeight = 'max-content';

  const vComponents = useMemo(() =>
    // 使用VList 即可有虚拟列表的效果
    VList({
      height: tableHeight, // 此值和scrollY值相同. 必传. (required).  same value for scrolly
      resetTopWhenDataChange: false,
    }), []);
  // onListRender: onListRenderHandler,
  // }), [onListRenderHandler]);

  const renderSamplesTable = () => (
    <Row>
      <Col>
        <Table
          id='samples-table'
          size='large'
          scroll={{
            x: 'max-content',
            y: tableHeight,
          }}
          bordered
          columns={tableColumns}
          dataSource={fullTableData}
          sticky
          pagination={false}
          locale={{ emptyText: noDataComponent }}
          components={vComponents}
        // components={{
        //   body: {
        //     wrapper: DragContainer,
        //     row: DraggableRow,
        //   },
        // }}
        />
      </Col>
    </Row>
  );

  return (
    <>
      {samplesLoading || samplesValidating ? renderLoader() : renderSamplesTable()}
    </>
  );
});

export default React.memo(SamplesTable);
