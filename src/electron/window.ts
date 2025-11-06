import { BrowserWindow } from "electron";
import { isDev } from "./utils.js";

const createWindow = (path: string, options: Electron.BrowserWindowConstructorOptions | undefined) => {
    const window = new BrowserWindow(options);
    window.once("ready-to-show", () => {
        window.show();
    });

    if (isDev()) {
        window.loadURL(path);
        window.webContents.openDevTools();
    }
};

export { createWindow };
