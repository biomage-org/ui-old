import React from 'react';
import { Space, Input } from 'antd';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { DEFAULT_NA } from 'redux/reducers/projects/initialState';
import {
  updateMetadataTrack,
} from 'redux/actions/projects';
import validateInputs, { rules } from 'utils/validateInputs';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import EditableField from '../EditableField';
import MetadataEditor from './MetadataEditor';

const MetadataColumnTitle = (props) => {
  const {
    name, sampleNames, activeExperimentId, deleteMetadataColumn, setCells,
  } = props;

  const validationParams = {
    existingNames: sampleNames,
  };

  return (
    <MetadataTitle
      name={name}
      validateInput={
        (newName, metadataNameValidation) => validateInputs(
          newName, metadataNameValidation, validationParams,
        ).isValid
      }
      setCells={setCells}
      deleteMetadataColumn={deleteMetadataColumn}
      activeExperimentId={activeExperimentId}
    />
  );
};

MetadataColumnTitle.propTypes = {
  name: PropTypes.string.isRequired,
  sampleNames: PropTypes.instanceOf(Set).isRequired,
  setCells: PropTypes.func.isRequired,
  deleteMetadataColumn: PropTypes.func.isRequired,
  activeExperimentId: PropTypes.string.isRequired,
};

const MetadataTitle = (props) => {
  const dispatch = useDispatch();
  const {
    name, validateInput, setCells, deleteMetadataColumn, activeExperimentId,
  } = props;
  const metaKey = metadataNameToKey(name);

  const metadataNameValidation = [
    rules.MIN_1_CHAR,
    rules.ALPHANUM_SPACE,
    rules.START_WITH_ALPHABET,
    rules.UNIQUE_NAME_CASE_INSENSITIVE,
  ];
  return (
    <Space>
      <EditableField
        deleteEnabled
        onDelete={(e, currentName) => deleteMetadataColumn(currentName)}
        onAfterSubmit={(newName) => dispatch(
          updateMetadataTrack(name, newName, activeExperimentId),
        )}
        value={name}
        validationFunc={
          (newName) => validateInput(newName, metadataNameValidation)
        }
      />
      <MetadataEditor
        onReplaceEmpty={(value) => setCells(value, metaKey, 'REPLACE_EMPTY')}
        onReplaceAll={(value) => setCells(value, metaKey, 'REPLACE_ALL')}
        onClearAll={() => setCells(DEFAULT_NA, metaKey, 'CLEAR_ALL')}
        massEdit
      >
        <Input />
      </MetadataEditor>
    </Space>
  );
};
MetadataTitle.propTypes = {
  name: PropTypes.string.isRequired,
  validateInput: PropTypes.func.isRequired,
  setCells: PropTypes.func.isRequired,
  deleteMetadataColumn: PropTypes.func.isRequired,
  activeExperimentId: PropTypes.string.isRequired,
};
export default MetadataColumnTitle;
