/*   ___                 /
 *     _-_-  _/\____    / __\\__
 *  _-_-__  / ,-. -|   /  -  ,-.`-.
 *     _-_- `( o )--  /  --( o )-'
 *            `-'    /      `-'
 * tunel (n): RESTful message tunneling over IPC.
 */

/**
 * This is the server part, and it typically lives on a node-like
 * environment (for, i.e., electron main thread),
 */

const TOPIC = '__TUNEL_REQUEST__';

const routes = [];

const pathToRegexp = require('path-to-regexp');

const addRoute = routeInstance => {
  routes.push(routeInstance);
};

const resolveRoute = ({ path, method }) => {
  const matchingRoutes = routes.reduce((acc, route) => {
    if (!route) {
      return acc;
    }

    if (!route.path) {
      return acc;
    }

    const keys = [];

    const pathMatches = pathToRegexp(route.path, keys).test(path);

    if (!pathMatches) {
      return acc;
    }

    const methodMatches =
      (method && typeof method === 'string' ? method : 'get').toLowerCase() ===
      (route.method && typeof route.method === 'string'
        ? route.method
        : 'get'
      ).toLowerCase();

    if (!methodMatches) {
      return acc;
    }

    acc.push({ route, keys });

    return acc;
  }, []);

  if (!matchingRoutes.length) {
    return null;
  }

  const handler = matchingRoutes[0].route.handler;

  if (!handler) {
    return { handler: null, keys: null };
  }

  const keys = matchingRoutes[0].keys;

  return { handler, keys };
};

const tryParseJson = data => {
  if (typeof data !== 'string') {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (ignore) {
    void ignore;
    return data;
  }
};

const registerChannel = channel => {
  channel.on(TOPIC, async (evt, data) => {
    const { handler, keys } = resolveRoute({
      path: data.path,
      method: data.method
    });

    if (!handler) {
      return;
    }

    if (!data.correlationId) {
      return;
    }

    try {
      const result = {
        correlationId: data.correlationId,
        data: tryParseJson((await handler(data, keys)) || {})
      };

      evt.sender.send(TOPIC, result);
    } catch (ex) {
      evt.sender.send(TOPIC, { status: 500, error: ex });
    }
  });
};

module.exports = {
  registerChannel,
  addRoute
};
