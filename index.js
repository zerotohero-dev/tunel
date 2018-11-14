/*   ___                 /
 *     _-_-  _/\____    / __\\__
 *  _-_-__  / ,-. -|   /  -  ,-.`-.
 *     _-_- `( o )--  /  --( o )-'
 *            `-'    /      `-'
 * tunel (n): RESTful message tunneling over IPC.
 */

const uuid = require('uuid/v4');

const { TOPIC } = require('./constants');

const resolvers = new Map();

let tunelChannel = null;

const registerChannel = channel => {
  tunelChannel = channel;

  channel.on(TOPIC, (sender, result) => {
    void sender;

    const status = result.status || 200;

    const { correlationId } = result;

    if (!correlationId) {
      return;
    }

    const resolver = resolvers.get(correlationId);

    if (!resolver) {
      return;
    }

    const { resolve, reject } = resolver;

    if (!resolve || !reject) {
      return;
    }

    resolvers.delete(result.correlationId);

    if (status === 200) {
      resolve({ status, data: result.data });

      return;
    }

    reject(Object.assign({ status: 500 }, result));
  });
};

const tunnel = ({ method, url, data, headers }) => {
  const path = url;

  if (!tunelChannel) {
    return Promise.reject({
      success: false,
      reason: 'Register a channel first!'
    });
  }

  return new Promise((resolve, reject) => {
    const correlationId = uuid();

    resolvers.set(correlationId, { resolve, reject });

    tunelChannel.send(TOPIC, { correlationId, method, path, data, headers });
  });
};

exports.registerChannel = registerChannel;
exports.default = tunnel;
