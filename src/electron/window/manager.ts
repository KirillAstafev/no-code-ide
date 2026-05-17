import {app, BrowserWindow, ipcMain} from 'electron';
import { v4 as uuidv4 } from 'uuid';
import {isDev} from "../utils/environment.js";
import {getPreloadPath} from "../utils/preload.js";
import path from "path";

const windows = new Map<string, BrowserWindow>();

export function createWindow(): string {
    const id = uuidv4();

    const win = new BrowserWindow({
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: getPreloadPath(),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.once("ready-to-show", () => {
        win.show();
    });

    if (isDev()) {
        win.loadURL("http://localhost:5123");
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
    }

    win.webContents.on('dom-ready', () => {
        win.webContents.send('windowId', id);
    });

    windows.set(id, win);
    return id;
}

export function getWindow(id: string): BrowserWindow | null {
    return windows.get(id) || null;
}

export function minimizeWindow(id: string): boolean {
    const win = getWindow(id);
    if (win) {
        win.minimize();
        return true;
    }
    return false;
}

export function closeWindow(id: string): boolean {
    const win = getWindow(id);
    if (win) {
        win.close();
        windows.delete(id);

        return true;
    }
    return false;
}

export function setupWindowHandlers() {
    ipcMain.on('createWindow', () => {
        return createWindow();
    });

    ipcMain.on('closeWindow', (_event, id: string) => {
        return closeWindow(id);
    });

    ipcMain.on('minimizeWindow', (_event, id: string) => {
        return minimizeWindow(id);
    });
}