import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  Button,
  Space,
  Form,
  Input,
  Typography,
} from 'antd';
import validateInputs, { rules } from 'utils/validateInputs';
import { plotTypes } from 'utils/constants';
import { updatePlotConfig } from 'redux/actions/componentConfig';

const { Text } = Typography;
const { TextArea } = Input;

const savedPlotsUuid = 'savedPlots';

const SavePlotModal = ({ plotType, onExit }) => {
  const dispatch = useDispatch();

  const savedPlotsConfig = useSelector((state) => state.componentConfig[savedPlotsUuid]?.config);

  const [plotNames, setPlotNames] = useState(new Set());
  const [plotName, setPlotName] = useState('');
  const [plotDescription, setPlotDescription] = useState('');
  const [isValidName, setIsValidName] = useState(false);

  const validationChecks = [
    rules.MIN_1_CHAR,
    rules.ALPHANUM_DASH_SPACE,
    rules.UNIQUE_NAME_CASE_INSENSITIVE,
  ];

  const validationParams = {
    existingNames: plotNames,
  };

  useEffect(() => {
    setPlotNames(new Set(Object.values(plotTypes).map((type) => savedPlotsConfig[type]).flat()));
  }, [savedPlotsConfig]);

  useEffect(() => {
    setIsValidName(validateInputs(plotName, validationChecks, validationParams).isValid);
  }, [plotName]);

  const submit = () => {
    setPlotName('');

    dispatch(updatePlotConfig(
      savedPlotsUuid, { [plotType]: [...savedPlotsConfig[plotType], plotName] },
    ));

    onExit();
  };

  return (
    <Modal
      title='Save current plot as...'
      visible
      footer={(
        <Button
          type='primary'
          key='create'
          block
          disabled={!isValidName}
          onClick={() => {
            submit();
          }}
        >
          Save Plot
        </Button>
      )}
    >
      <Space>
        <Form layout='vertical'>
          <Form.Item
            validateStatus={isValidName ? 'success' : 'error'}
            help={(
              <ul>
                {validateInputs(
                  plotName,
                  validationChecks,
                  validationParams,
                ).results
                  .filter((msg) => msg !== true)
                  .map((msg) => <li>{msg}</li>)}
              </ul>
            )}
            label={(
              <span>
                Plot name
                {' '}
                <Text type='secondary'>(You can change this later)</Text>
              </span>
            )}
            required
            name='requiredMark'
          >
            <Input
              onChange={(e) => {
                setPlotName(e.target.value.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValidName) {
                  submit();
                }
              }}
              placeholder='Ex.: Figure 2a'
              value={plotName}
            />
          </Form.Item>
          <Form.Item
            label='Plot description'
          >
            <TextArea
              onChange={(e) => { setPlotDescription(e.target.value); }}
              placeholder='Type description'
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

SavePlotModal.propTypes = {
  plotType: PropTypes.string.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default SavePlotModal;
