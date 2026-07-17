const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
  close: () => ipcRenderer.send('win:close'),
  onMaximizeChange: (cb) => {
    const listener = (_e, maximized) => cb(maximized);
    ipcRenderer.on('win:maximize-changed', listener);
    return () => ipcRenderer.removeListener('win:maximize-changed', listener);
  },
});
