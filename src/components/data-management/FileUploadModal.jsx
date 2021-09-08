/* eslint-disable import/no-unresolved */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Modal,
  Button,
  Typography,
  Select,
  Space,
  Row,
  Col,
  Empty,
  Divider,
  List,
} from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone, DeleteOutlined } from '@ant-design/icons';
import Dropzone from 'react-dropzone';
import techOptions from '../../utils/upload/fileUploadSpecifications';
import pushNotificationMessage from '../../utils/pushNotificationMessage';
import { bundleToFile } from '../../utils/upload/processUpload';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const FileUploadModal = (props) => {
  const { visible, onUpload, onCancel } = props;

  const guidanceFileLink = 'https://drive.google.com/file/d/1VPaB-yofuExinY2pXyGEEx-w39_OPubO/view';

  const [selectedTech, setSelectedTech] = useState('10X Chromium');
  const [canUpload, setCanUpload] = useState(false);
  const [filesList, setFilesList] = useState([]);

  useEffect(() => {
    setCanUpload(filesList.length && filesList.every((file) => file.valid));
  }, [filesList]);

  // Handle on Drop
  const onDrop = async (acceptedFiles) => {
    let filesNotInFolder = false;
    const filteredFiles = acceptedFiles
      // Remove all hidden files
      .filter((file) => !file.name.startsWith('.') && !file.name.startsWith('__MACOSX'))
      // Remove all files that aren't in a folder
      .filter((file) => {
        const inFolder = file.path.includes('/');

        filesNotInFolder ||= !inFolder;

        return inFolder;
      });

    if (filesNotInFolder) {
      pushNotificationMessage('error',
        'Only files contained in a folder are accepted');
    }

    const newFiles = await Promise.all(filteredFiles.map((file) => (
      bundleToFile(file, selectedTech)
    )));

    setFilesList([...filesList, ...newFiles]);
  };

  const removeFile = (fileName) => {
    const newArray = _.cloneDeep(filesList);

    const fileIdx = newArray.findIndex((file) => file.name === fileName);
    newArray.splice(fileIdx, 1);
    setFilesList(newArray);
  };

  const renderHelpText = () => (
    <>
      <Col span={24} style={{ padding: '1rem' }}>
        <Paragraph>
          For each sample, upload a folder containing the following
          {' '}
          <Text strong>{techOptions[selectedTech].inputInfo.length}</Text>
          {' '}
          files:
        </Paragraph>
        <List
          dataSource={techOptions[selectedTech].inputInfo}
          size='small'
          itemLayout='vertical'
          bordered
          renderItem={(item) => (
            <List.Item>
              {
                item.map((fileName, i) => (
                  <span key={fileName}>
                    <Text code>{`${fileName}`}</Text>
                    {i !== item.length - 1 && ' or '}
                  </span>
                ))
              }
            </List.Item>
          )}
        />
      </Col>
      <Col span={24} style={{ padding: '1rem' }}>
        <Paragraph>
          The folder&apos;s name will be used to name
          the sample in it. You can change this
          name later in Data Management.
        </Paragraph>
        <Paragraph type='secondary'>
          More guidance on supported file types and formats is available
          {' '}
          <a rel='noreferrer' target='_blank' href={guidanceFileLink}>here</a>
          {' '}
          (opens in new tab).
        </Paragraph>
      </Col>
    </>
  );

  return (
    <Modal
      title=''
      visible={visible}
      onCancel={onCancel}
      width='50%'
      footer={(
        <Button
          type='primary'
          key='create'
          block
          disabled={!canUpload}
          onClick={() => {
            onUpload(filesList, selectedTech);
            setFilesList([]);
          }}
        >
          Upload
        </Button>
      )}
    >
      <Row>
        <Col span={24}>
          <Space direction='vertical' style={{ width: '100%' }}>
            <Space align='baseline'>
              <Title level={4} style={{ display: 'inline-block' }}>
                Technology:
                <span style={{ color: 'red', marginRight: '2em' }}>*</span>
              </Title>
              <Select
                defaultValue={selectedTech}
                onChange={(value) => setSelectedTech(value)}
              >
                {Object.keys(techOptions).map((val) => (
                  <Option key={`key-${val}`} value={val}>{val}</Option>
                ))}
              </Select>
            </Space>
            <Text type='secondary'><i>Only 10x Chromium datasets are currently supported</i></Text>
          </Space>
        </Col>

        {selectedTech && renderHelpText()}

        {/* eslint-disable react/jsx-props-no-spreading */}
        <Col span={24}>
          <Dropzone onDrop={onDrop} multiple>
            {({ getRootProps, getInputProps }) => (
              <div data-test-id='file-upload-dropzone' style={{ border: '1px solid #ccc', padding: '2rem 0' }} {...getRootProps({ className: 'dropzone' })} id='dropzone'>
                <input {...getInputProps()} webkitdirectory='' />
                <Empty description='Drag and drop folders here or click to browse.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Dropzone>
        </Col>
        {/* eslint-enable react/jsx-props-no-spreading */}

        {filesList.length ? (
          <>
            <Divider orientation='center'>To upload</Divider>
            <List
              dataSource={filesList}
              size='small'
              itemLayout='horizontal'
              grid='{column: 4}'
              renderItem={(file) => (

                <List.Item
                  key={file.name}
                  style={{ width: '100%' }}
                >
                  <Space>
                    {file.valid
                      ? (
                        <>
                          <CheckCircleTwoTone twoToneColor='#52c41a' />
                        </>
                      ) : (
                        <>
                          <CloseCircleTwoTone twoToneColor='#f5222d' />
                        </>
                      )}
                    <Text
                      ellipsis={{ tooltip: file.name }}
                      style={{ width: '200px' }}
                    >
                      {file.name}

                    </Text>
                    <DeleteOutlined style={{ color: 'crimson' }} onClick={() => { removeFile(file.name); }} />
                  </Space>
                </List.Item>

              )}
            />
          </>
        ) : ''}
      </Row>
    </Modal>

  );
};

FileUploadModal.propTypes = {
  visible: PropTypes.bool,
  onUpload: PropTypes.func,
  onCancel: PropTypes.func,
};

FileUploadModal.defaultProps = {
  visible: true,
  onUpload: null,
  onCancel: null,
};

export default FileUploadModal;
