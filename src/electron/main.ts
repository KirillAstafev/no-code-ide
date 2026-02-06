import { app, BrowserWindow, ipcMain } from "electron";
import { createWindow } from "./window.js";
import { getPreloadPath } from "./PathResolver.js";

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
    mainWindow = createWindow("http://localhost:5123", {
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: getPreloadPath()
        }
    }) as BrowserWindow;

    ipcMain.on("closeWindow", () => {
        mainWindow?.close();
    });

    ipcMain.on("minimizeWindow", () => {
        mainWindow?.minimize();
    });

    ipcMain.on("maximizeWindow", () => {
        mainWindow?.maximize();
    });
});
