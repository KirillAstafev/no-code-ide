const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
    closeWindow: () => {
        ipcRendererSend('closeWindow');
    },
    minimizeWindow: () => {
        ipcRendererSend('minimizeWindow');
    },
    maximizeWindow: () => {
        ipcRendererSend('maximizeWindow');
    },
    openProjectDialog: () => {
        return ipcRendererInvoke('openProjectDialog');
    },
    createProject: (data: Project) => {
        return electron.ipcRenderer.invoke('createProject', data);
    },
    loadProject: (projectPath: string) =>
        electron.ipcRenderer.invoke('loadProject', projectPath),
    selectFolder: () => {
        return electron.ipcRenderer.invoke('selectFolder');
    },
    saveProject: (project: Project) => electron.ipcRenderer.invoke('saveProject', project),
    createWindow: () => electron.ipcRenderer.invoke('createWindow'),
});

export function ipcRendererSend<Key extends keyof ChannelPayloadMapping>(
    key: Key,
    payload?: ChannelPayloadMapping[Key]
) {
    electron.ipcRenderer.send(key, payload);
}

export function ipcRendererInvoke<Key extends keyof ChannelPayloadMapping>(
    key: Key
): Promise<ChannelPayloadMapping[Key]> {
    return electron.ipcRenderer.invoke(key);
}