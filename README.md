```text
  ___                 /
    _-_-  _/\____    / __\\__
 _-_-__  / ,-. -|   /  -  ,-.`-.
    _-_- `( o )--  /  --( o )-'
           `-'    /      `-'
tunel (n): RESTful message tunneling over IPC.
```

## Quick Example

```javascript
// Electron main thread

const electron = require('electron');
const channel = electron.ipcMain;

const { addRoute, registerChannel } = require('tunel/server');

registerChannel(channel);

const getProfile = async data => {
  void data;

  return {
    data: { userName: 'robert', fullName: 'Robert Denir Ona' }
  };
};

addRoute({
  path: '/api/v1/profile',
  method: 'GET',
  handler: getProfile
});
```

```javascript
// Electron renderer thread

import request from 'tunel';

// tunel has a REST…ish API
const response = await request({
  method: 'GET',
  url: '/api/v1/profile',
  data: { some: 'payload' },
  headers: {
    'Content-Type': 'application/json'
  }
});

// Will log
// `{ status: 200, data: { userName: 'robert', fullName: 'Robert Denir Ona' }}`
console.log(response);
```
