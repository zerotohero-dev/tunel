/*   ___                 /
 *     _-_-  _/\____    / __\\__
 *  _-_-__  / ,-. -|   /  -  ,-.`-.
 *     _-_- `( o )--  /  --( o )-'
 *            `-'    /      `-'
 * tunel (n): RESTful message tunneling over IPC.
 */

/*
 * A quick and dirty test case.
 */

const assert = require('assert');

const EventEmitter = require('events');

const { addRoute } = require('./server');
const { registerChannel: registerServerChannel } = require('./server');
const { registerChannel: registerClientChannel } = require('.');

const request = require('.').default;

const clientChannel = new EventEmitter();
const serverChannel = new EventEmitter();

/**
 * This cross-channel setup “more or less” mimics electron IPC.
 */
const wireChannels = () => {
  clientChannel.send = (topic, data) => serverChannel.emit(topic, data);
  serverChannel.send = (topic, data) => clientChannel.emit(topic, data);

  clientChannel.on = (topic, callback) => {
    EventEmitter.prototype.on.call(clientChannel, topic, result => {
      callback({ sender: clientChannel }, result);
    });
  };

  serverChannel.on = (topic, callback) => {
    EventEmitter.prototype.on.call(serverChannel, topic, result => {
      callback({ sender: serverChannel }, result);
    });
  };
};

wireChannels();
registerServerChannel(serverChannel);
registerClientChannel(clientChannel);

addRoute({
  path: '/api/v1/:name/greet/:phrase',
  method: 'GET',
  handler: async (data, params) => {
    console.log(`handler ${JSON.stringify(data, null, 2)}`);
    return { success: true, params };
  }
});

const run = async () => {
  const response = await request({
    url: '/api/v1/volkan/greet/hello'
  });

  assert(response.status === 200);
  assert(typeof response.data !== 'undefined');
  assert(response.data.success === true);
  assert(typeof response.data.params !== 'undefined');
  assert(response.data.params.name === 'volkan');
  assert(response.data.params.phrase === 'hello');

  console.log(`Incoming response: ${JSON.stringify(response, null, 2)}`);
};

run();
