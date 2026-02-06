interface Window {
    electron: {
        closeWindow: () => void;
        minimizeWindow: () => void;
        maximizeWindow: () => void;
    }
}

type WindowAction = "closeWindow" | "minimizeWindow" | "maximizeWindow";
