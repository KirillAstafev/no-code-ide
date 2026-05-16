interface Window {
    electron: {
        closeWindow: () => void;
        minimizeWindow: () => void;
        maximizeWindow: () => void;
        openProjectDialog: () => Promise<{ path: string | null }>;
        createProject: (Project) => Promise<{success: boolean, path?: string, error?: string}>;
        loadProject: (projectPath: string) => Promise<{success: boolean, project?: Project, error?: string}>
        saveProject: (Project) => Promise<{success: boolean, path?: string, error?: string}>;
        selectFolder: () => Promise<string | null>;
    }
}

type WindowAction = "closeWindow" | "minimizeWindow" | "maximizeWindow";

type CreateProjectTab = "basic" | "dependencies";