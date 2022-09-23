/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  BuildOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  FundViewOutlined,
} from '@ant-design/icons';
import {
  Layout,
  Menu,
  Space,
  Tooltip,
  Typography,
} from 'antd';
import { modules } from 'utils/constants';

import { useAppRouter } from 'utils/AppRouteProvider';

import calculatePipelineRerunStatus from 'utils/data-management/calculatePipelineRerunStatus';
import PipelineLoadingScreen from 'components/PipelineLoadingScreen';
import PipelineRedirectToDataProcessing from 'components/PipelineRedirectToDataProcessing';
import PreloadContent from 'components/PreloadContent';

import experimentUpdatesHandler from 'utils/experimentUpdatesHandler';
import { getBackendStatus } from 'redux/selectors';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { isBrowser, privacyPolicyIsNotAccepted } from 'utils/deploymentInfo';

import Error from 'pages/_error';

import integrationTestConstants from 'utils/integrationTestConstants';
import pipelineStatusValues from 'utils/pipelineStatusValues';
import BrowserAlert from 'components/BrowserAlert';
import { loadUser } from 'redux/actions/user';
import PrivacyPolicyIntercept from './data-management/PrivacyPolicyIntercept';

const { Sider } = Layout;
const { Text } = Typography;

const checkEveryIsValue = (arr, value) => arr.every((item) => item === value);

const ContentWrapper = (props) => {
  const dispatch = useDispatch();

  const [collapsed, setCollapsed] = useState(false);

  const { routeExperimentId, experimentData, children } = props;
  const { navigateTo, currentModule } = useAppRouter();

  const currentExperimentIdRef = useRef(routeExperimentId);
  const activeExperimentId = useSelector((state) => state?.experiments?.meta?.activeExperimentId);
  const activeExperiment = useSelector((state) => state.experiments[activeExperimentId]);

  const domainName = useSelector((state) => state.networkResources.domainName);
  const user = useSelector((state) => state.user.current);

  const samples = useSelector((state) => state.samples);

  useEffect(() => {
    if (!activeExperimentId && !routeExperimentId) return;

    if (currentModule === modules.DATA_MANAGEMENT) {
      currentExperimentIdRef.current = activeExperimentId;
      return;
    }

    if (currentExperimentIdRef.current === routeExperimentId) return;

    currentExperimentIdRef.current = routeExperimentId;
  }, [currentModule, activeExperimentId, routeExperimentId]);

  const currentExperimentId = currentExperimentIdRef.current;
  const experiment = useSelector((state) => state?.experiments[currentExperimentId]);

  const experimentName = experimentData?.experimentName || experiment?.name;

  const {
    loading: backendLoading,
    error: backendError,
    status: backendStatus,
  } = useSelector(getBackendStatus(currentExperimentId));
  const gem2sBackendStatus = backendStatus?.gem2s;
  const backendErrors = [pipelineStatusValues.FAILED, pipelineStatusValues.TIMED_OUT, pipelineStatusValues.ABORTED];

  const pipelineStatusKey = backendStatus?.pipeline?.status;
  const pipelineRunning = pipelineStatusKey === 'RUNNING';
  const pipelineRunningError = backendErrors.includes(pipelineStatusKey);

  const gem2sStatusKey = backendStatus?.gem2s?.status;
  const gem2sparamsHash = backendStatus?.gem2s?.paramsHash;
  const gem2sRunning = gem2sStatusKey === 'RUNNING';
  const gem2sRunningError = backendErrors.includes(gem2sStatusKey);
  const completedGem2sSteps = backendStatus?.gem2s?.completedSteps;

  const seuratStatusKey = backendStatus?.seurat?.status;
  const seuratRunning = seuratStatusKey === 'RUNNING';
  const completedSeuratSteps = backendStatus?.seurat?.completedSteps;
  const seuratComplete = seuratStatusKey === pipelineStatusValues.SUCCEEDED;
  const isSeurat = (seuratStatusKey && seuratStatusKey !== pipelineStatusValues.NOT_CREATED) || false;

  // This is used to prevent a race condition where the page would start loading immediately
  // when the backend status was previously loaded. In that case, `backendLoading` is `false`
  // and would be set to true only in the `loadBackendStatus` action, the time between the
  // two events would allow pages to load.
  const [backendStatusRequested, setBackendStatusRequested] = useState(false);

  useEffect(() => {
    if (!currentExperimentId) return;
    if (!backendLoading) dispatch(loadBackendStatus(currentExperimentId));

    if (isBrowser) {
      import('utils/socketConnection')
        .then(({ default: connectionPromise }) => connectionPromise)
        .then((io) => {
          const cb = experimentUpdatesHandler(dispatch);

          // Unload all previous socket.io hooks that may have been created for a different
          // experiment.
          io.off();

          io.on(`ExperimentUpdates-${currentExperimentId}`, (update) => cb(currentExperimentId, update));
        });
    }
  }, [routeExperimentId]);

  useEffect(() => {
    if (backendStatusRequested) {
      return;
    }

    setBackendStatusRequested(true);
  }, [backendLoading]);

  const [gem2sRerunStatus, setGem2sRerunStatus] = useState(null);

  useEffect(() => {
    if (!activeExperiment) return;

    const pipelineStatus = calculatePipelineRerunStatus(
      gem2sBackendStatus, activeExperiment, samples, experiment,
    );

    setGem2sRerunStatus(pipelineStatus);
  }, [gem2sBackendStatus, activeExperiment, samples, experiment]);

  useEffect(() => {
    dispatch(loadUser());
  }, []);

  if (!user) return <></>;

  const BigLogo = () => (
    <div
      style={{
        background: 'linear-gradient(315deg, #5B070A 0%, #8f0b10 30%, #A80D12 100%)',
        paddingLeft: '32px',
        paddingTop: '15px',
        paddingBottom: '15px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width={110} height={30}>
        <defs id='svg_document_defs'>
          <style id='IBM Plex Sans_Google_Webfont_import'>@import url(https://fonts.googleapis.com/css?family=IBM+Plex+Sans);</style>
        </defs>
        <g>
          <text
            style={{ outlineStyle: 'none' }}
            x='1px'
            fontWeight='500'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            y='25px'
            fill='#F0F2F5'
            fontSize='25.00px'
            textAnchor='start'
          >
            Cellenics
          </text>
          <text
            stroke='none'
            style={{ outlineStyle: 'none' }}
            strokeWidth='1px'
            x='3px'
            fontWeight='200'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            fill='#aab6c1'
            fontSize='12.80px'
            textAnchor='start'
          />
        </g>
      </svg>
    </div>
  );

  const SmallLogo = () => (
    <div
      style={{
        background: 'linear-gradient(315deg, #5B070A 0%, #8f0b10 30%, #A80D12 100%)',
        paddingTop: '8px',
        paddingBottom: '8px',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <svg xmlns='http://www.w3.org/2000/svg' width={100} height={30}>
        <defs id='svg_document_defs'>
          <style id='IBM Plex Sans_Google_Webfont_import'>@import url(https://fonts.googleapis.com/css?family=IBM+Plex+Sans);</style>
        </defs>
        <g>
          <text
            style={{ outlineStyle: 'none' }}
            x='40px'
            fontWeight='500'
            textRendering='geometricPrecision'
            fontFamily='IBM Plex Sans'
            y='24px'
            fill='#F0F2F5'
            fontSize='25.00px'
            textAnchor='middle'
          >
            Cs
          </text>
        </g>
      </svg>
    </div>
  );

  const menuLinks = [
    {
      module: modules.DATA_MANAGEMENT,
      icon: <FolderOpenOutlined />,
      name: 'Data Management',
      disableIfNoExperiment: false,
      disabledByPipelineStatus: true,
      disabledIfSeurat: false,
    },
    {
      module: modules.DATA_PROCESSING,
      icon: <BuildOutlined />,
      name: 'Data Processing',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: false,
      disabledIfSeurat: true,
    },
    {
      module: modules.DATA_EXPLORATION,
      icon: <FundViewOutlined />,
      name: 'Data Exploration',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
      disabledIfSeurat: false,
    },
    {
      module: modules.PLOTS_AND_TABLES,
      icon: <DatabaseOutlined />,
      name: 'Plots and Tables',
      disableIfNoExperiment: true,
      disabledByPipelineStatus: true,
      disabledIfSeurat: false,
    },
  ];

  const waitingForQcToLaunch = gem2sStatusKey === pipelineStatusValues.SUCCEEDED
    && pipelineStatusKey === pipelineStatusValues.NOT_CREATED;

  const renderContent = () => {
    if (routeExperimentId) {
      if (
        backendLoading || !backendStatusRequested) {
        return <PreloadContent />;
      }

      if (backendError) {
        return <Error errorText={backendError} />;
      }

      if (gem2sRunningError) {
        return <PipelineLoadingScreen paramsHash={gem2sparamsHash} experimentId={routeExperimentId} pipelineStatus='error' />;
      }

      if (seuratComplete && currentModule === modules.DATA_PROCESSING) {
        navigateTo(modules.DATA_EXPLORATION, { experimentId: routeExperimentId });
        return children;
      }

      if (gem2sRunning || waitingForQcToLaunch) {
        return <PipelineLoadingScreen experimentId={routeExperimentId} pipelineStatus='running' completedSteps={completedGem2sSteps} pipelineType='gem2s' />;
      }

      if (seuratRunning) {
        return <PipelineLoadingScreen experimentId={routeExperimentId} pipelineStatus='running' completedSteps={completedSeuratSteps} pipelineType='seurat' />;
      }

      if (checkEveryIsValue([gem2sStatusKey, seuratStatusKey], pipelineStatusValues.NOT_CREATED)) {
        return <PipelineLoadingScreen experimentId={routeExperimentId} pipelineStatus='toBeRun' />;
      }

      if (pipelineRunningError && currentModule !== modules.DATA_PROCESSING) {
        return <PipelineRedirectToDataProcessing experimentId={routeExperimentId} pipelineStatus='error' />;
      }

      if (pipelineRunning && currentModule !== modules.DATA_PROCESSING) {
        return <PipelineRedirectToDataProcessing experimentId={routeExperimentId} pipelineStatus='running' />;
      }

      if (process.env.NODE_ENV === 'development') {
        return children;
      }

      if (pipelineStatusKey === pipelineStatusValues.NOT_CREATED && currentModule !== modules.DATA_PROCESSING) {
        return <PipelineRedirectToDataProcessing experimentId={routeExperimentId} pipelineStatus='toBeRun' />;
      }
    }

    return children;
  };

  const menuItemRender = ({
    module, icon, name, disableIfNoExperiment, disabledByPipelineStatus, disabledIfSeurat,
  }) => {
    const notProcessedExperimentDisable = !routeExperimentId && disableIfNoExperiment
      && (!gem2sRerunStatus || gem2sRerunStatus.rerun);

    const pipelineStatusDisable = disabledByPipelineStatus && (
      backendError || gem2sRunning || gem2sRunningError
      || waitingForQcToLaunch || pipelineRunning || pipelineRunningError
    );

    return (
      <Menu.Item
        id={module}
        disabled={notProcessedExperimentDisable || pipelineStatusDisable || (isSeurat && disabledIfSeurat)}
        key={module}
        icon={icon}
        onClick={() => navigateTo(
          module,
          { experimentId: currentExperimentId },
        )}
      >
        {name}
      </Menu.Item>
    );
  };

  if (!user) return <></>;

  return (
    <>
      {privacyPolicyIsNotAccepted(user, domainName) && (
        <PrivacyPolicyIntercept user={user} onOk={() => dispatch(loadUser())} />
      )}
      <BrowserAlert />
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          style={{
            overflow: 'auto', height: '100vh', position: 'fixed', left: 0,
          }}
          width={210}
          theme='dark'
          mode='inline'
          collapsible
          collapsed={collapsed}
          onCollapse={(collapse) => setCollapsed(collapse)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {collapsed ? <SmallLogo /> : <BigLogo />}
            <Menu
              data-test-id={integrationTestConstants.ids.NAVIGATION_MENU}
              theme='dark'
              selectedKeys={
                menuLinks
                  .filter(({ module }) => module === currentModule)
                  .map(({ module }) => module)
              }
              mode='inline'
            >
              {menuLinks.filter((item) => !item.disableIfNoExperiment).map(menuItemRender)}

              <Menu.ItemGroup
                title={!collapsed && (
                  <Tooltip title={experimentName} placement='right'>
                    <Space direction='vertical' style={{ width: '100%', cursor: 'default' }}>
                      <Text
                        style={{
                          width: '100%',
                          color: '#999999',
                        }}
                        strong
                        ellipsis
                      >
                        {experimentName || 'No analysis'}
                      </Text>
                      {experimentName && (
                        <Text style={{ color: '#999999' }}>
                          Current analysis
                        </Text>
                      )}
                    </Space>
                  </Tooltip>

                )}
              >
                {menuLinks.filter((item) => item.disableIfNoExperiment).map(menuItemRender)}
              </Menu.ItemGroup>

            </Menu>
          </div>
        </Sider>
        <Layout
          style={!collapsed ? { marginLeft: '210px' } : { marginLeft: '80px' }} // this is the collapsed width for our sider
        >
          {renderContent()}
        </Layout>
      </Layout>
    </>
  );
};

ContentWrapper.propTypes = {
  routeExperimentId: PropTypes.string,
  experimentData: PropTypes.object,
  children: PropTypes.node,
};

ContentWrapper.defaultProps = {
  routeExperimentId: null,
  experimentData: null,
  children: null,
};

export default ContentWrapper;
