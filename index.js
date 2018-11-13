/*   ___                 /
 *     _-_-  _/\____    / __\\__
 *  _-_-__  / ,-. -|   /  -  ,-.`-.
 *     _-_- `( o )--  /  --( o )-'
 *            `-'    /      `-'
 * tunel (n): RESTful message tunneling over IPC.
 */

const resolvers = new Map();
const TOPIC = '__TUNEL_REQUEST__';

const uuid = require('uuid/v4');

let ipcChannel = null;

const registerChannel = channel => {
  ipcChannel = channel;

  channel.on(TOPIC, (sender, result) => {
    void sender;

    const status = result.status || 200;

    const { correlationId } = result;

    if (!correlationId) {
      return;
    }

    const { resolve, reject } = resolvers.get(correlationId);

    if (!resolve || !reject) {
      return;
    }

    resolvers.delete(result.correlationId);

    if (status === 200) {
      resolve({ status, data: result.data });

      return;
    }

    reject(result);
  });
};

const tunnel = ({ method, url, data, headers }) => {
  const path = url;

  if (!ipcChannel) {
    return Promise.reject({
      success: false,
      reason: 'Register an IPC channel first!'
    });
  }

  return new Promise((resolve, reject) => {
    const correlationId = uuid();
    resolvers.set(correlationId, { resolve, reject });
    ipcChannel.send(TOPIC, { correlationId, method, path, data, headers });
  });
};

export { registerChannel };

export default tunnel;
