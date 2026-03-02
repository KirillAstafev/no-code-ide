interface Window {
    electron: {
        closeWindow: () => void;
        minimizeWindow: () => void;
        maximizeWindow: () => void;
        openProjectDialog: () => Promise<{ path: string | null }>;
    }
}

type WindowAction = "closeWindow" | "minimizeWindow" | "maximizeWindow";
