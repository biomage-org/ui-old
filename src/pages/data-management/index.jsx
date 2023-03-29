import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Alert } from 'antd';
import { loadExperiments } from 'redux/actions/experiments';

import Header from 'components/Header';
import MultiTileContainer from 'components/MultiTileContainer';
import NewProjectModal from 'components/data-management/NewProjectModal';
import ProjectsListContainer from 'components/data-management/ProjectsListContainer';
import ProjectDetails from 'components/data-management/ProjectDetails';
import { loadProcessingSettings } from 'redux/actions/experimentSettings';
import loadBackendStatus from 'redux/actions/backendStatus/loadBackendStatus';
import { loadSamples } from 'redux/actions/samples';
import ExampleExperimentsSpace from 'components/data-management/ExampleExperimentsSpace';
import { privacyPolicyIsNotAccepted } from 'utils/deploymentInfo';
import Loader from 'components/Loader';

const DataManagementPage = () => {
  const dispatch = useDispatch();

  const samples = useSelector((state) => state.samples);

  const { activeExperimentId } = useSelector((state) => state.experiments.meta);
  const experiments = useSelector(((state) => state.experiments));
  const user = useSelector((state) => state.user.current);
  const domainName = useSelector((state) => state.networkResources?.domainName);

  const activeExperiment = experiments[activeExperimentId];

  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);

  useEffect(() => {
    if (privacyPolicyIsNotAccepted(user, domainName)) return;

    if (experiments.ids.length === 0) dispatch(loadExperiments());
  }, [user]);

  const samplesAreLoaded = () => {
    const loadedSampleIds = Object.keys(samples);
    return activeExperiment.sampleIds.every((sampleId) => loadedSampleIds.includes(sampleId));
  };

  useEffect(() => {
    // If the active experiment isnt loaded, reload
    if (activeExperimentId && !activeExperiment) {
      dispatch(loadExperiments());
    }
  }, [activeExperiment]);

  useEffect(() => {
    if (!activeExperimentId
      || !activeExperiment
      || privacyPolicyIsNotAccepted(user, domainName)
    ) return;

    dispatch(loadProcessingSettings(activeExperimentId));

    if (!samplesAreLoaded()) dispatch(loadSamples(activeExperimentId));

    dispatch(loadBackendStatus(activeExperimentId));
  }, [activeExperimentId, activeExperiment, user]);

  const PROJECTS_LIST = 'Projects';
  const PROJECT_DETAILS = 'Project Details';

  const TILE_MAP = {
    [PROJECTS_LIST]: {
      toolbarControls: [],
      component: (width, height) => (
        <ProjectsListContainer
          height={height}
          onCreateNewProject={() => setNewProjectModalVisible(true)}
        />
      ),
    },
    [PROJECT_DETAILS]: {
      toolbarControls: [],
      component: (width, height) => {
        if (!activeExperimentId) {
          return <ExampleExperimentsSpace introductionText='You have no projects yet.' />;
        }

        if (!activeExperiment) {
          return (
            <center>
              <Loader />
            </center>
          );
        }

        return (
          <ProjectDetails
            width={width}
            height={height}
          />
        );
      },
    },
  };

  const windows = {
    direction: 'row',
    first: PROJECTS_LIST,
    second: PROJECT_DETAILS,
    splitPercentage: 23,
  };

  return (
    <>
      <Header title='Data Management' />
      <Alert
        showIcon
        message={(
          <>
            <div>
              <p><b>Dear academic community,</b></p>
              <p>
                We believe that knowledge should be freely accessible to all, which is why we provide our services to academics free of charge.
                However, maintaining and improving our services requires ongoing resources and funding.
              </p>
              <p>
                If you find our services valuable, we kindly ask for your support in the form of a donation.
                Every contribution, big or small, helps us continue to provide free access to our services and expand our offerings to better serve the academic community.
              </p>
              <p>
                You can donate here -
                <a href='https://www.paypal.com/donate/?hosted_button_id=KJ8K3G8RXNGZA'>https://www.paypal.com/donate/?hosted_button_id=KJ8K3G8RXNGZA</a>
              </p>
              <p>Thank you for your support and for helping us make knowledge accessible to all.</p>
            </div>
          </>
        )}
        banner
        closable
      />
      {newProjectModalVisible ? (
        <NewProjectModal
          onCancel={() => { setNewProjectModalVisible(false); }}
          onCreate={() => { setNewProjectModalVisible(false); }}
        />
      ) : (<></>)}
      <MultiTileContainer
        tileMap={TILE_MAP}
        initialArrangement={windows}
      />
    </>
  );
};

export default DataManagementPage;
