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
import { getSavedPlots } from 'redux/selectors';
import loadConditionalComponentConfig from 'redux/actions/componentConfig/loadConditionalComponentConfig';

const { Text } = Typography;
const { TextArea } = Input;

const savedPlotsUuid = 'savedPlots';

const SavePlotModal = ({ experimentId, config, plotType, onExit }) => {
  const dispatch = useDispatch();

  const savedPlots = useSelector(getSavedPlots());

  const [plotNames, setPlotNames] = useState(new Set());
  const [plotName, setPlotName] = useState('');
  const [plotDescription, setPlotDescription] = useState('');
  const [validateName, setValidateName] = useState({});
  const [validateDesc, setValidateDesc] = useState({});

  const validationChecksName = [
    rules.MIN_1_CHAR,
    rules.ALPHANUM_DASH_SPACE,
    rules.UNIQUE_NAME_CASE_INSENSITIVE,
  ];

  const validationChecksDesc = [
    rules.ALPHANUM_DASH_SPACE,
  ];

  const validationParams = {
    existingNames: plotNames,
  };

  useEffect(() => {
    setPlotNames(new Set(Object.values(plotTypes).map((type) => savedPlots[type].plots).flat()));
  }, [savedPlots]);

  useEffect(() => {
    setValidateName(validateInputs(plotName, validationChecksName, validationParams));
  }, [plotName]);

  useEffect(() => {
    setValidateDesc(validateInputs(plotDescription, validationChecksDesc, {}));
  }, [plotDescription]);

  const submit = () => {
    dispatch(updatePlotConfig(
      savedPlotsUuid,
      {
        [plotType]: {
          plots: [...savedPlots[plotType].plots, plotName],
          descriptions: [...savedPlots[plotType].descriptions, plotDescription],
        },
      },
    ));

    dispatch(loadConditionalComponentConfig(experimentId, plotName, plotType, true, config));

    setPlotName('');

    onExit();
  };

  return (
    <Modal
      title='Save current plot as...'
      visible
      footer={(
        <Button
          type='primary'
          key='save'
          block
          disabled={!validateName.isValid || !validateDesc.isValid}
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
            validateStatus={validateName.isValid ? 'success' : 'error'}
            help={
              validateName.results
                ? (
                  <ul>
                    {validateName.results
                      .filter((msg) => msg !== true)
                      .map((msg) => <li>{msg}</li>)}
                  </ul>
                )
                : ''
            }
            label={(
              <span>
                Plot name
              </span>
            )}
            required
            name='plotName'
          >
            <Input
              onChange={(e) => {
                setPlotName(e.target.value.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateName.isValid) {
                  submit();
                }
              }}
              placeholder='Ex.: Figure 2a'
              value={plotName}
            />
          </Form.Item>
          <Form.Item
            validateStatus={validateDesc.isValid ? 'success' : 'error'}
            help={
              validateDesc.results
                ? (
                  <ul>
                    {validateDesc.results
                      .filter((msg) => msg !== true)
                      .map((msg) => <li>{msg}</li>)}
                  </ul>
                )
                : ''
            }
            label='Plot description'
            required
            requiredMark='optional'
          >
            <TextArea
              onChange={(e) => { setPlotDescription(e.target.value); }}
              placeholder='Type description'
              value={plotDescription}
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

SavePlotModal.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object.isRequired,
  plotType: PropTypes.string.isRequired,
  onExit: PropTypes.func.isRequired,
};

export default SavePlotModal;