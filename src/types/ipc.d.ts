type ChannelPayloadMapping = {
    closeWindow: void;
    minimizeWindow: void;
    maximizeWindow: void;
    openProjectDialog: Promise<{path: string} | {path: null}>
    createProject: Promise<{success: boolean, path?: string, error?: string}>
    loadProject: Promise<{
        success: boolean;
        project?: Project;
        error?: string;
    }>
    saveProject: Promise<{success: boolean, path?: string, error?: string}>
    buildProject: Promise<{success: boolean, path?: string, error?: string}>
    selectFolder: Promise<string | null>
    initGitRepository: Promise<void>
    addGitFiles: Promise<void>
    commitGit: Promise<void>
    pushGit: Promise<void>
    cloneGitRepository: Promise<void>
    getGitStatus: Promise<{ modified: string[], added: string[], deleted: string[], untracked: string[] }>
    getGitLog: Promise<{ hash: string, message: string, author: string, date: string }[]>
    isGitRepository: Promise<boolean>
    createWindow: Promise<any>
    runTest: Promise<{ success: boolean }>
}