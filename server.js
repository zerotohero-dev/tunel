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

const pathToRegexp = require('path-to-regexp');

const { TOPIC } = require('./constants');

const routes = [];

const addRoute = routeInstance => {
  const clonedRoute = Object.assign({}, routeInstance);

  routes.push(clonedRoute);
};

// TODO: Needs to be configurable!
const DEBUG = true;
const log = DEBUG ? (...stuff) => console.log(...stuff) : () => {};

const resolveRoute = ({ path, method }) => {
  const matchingRoutes = routes.reduce((acc, route) => {
    if (!route) {
      return acc;
    }

    if (!route.path) {
      return acc;
    }

    const pathMatches = pathToRegexp(route.path).test(path);

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

    acc.push(route);

    return acc;
  }, []);

  if (!matchingRoutes.length) {
    return null;
  }

  // TODO: When multiple matches, favor the match that has the longest path.
  log('matching routes', matchingRoutes);

  const { handler: matchingHandler, path: matchingPath } = matchingRoutes[0];

  if (!matchingHandler) {
    return { handler: null, keys: null };
  }

  const matchingKeys = [];
  const matchingRegExp = pathToRegexp(matchingPath, matchingKeys);
  const matchResult = matchingRegExp.exec(path);

  return {
    handler: matchingHandler,
    params: matchingKeys.reduce((acc, key, index) => {
      if (!key || !key.name) {
        return acc;
      }
      acc[key.name] = matchResult[index + 1];
      return acc;
    }, {})
  };
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
    if (!data) {
      return;
    }

    if (!data.path) {
      return;
    }

    const resolvedRoute = resolveRoute({
      path: data.path,
      method: data.method || 'get'
    });

    if (!resolvedRoute) {
      return;
    }

    const { handler, params } = resolvedRoute;

    if (!handler) {
      return;
    }

    if (!data.correlationId) {
      return;
    }

    try {
      const result = {
        correlationId: data.correlationId,
        data: Object.assign(
          {},
          tryParseJson((await handler(data, params)) || {})
        )
      };

      evt.sender.send(TOPIC, result);
    } catch (ex) {
      if (ex instanceof Error) {
        evt.sender.send(TOPIC, { status: 500, error: { reason: ex.message } });

        return;
      }

      evt.sender.send(TOPIC, { status: 500, error: ex });
    }
  });
};

const app = {
  get(routeInstance) {
    const clonedRoute = Object.assign({}, routeInstance);
    clonedRoute.method = 'GET';

    addRoute(clonedRoute);
  },

  post(routeInstance) {
    const clonedRoute = Object.assign({}, routeInstance);
    clonedRoute.method = 'POST';

    addRoute(clonedRoute);
  },

  put(routeInstance) {
    const clonedRoute = Object.assign({}, routeInstance);
    clonedRoute.method = 'PUT';

    addRoute(clonedRoute);
  },

  patch(routeInstance) {
    const clonedRoute = Object.assign({}, routeInstance);
    clonedRoute.method = 'PATCH';

    addRoute(clonedRoute);
  },

  delete(routeInstance) {
    const clonedRoute = Object.assign({}, routeInstance);
    clonedRoute.method = 'DELETE';

    addRoute(clonedRoute);
  }
};

module.exports = {
  registerChannel,
  addRoute,
  app
};
