const electron = require('electron');

electron.contextBridge.exposeInMainWorld('electron', {
    closeWindow: (windowId: string) => {
        electron.ipcRenderer.send('closeWindow', windowId);
    },
    minimizeWindow: (windowId: string) => {
        electron.ipcRenderer.send('minimizeWindow', windowId);
    },
    maximizeWindow: (windowId: string) => {
        electron.ipcRenderer.send('maximizeWindow', windowId);
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
    buildProject: (project: Project) => electron.ipcRenderer.invoke('buildProject', project),
    initGitRepository: (path: string) => electron.ipcRenderer.invoke('initGitRepository', path),
    addGitFiles: (path: string, files: string[]) => electron.ipcRenderer.invoke('addGitFiles', path, files),
    commitGit: (path: string, message: string) => electron.ipcRenderer.invoke('commitGit', path, message),
    pushGit: (path: string, remote: string, branch: string) => electron.ipcRenderer.invoke('pushGit', path, remote, branch),
    getGitStatus: (path: string) => electron.ipcRenderer.invoke('getGitStatus', path),
    getGitLog: (path: string, limit: number) => electron.ipcRenderer.invoke('getGitLog', path, limit),
    isGitRepository: (path: string) => electron.ipcRenderer.invoke('isGitRepository', path),
    createWindow: () => electron.ipcRenderer.invoke('createWindow'),
    on: (channel: string, callback: (event: any, ...args: any[]) => void) => {
        electron.ipcRenderer.on(channel, callback);
    },
    off: (channel: string, callback: (event: any, ...args: any[]) => void) => {
        electron.ipcRenderer.off(channel, callback);
    },
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
