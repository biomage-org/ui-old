import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';
import axios from 'axios';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';
import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import UploadStatus from 'utils/upload/UploadStatus';
import { waitFor } from '@testing-library/dom';

import processUpload from 'utils/upload/processUpload';

import validate from 'utils/upload/validate10x';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { sampleTech } from 'utils/constants';
import mockFile from '__test__/test-utils/mockFile';

enableFetchMocks();

const getValidFiles = (cellrangerVersion, compressed = true) => {
  const filename = cellrangerVersion === 'v2' ? 'genes.tsv.gz' : 'features.tsv.gz';

  let fileList = [
    {
      name: `WT13/${filename}`,
      fileObject: mockFile(filename, '/'),
      upload: { status: UploadStatus.UPLOADING },
      errors: '',
      compressed,
      valid: true,
    },
    {
      name: 'WT13/barcodes.tsv.gz',
      fileObject: mockFile('barcodes.tsv.gz', '/'),
      upload: { status: UploadStatus.UPLOADING },
      errors: '',
      compressed,
      valid: true,
    },
    {
      name: 'WT13/matrix.mtx.gz',
      fileObject: mockFile('matrix.mtx.gz', '/'),
      upload: { status: UploadStatus.UPLOADING },
      errors: '',
      compressed,
      valid: true,
    },
  ];

  fileList = fileList.map((file) => ({ ...file, size: file.fileObject.size }));
  return fileList;
};

const sampleType = sampleTech['10X'];
const mockSampleUuid = 'sample-uuid';
const mockExperimentId = 'project-uuid';
const sampleName = 'mockSampleName';

const mockUnrelatedSampleUuid = 'unrelated-sample-uuid';
const mockUnrelatedExperimentId = 'unrelated-experiment-id';

const initialState = {
  experiments: {
    ...initialExperimentState,
    [mockExperimentId]: {
      ...experimentTemplate,
      id: mockExperimentId,
      sampleIds: [mockSampleUuid],
    },
  },
  samples: {
    ...initialSampleState,
    ids: [mockSampleUuid],
    meta: {
      loading: true,
      error: false,
    },
    [mockSampleUuid]: {
      ...sampleTemplate,
      uuid: mockSampleUuid,
      name: sampleName,
      experimentId: mockExperimentId,
    },
    [mockUnrelatedSampleUuid]: {
      ...sampleTemplate,
      uuid: mockUnrelatedSampleUuid,
      name: sampleName,
      experimentId: mockUnrelatedExperimentId,
    },
  },
};
// Based on https://stackoverflow.com/a/51045733
const flushPromises = () => new Promise(setImmediate);
const mockStore = configureMockStore([thunk]);

jest.mock('utils/upload/loadAndCompressIfNecessary',
  () => jest.fn().mockImplementation(
    (file) => {
      if (!file.valid) {
        return Promise.reject(new Error('error'));
      }
      return Promise.resolve('loadedGzippedFile');
    },
  ));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'sample-uuid'),
}));

jest.mock('axios', () => ({
  request: jest.fn(),
}));

jest.mock('utils/pushNotificationMessage');

jest.mock('utils/upload/validate10x');

let store = null;

describe('processUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockUploadUrlParams = {
      signedUrls: ['theSignedUrl'],
      uploadId: 'some_id',
    };

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify(mockUploadUrlParams), { status: 200 });

    store = mockStore(initialState);
  });

  it('Uploads and updates redux correctly when there are no errors with cellranger v3', async () => {
    const mockAxiosCalls = [];
    const uploadSuccess = (params) => {
      mockAxiosCalls.push(params);
      return Promise.resolve({ headers: { etag: 'etag-blah' } });
    };

    axios.request.mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess);

    const filesList = getValidFiles('v3');

    await processUpload(
      filesList,
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADED } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    // Three axios put calls are made
    expect(mockAxiosCalls.length).toBe(3);
    // Each put call is made with the correct information
    expect(mockAxiosCalls[0].data).toBeInstanceOf(Blob);
    expect(mockAxiosCalls[1].data).toBeInstanceOf(Blob);
    expect(mockAxiosCalls[2].data).toBeInstanceOf(Blob);

    // Wait until all put promises are resolved
    await flushPromises();

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );
    const uploadProperties = fileUpdateActions.map((action) => action.payload.fileDiff.upload);
    const uploadingStatusProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADING,
    );
    const uploadedStatusProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADED,
    );

    // There are 3 files actions with status uploading
    expect(uploadingStatusProperties.length).toEqual(3);
    // There are 3 files actions with status uploaded
    expect(uploadedStatusProperties.length).toEqual(3);

    // axios request calls are correct
    expect(axios.request.mock.calls.map((call) => call[0])).toMatchSnapshot();

    // If we trigger axios onUploadProgress it updates the progress correctly
    axios.request.mock.calls[0][0].onUploadProgress({ loaded: filesList[0].fileObject.size / 2 });

    await waitForActions(
      store,
      [{
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADING, progress: 50 } } },
      }],
      { matcher: waitForActions.matchers.containing },
    );
  });

  it('Uploads and updates redux correctly when there are no errors with cellranger v2', async () => {
    const mockAxiosCalls = [];
    const uploadSuccess = (params) => {
      mockAxiosCalls.push(params);
      return Promise.resolve({ headers: { etag: 'etag-blah' } });
    };

    axios.request.mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess);

    const filesList = getValidFiles('v2');

    await processUpload(
      filesList,
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADED } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    // Three axios put calls are made
    expect(mockAxiosCalls.length).toBe(3);
    // Each put call is made with the correct information
    expect(mockAxiosCalls[0].data).toBeInstanceOf(Blob);
    expect(mockAxiosCalls[1].data).toBeInstanceOf(Blob);
    expect(mockAxiosCalls[2].data).toBeInstanceOf(Blob);

    // Wait until all put promises are resolved
    await flushPromises();

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );
    const uploadProperties = fileUpdateActions.map((action) => action.payload.fileDiff.upload);
    const uploadingStatusProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADING,
    );
    const uploadedStatusProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADED,
    );

    // There are 3 files actions with status uploading
    expect(uploadingStatusProperties.length).toEqual(3);
    // There are 3 files actions with status uploaded
    expect(uploadedStatusProperties.length).toEqual(3);

    // axios request calls are correct
    expect(axios.request.mock.calls.map((call) => call[0])).toMatchSnapshot();

    // If we trigger axios onUploadProgress it updates the progress correctly
    axios.request.mock.calls[0][0].onUploadProgress({ loaded: filesList[0].fileObject.size / 2 });

    await waitForActions(
      store,
      [{
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADING, progress: 50 } } },
      }],
      { matcher: waitForActions.matchers.containing },
    );
  });

  it('Updates redux correctly when there are file upload errors', async () => {
    const mockAxiosCalls = [];

    const uploadError = (params) => {
      mockAxiosCalls.push(params);
      return Promise.reject(new Error('Error'));
    };

    axios.request.mockImplementationOnce(uploadError)
      .mockImplementationOnce(uploadError)
      .mockImplementationOnce(uploadError);

    await processUpload(
      getValidFiles('v3'),
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOAD_ERROR } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );

    const uploadProperties = fileUpdateActions.map((action) => action.payload.fileDiff.upload);

    const uploadingFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADING,
    );

    const errorFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOAD_ERROR,
    );

    const uploadedFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADED,
    );

    // There are 3 files actions with status uploading
    expect(uploadingFileProperties.length).toEqual(3);
    // There are 3 files actions with status upload error
    expect(errorFileProperties.length).toEqual(3);
    // There are no file actions with status successfully uploaded
    expect(uploadedFileProperties.length).toEqual(0);
  });

  it('Should not upload files if there are errors creating samples in the api', async () => {
    fetchMock.mockReject(new Error('Error'));

    await processUpload(
      getValidFiles('v3'),
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // We do not expect uploads to happen
    await waitFor(() => {
      expect(axios.request).not.toHaveBeenCalled();
    });
  });

  it('Should not upload sample and show notification if uploaded sample is invalid', async () => {
    validate.mockImplementationOnce(
      () => { throw new Error('Some file error'); },
    );

    await processUpload(
      getValidFiles('v2'),
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // We do not expect uploads to happen
    await waitFor(() => {
      expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
      expect(axios.request).not.toHaveBeenCalled();
    });
  });
});
