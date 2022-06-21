import moment from 'moment';
import getAuthJWT from 'utils/getAuthJWT';
import WorkTimeoutError from 'utils/http/errors/WorkTimeoutError';
import fetchAPI from 'utils/http/fetchAPI';
import unpackResult from 'utils/work/unpackResult';
import WorkResponseError from 'utils/http/errors/WorkResponseError';
import httpStatusCodes from 'utils/http/httpStatusCodes';
import config from 'config';
import { api } from 'utils/constants';

const throwResponseError = (response) => {
  throw new Error(`Error ${response.status}: ${response.text}`, { cause: response });
};

// getRemainingWorkerStartTime returns how many more seconds the worker is expected to
// need to be running with an extra 1 minute for a bit of leeway
const getRemainingWorkerStartTime = (creationTimestamp) => {
  const now = new Date();
  const creationTime = new Date(creationTimestamp);
  const elapsed = parseInt((now - creationTime) / (1000), 10); // gives second difference

  // we assume a worker takes up to 5 minutes to start
  const totalStartup = 5 * 60;
  const remainingTime = totalStartup - elapsed;
  // add an extra minute just in case
  return remainingTime + 60;
};

const seekFromS3 = async (ETag, experimentId) => {
  let response;
  try {
    let url;
    if (config.currentApiVersion === api.V2) {
      url = `/v2/workResults/${experimentId}/${ETag}`;
    } else {
      url = `/v1/workResults/${experimentId}/${ETag}`;
    }
    response = await fetchAPI(url);
  } catch (e) {
    if (e.statusCode === httpStatusCodes.NOT_FOUND) {
      return null;
    }

    throw e;
  }

  const { signedUrl } = response;
  const storageResp = await fetch(signedUrl);

  if (!storageResp.ok) {
    throwResponseError(storageResp);
  }

  return unpackResult(storageResp);
};

const dispatchWorkRequest = async (
  experimentId,
  body,
  timeout,
  ETag,
  requestProps,
) => {
  console.error('dispatching work request', body);
  const { default: connectionPromise } = await import('utils/socketConnection');
  const io = await connectionPromise;

  const timeoutDate = moment().add(timeout, 's').toISOString();
  const authJWT = await getAuthJWT();

  const request = {
    ETag,
    socketId: io.id,
    experimentId,
    ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    timeout: timeoutDate,
    body,
    ...requestProps,
  };

  const timeoutPromise = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new WorkTimeoutError(timeoutDate, request));
    }, timeout * 1000);

    io.on(`WorkerInfo-${experimentId}`, (res) => {
      const { response: { podInfo: { name, creationTimestamp, phase } } } = res;

      const extraTime = getRemainingWorkerStartTime(creationTimestamp);
      if (phase === 'Pending' && extraTime > 0) {
        console.log(`worker ${name} started at ${creationTimestamp}. Adding ${extraTime} seconds to timeout.`);
        clearTimeout(id);
        setTimeout(() => {
          reject(new WorkTimeoutError(timeoutDate, request));
        }, (timeout + extraTime) * 1000);
      }
    });
  });

  const responsePromise = new Promise((resolve, reject) => {
    io.on(`WorkResponse-${ETag}`, (res) => {
      const { response } = res;

      if (response.error) {
        const { errorCode, userMessage } = response;
        console.error(errorCode, userMessage);

        return reject(
          new WorkResponseError(errorCode, userMessage, request),
        );
      }

      // If no error, the response should be ready on S3.
      // In this case, return true
      return resolve();
    });
  });

  const result = Promise.race([timeoutPromise, responsePromise]);

  if (config.currentApiVersion === api.V2) {
    io.emit('WorkRequest-v2', request);
  } else {
    io.emit('WorkRequest', request);
  }
  return result;
};

export { dispatchWorkRequest, seekFromS3 };
