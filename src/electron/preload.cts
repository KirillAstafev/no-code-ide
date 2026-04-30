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
    }
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