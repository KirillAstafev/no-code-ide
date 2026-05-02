import {app, BrowserWindow, dialog, ipcMain} from "electron";
import {createWindow} from "./window.js";
import {getPreloadPath} from "./utils/preload.js";
import {ipcMainHandle, ipcMainOn} from "./ipc/main.js";
import {createProject, loadProject} from "./utils/project.js";

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
    mainWindow = createWindow("http://localhost:5123", {
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: getPreloadPath()
        }
    }) as BrowserWindow;

    ipcMainOn("closeWindow", () => mainWindow?.close());
    ipcMainOn("minimizeWindow", () => mainWindow?.minimize());
    ipcMainOn("maximizeWindow", () => mainWindow?.maximize());

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

    ipcMain.handle("createProject", createProject);
    ipcMain.handle('loadProject', loadProject);

    ipcMain.handle('selectFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: 'Выберите папку для проекта'
        });

        return result.canceled ? null : result.filePaths[0];
    });
});
