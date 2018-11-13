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

const TOPIC = 'IPR_REQUEST';

const routes = [];

const addRoute = routeInstance => {
  routes.push(routeInstance);
};

const resolveRoute = ({ path, method }) => {
  const matchingRoutes = routes.filter(
    route =>
      route &&
      route.path &&
      (typeof route.path === 'string'
        ? new RegExp(route.path)
        : route.path
      ).test(path) &&
      (method && typeof method === 'string' ? method : 'get').toLowerCase() ===
        (route.method && typeof route.method === 'string'
          ? route.method
          : 'get'
        ).toLowerCase()
  );

  if (!matchingRoutes.length) {
    return null;
  }

  const handler = matchingRoutes[0].handler;

  if (!handler) {
    return null;
  }

  return handler;
};

const registerChannel = channel => {
  channel.on(TOPIC, async (evt, data) => {
    const handler = resolveRoute({ path: data.path, method: data.method });

    if (!handler) {
      return;
    }

    const result = (await handler(data)) || {};

    if (!data.correlationId) {
      return;
    }

    result.correlationId = data.correlationId;
    evt.sender.send(TOPIC, result);
  });
};

module.exports = {
  registerChannel,
  addRoute
};
