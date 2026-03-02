const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
    closeWindow: () => {
        electron.ipcRenderer.send('closeWindow');
    },
    minimizeWindow: () => {
        electron.ipcRenderer.send('minimizeWindow');
    },
    maximizeWindow: () => {
        electron.ipcRenderer.send('maximizeWindow');
    },
    openProjectDialog: () => {
        return electron.ipcRenderer.invoke('openProjectDialog');
    }
})
