import { app, BrowserWindow, ipcMain } from "electron";
import { createWindow } from "./window.js";
import { getPreloadPath, ipcMainOn } from "./utils.js";

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
    mainWindow = createWindow("http://localhost:5123", {
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: getPreloadPath()
        }
    }) as BrowserWindow;

    ipcMainOn("closeWindow", () => {
        mainWindow?.close();
    });

    ipcMainOn("minimizeWindow", () => {
       mainWindow?.minimize();
    });

    ipcMainOn("maximizeWindow", () => {
        mainWindow?.maximize();
    });
});
