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
        on: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
        off: (channel: string, callback: (event: any, ...args: any[]) => void) => void;
    }
}

type WindowAction = "closeWindow" | "minimizeWindow" | "maximizeWindow";

type CreateProjectTab = "basic" | "dependencies";