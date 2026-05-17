import {app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent} from "electron";
import {createProject, loadProject, saveProject} from "./utils/project.js";
import {createWindow, getWindow, setupWindowHandlers} from "./window/manager.js";

app.on("ready", () => {
    createWindow();
    setupWindowHandlers();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    ipcMain.handle("openProjectDialog", async (_: IpcMainInvokeEvent, parentWindowId: string) => {
        const result = await dialog.showOpenDialog(getWindow(parentWindowId)!, {
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

    ipcMain.handle('saveProject', saveProject);
    ipcMain.handle('createWindow', () => {
        createWindow();
    });
});
