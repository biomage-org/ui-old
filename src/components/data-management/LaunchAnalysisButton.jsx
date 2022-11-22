import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, Tooltip, Popconfirm,
} from 'antd';
import { modules, techTypes } from 'utils/constants';
import PropTypes from 'prop-types';

import fileUploadSpecifications from 'utils/upload/fileUploadSpecifications';
import UploadStatus from 'utils/upload/UploadStatus';
import integrationTestConstants from 'utils/integrationTestConstants';
import { runGem2s, runSeurat } from 'redux/actions/pipeline';
import calculatePipelineRerunStatus from 'utils/data-management/calculatePipelineRerunStatus';

import { useAppRouter } from 'utils/AppRouteProvider';

const runnersByTechnology = {
  [techTypes.CHROMIUM]: runGem2s,
  [techTypes.SEURAT]: runSeurat,
};

const pipelineByTechnology = {
  [techTypes.CHROMIUM]: 'gem2s',
  [techTypes.SEURAT]: 'seurat',

};

const LaunchButtonTemplate = (props) => {
  const {
    // eslint-disable-next-line react/prop-types
    onClick, disabled, text, loading,
  } = props;

  return (
    <Button
      data-test-id={integrationTestConstants.ids.PROCESS_PROJECT_BUTTON}
      type='primary'
      disabled={disabled}
      onClick={onClick}
      loading={loading}
    >
      {text}
    </Button>
  );
};

const LaunchAnalysisButton = (props) => {
  const { technology } = props;
  const dispatch = useDispatch();
  const { navigateTo } = useAppRouter();

  const experiments = useSelector((state) => state.experiments);
  const samples = useSelector((state) => state.samples);
  const backendStatus = useSelector((state) => state.backendStatus);

  const { activeExperimentId } = experiments.meta;
  const activeExperiment = experiments[activeExperimentId];

  const [pipelineRerunStatus, setPipelineRerunStatus] = useState(
    {
      rerun: true, paramsHash: null, reasons: [], complete: false,
    },
  );

  const [seuratComplete, setSeuratComplete] = useState(false);

  useEffect(() => {
    const isSeuratComplete = technology === techTypes.SEURAT && pipelineRerunStatus.complete;
    setSeuratComplete(isSeuratComplete);
  }, [pipelineRerunStatus, technology]);

  const launchAnalysis = () => {
    const runner = runnersByTechnology[technology];
    if (pipelineRerunStatus.rerun) {
      dispatch(runner(activeExperimentId, pipelineRerunStatus.paramsHash));
    }

    const moduleName = seuratComplete ? modules.DATA_EXPLORATION : modules.DATA_PROCESSING;
    navigateTo(moduleName, { experimentId: activeExperimentId });
  };

  useEffect(() => {
    // The value of backend status is null for new experiments that have never run
    const pipeline = pipelineByTechnology[technology];
    const pipelineBackendStatus = backendStatus[activeExperimentId]?.status?.[pipeline];

    if (
      !pipelineBackendStatus
      || !experiments[activeExperimentId]?.sampleIds?.length > 0
    ) return;

    const pipelineStatus = calculatePipelineRerunStatus(
      pipelineBackendStatus, activeExperiment, samples,
    );
    setPipelineRerunStatus(pipelineStatus);
  }, [backendStatus, activeExperimentId, samples, activeExperiment]);

  const canLaunchAnalysis = useCallback(() => {
    if (activeExperiment.sampleIds.length === 0) return false;

    // Check that samples is loaded
    const testSampleUuid = activeExperiment.sampleIds[0];
    if (samples[testSampleUuid] === undefined) return false;

    const metadataKeysAvailable = activeExperiment.metadataKeys.length;

    const allSampleFilesUploaded = (sample) => {
      // Check if all files for a given tech has been uploaded
      const { fileNames } = sample;

      if (!fileUploadSpecifications[sample.type].requiredFiles.every(
        (file) => fileNames.includes(file),
      )) { return false; }

      let allUploaded = true;

      // eslint-disable-next-line no-restricted-syntax
      for (const fileName of fileNames) {
        const checkedFile = sample.files[fileName];
        allUploaded = allUploaded
          && checkedFile.valid
          && checkedFile.upload.status === UploadStatus.UPLOADED;

        if (!allUploaded) break;
      }

      return allUploaded;
    };

    const allSampleMetadataInserted = (sample) => {
      if (!metadataKeysAvailable) return true;

      if (Object.keys(sample.metadata).length !== metadataKeysAvailable) return false;
      return Object.values(sample.metadata)
        .every((value) => value.length > 0);
    };

    const canLaunch = activeExperiment.sampleIds.every((sampleUuid) => {
      if (!samples[sampleUuid]) return false;

      const checkedSample = samples[sampleUuid];
      return allSampleFilesUploaded(checkedSample)
        && allSampleMetadataInserted(checkedSample);
    });
    return canLaunch;
  }, [samples, activeExperiment?.sampleIds, activeExperiment?.metadataKeys]);

  const renderLaunchButton = () => {
    let buttonText;

    if (pipelineRerunStatus.rerun) {
      buttonText = 'Process project';
    } else if (seuratComplete) {
      buttonText = 'Go to Data Exploration';
    } else {
      buttonText = 'Go To Data Processing';
    }

    if (!backendStatus[activeExperimentId] || backendStatus[activeExperimentId]?.loading) {
      return <LaunchButtonTemplate text='Loading project...' disabled loading />;
    }

    if (!canLaunchAnalysis()) {
      return (
        <Tooltip
          title='Ensure that all samples are uploaded successfully and all relevant metadata is inserted.'
        >
          {/* disabled button inside tooltip causes tooltip to not function */}
          {/* https://github.com/react-component/tooltip/issues/18#issuecomment-140078802 */}
          <span>
            <LaunchButtonTemplate text={buttonText} disabled />
          </span>
        </Tooltip>
      );
    }

    if (pipelineRerunStatus.rerun) {
      return (
        <Popconfirm
          title={`This project has to be processed because ${pipelineRerunStatus.reasons.join(' and ')}. \
        This will take several minutes.\
        Do you want to continue?`}
          onConfirm={() => launchAnalysis()}
          okText='Yes'
          okButtonProps={{ 'data-test-id': integrationTestConstants.ids.CONFIRM_PROCESS_PROJECT }}
          cancelText='No'
          placement='bottom'
          overlayStyle={{ maxWidth: '250px' }}
        >
          <LaunchButtonTemplate text={buttonText} />
        </Popconfirm>
      );
    }

    return <LaunchButtonTemplate text={buttonText} onClick={() => launchAnalysis()} />;
  };

  return renderLaunchButton();
};

LaunchAnalysisButton.propTypes = {
  technology: PropTypes.string,
};

LaunchAnalysisButton.defaultProps = {
  technology: null,
};

export default LaunchAnalysisButton;
