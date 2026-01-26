import { app, ipcMain, BrowserWindow } from "electron";
import { createWindow } from "./window.js";

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
    mainWindow = createWindow("http://localhost:5123", {
        fullscreen: true,
        show: false,
    }) as BrowserWindow;
});

ipcMain.on('close-main-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.on('minimize-main-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('maximize-main-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});
