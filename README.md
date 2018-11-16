```text
  ___                 /
    _-_-  _/\____    / __\\__
 _-_-__  / ,-. -|   /  -  ,-.`-.
    _-_- `( o )--  /  --( o )-'
           `-'    /      `-'
tunel (n): RESTful message tunneling over IPC.
```

## Quick Example

Here’s the code for Electron’s **main thread**:

```javascript
//
// Main Thread
//

const electron = require('electron');
const channel = electron.ipcMain;

const { app, registerChannel } = require('tunel/server');

registerChannel(channel);

// `app` API is similar to `express.js`
app.get('/api/v1/profile', async req => {
  void req;

  return {
    userName: 'robert',
    fullName: 'Robert Denir Ona'
  };
});
```

Here’s the cod for Electron’s **renderer thread** (_i.e., the browser_):

```javascript
//
// Renderer Thread
//

import request from 'tunel';

const doFetch = async () => {
  // `request` API is similar to `axios`.
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
};

doFetch();
```
