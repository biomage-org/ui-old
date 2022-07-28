import validate from 'utils/upload/sampleValidator';
import initialState, { sampleFileTemplate, sampleTemplate } from 'redux/reducers/samples/initialState';

import * as fs from 'fs';

const _ = require('lodash');

// A function which returns an object to emulate the Blob class
// Required because NodeJS's implementation of Blob modifies the
// data, causing it to be irreproducible in the test
const makeBlob = (data) => ({
  data,
  size: data.length,
  slice(start, end) { return makeBlob(data.slice(start, end)); },
  arrayBuffer() { return new Promise((resolve) => resolve(data.buffer)); },
});

const mockFileLocations = {
  unziped: {
    'barcodes.tsv': 'src/__test__/data/mock_files/barcodes.tsv',
    'features.tsv': 'src/__test__/data/mock_files/features.tsv',
    'matrix.mtx': 'src/__test__/data/mock_files/matrix.mtx',
    'invalid_barcodes.tsv': 'src/__test__/data/mock_files/invalid_barcodes.tsv',
    'invalid_features.tsv': 'src/__test__/data/mock_files/invalid_features.tsv',
    'transposed_matrix.mtx': 'src/__test__/data/mock_files/transposed_matrix.mtx',
  },
  zipped: {
    'barcodes.tsv.gz': 'src/__test__/data/mock_files/barcodes.tsv.gz',
    'features.tsv.gz': 'src/__test__/data/mock_files/features.tsv.gz',
    'matrix.mtx.gz': 'src/__test__/data/mock_files/matrix.mtx.gz',
    'invalid_barcodes.tsv.gz': 'src/__test__/data/mock_files/invalid_barcodes.tsv.gz',
    'invalid_features.tsv.gz': 'src/__test__/data/mock_files/invalid_features.tsv.gz',
    'transposed_matrix.mtx.gz': 'src/__test__/data/mock_files/transposed_matrix.mtx.gz',
  },
};

// Manually resolve fflate import for Jest the module definition for fflate
// because it does not correctly resolve to the intended module
jest.mock('fflate', () => {
  const realModule = jest.requireActual('../../../../node_modules/fflate/umd/index.js');

  return {
    _esModule: true,
    ...realModule,
  };
});

const prepareMockFiles = (fileLocations) => {
  const errors = {};

  // Read and prepare each file object
  Object.entries(fileLocations).forEach(([filename, location]) => {
    const fileUint8Arr = new Uint8Array(fs.readFileSync(location));
    errors[filename] = makeBlob(fileUint8Arr);
  });

  return errors;
};

const mockUnzippedFileObjects = prepareMockFiles(mockFileLocations.unziped);
const mockZippedFileObjects = prepareMockFiles(mockFileLocations.zipped);

jest.mock('utils/upload/readFileToBuffer');

const mockZippedSample = {
  ...sampleTemplate,
  ...initialState,
  name: 'mockZippedSample',
  fileNames: [
    'features.tsv.gz',
    'barcodes.tsv.gz',
    'matrix.mtx.gz',
  ],
  files: {
    'features.tsv.gz': {
      ...sampleFileTemplate,
      name: 'features.tsv.gz',
      fileObject: mockZippedFileObjects['features.tsv.gz'],
      size: mockZippedFileObjects['features.tsv.gz'].size,
      path: '/transposed/features.tsv.gz',
      compressed: true,
    },
    'barcodes.tsv.gz': {
      ...sampleFileTemplate,
      name: 'barcodes.tsv.gz',
      fileObject: mockZippedFileObjects['barcodes.tsv.gz'],
      size: mockZippedFileObjects['barcodes.tsv.gz'].size,
      path: '/transposed/barcodes.tsv.gz',
      compressed: true,
    },
    'matrix.mtx.gz': {
      ...sampleFileTemplate,
      name: 'matrix.mtx.gz',
      fileObject: mockZippedFileObjects['matrix.mtx.gz'],
      size: mockZippedFileObjects['matrix.mtx.gz'].size,
      path: '/transposed/matrix.mtx.gz',
      compressed: true,
    },
  },
};

const mockUnzippedSample = {
  ...sampleTemplate,
  ...initialState,
  name: 'mockUnzippedSample',
  fileNames: [
    'features.tsv',
    'barcodes.tsv',
    'matrix.mtx',
  ],
  files: {
    'features.tsv': {
      ...sampleFileTemplate,
      name: 'features.tsv',
      fileObject: mockUnzippedFileObjects['features.tsv'],
      size: mockUnzippedFileObjects['features.tsv'].size,
      path: '/transposed/features.tsv',
      compressed: false,
    },
    'barcodes.tsv': {
      ...sampleFileTemplate,
      name: 'barcodes.tsv',
      fileObject: mockUnzippedFileObjects['barcodes.tsv'],
      size: mockUnzippedFileObjects['barcodes.tsv'].size,
      path: '/transposed/barcodes.tsv',
      compressed: false,
    },
    'matrix.mtx': {
      ...sampleFileTemplate,
      name: 'matrix.mtx',
      fileObject: mockUnzippedFileObjects['matrix.mtx'],
      size: mockUnzippedFileObjects['matrix.mtx'].size,
      path: '/transposed/matrix.mtx',
      compressed: false,
    },
  },
};

describe('sampleValidator', () => {
  it('Correctly pass valid zipped samples', async () => {
    const errors = await validate(mockZippedSample);
    expect(errors).toEqual([]);
  });

  it('Correctly pass valid unzipped samples', async () => {
    const errors = await validate(mockUnzippedSample);
    expect(errors).toEqual([]);
  });

  it('Correctly identifies invalid barcodes file', async () => {
    const mockInvalidBarcodesFile = _.cloneDeep(mockZippedSample);
    mockInvalidBarcodesFile.files['barcodes.tsv.gz'].fileObject = mockZippedFileObjects['invalid_barcodes.tsv.gz'];
    mockInvalidBarcodesFile.files['barcodes.tsv.gz'].size = mockZippedFileObjects['invalid_barcodes.tsv.gz'].size;

    const errors = await validate(mockInvalidBarcodesFile);

    expect(errors.length).toEqual(1);
    expect(errors).toMatchSnapshot();
  });

  it('Correctly identifies invalid features file', async () => {
    const mockInvalidFeaturesFile = _.cloneDeep(mockZippedSample);
    mockInvalidFeaturesFile.files['features.tsv.gz'].fileObject = mockZippedFileObjects['invalid_features.tsv.gz'];
    mockInvalidFeaturesFile.files['features.tsv.gz'].size = mockZippedFileObjects['invalid_features.tsv.gz'].size;

    const errors = await validate(mockInvalidFeaturesFile);

    expect(errors.length).toEqual(1);
    expect(errors).toMatchSnapshot();
  });

  it('Correctly identifies transposed matrix file', async () => {
    const mockTransposedFile = _.cloneDeep(mockZippedSample);
    mockTransposedFile.files['matrix.mtx.gz'].fileObject = mockZippedFileObjects['transposed_matrix.mtx.gz'];
    mockTransposedFile.files['matrix.mtx.gz'].size = mockZippedFileObjects['transposed_matrix.mtx.gz'].size;

    const errors = await validate(mockTransposedFile);

    expect(errors.length).toEqual(3);
    expect(errors).toMatchSnapshot();
  });
});
