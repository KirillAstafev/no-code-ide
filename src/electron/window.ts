import {BrowserWindow} from "electron";
import {isDev} from "./utils/environment.js";

const createWindow = (path: string, options: Electron.BrowserWindowConstructorOptions): BrowserWindow => {
    const window = new BrowserWindow(options);
    window.once("ready-to-show", () => {
        window.show();
    });

    if (isDev()) {
        window.loadURL(path);
        window.webContents.openDevTools();
    }

    return window;
};

export { createWindow };
