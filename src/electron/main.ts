import {app, BrowserWindow, dialog} from "electron";
import {createWindow} from "./window.js";
import {getPreloadPath} from "./utils/preload.js";
import {ipcMainHandle, ipcMainOn} from "./ipc/main.js";

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

    ipcMainHandle("openProjectDialog", async () => {
        const result = await dialog.showOpenDialog(mainWindow!, {
            properties: ['openDirectory'],
            title: 'Открыть проект'
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            return { path: result.filePaths[0] };
        }
        return { path: null };
    });
});
