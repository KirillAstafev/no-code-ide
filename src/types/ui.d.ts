interface Window {
    electron: {
        closeWindow: (windowId: string) => void;
        minimizeWindow: (windowId: string) => void;
        maximizeWindow: (windowId: string) => void;
        openProjectDialog: () => Promise<{ path: string | null }>;
        createProject: (Project) => Promise<{success: boolean, path?: string, error?: string}>;
        loadProject: (projectPath: string) => Promise<{success: boolean, project?: Project, error?: string}>;
        saveProject: (Project) => Promise<{success: boolean, path?: string, error?: string}>;
        buildProject: (Project) => Promise<{success: boolean, path?: string, error?: string}>;
        selectFolder: () => Promise<string | null>;
        createWindow: () => Promise<any>;
        initGitRepository: (path: string) => Promise<void>;
        addGitFiles: (path: string, files: string[]) => Promise<void>;
        commitGit: (path: string, message: string) => Promise<void>;
        pushGit: (path: string, remote: string, branch: string) => Promise<void>;
        cloneGitRepository: (url: string, path: string) => Promise<void>;
        getGitStatus: (path: string) => Promise<{ modified: string[], added: string[], deleted: string[], untracked: string[] }>;
        getGitLog: (path: string, limit: number) => Promise<{ hash: string, message: string, author: string, date: string }[]>;
        isGitRepository: (path: string) => Promise<boolean>;
        runTest: (project: Project) => Promise<{ success: boolean; path?: string; error?: string }>;
        on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
        off: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
    }
}

type WindowAction = "closeWindow" | "minimizeWindow" | "maximizeWindow";

type CreateProjectTab = "basic" | "dependencies";
