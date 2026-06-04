import {app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent} from "electron";
import {createProject, loadProject, saveProject, buildProject} from "./utils/project.js";
import {
    initGitRepository,
    addGitFiles,
    commitGit,
    pushGit,
    getGitStatus,
    getGitLog,
    isGitRepository
} from "./utils/git.js";
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
    ipcMain.handle('buildProject', buildProject);
    ipcMain.handle('initGitRepository', async (_: IpcMainInvokeEvent, path: string) => await initGitRepository(path));
    ipcMain.handle('addGitFiles', async (_: IpcMainInvokeEvent, path: string, files: string[]) => await addGitFiles(path, files));
    ipcMain.handle('commitGit', async (_: IpcMainInvokeEvent, path: string, message: string) => await commitGit(path, message));
    ipcMain.handle('pushGit', async (_: IpcMainInvokeEvent, path: string, remote: string, branch: string) => await pushGit(path, remote, branch));
    ipcMain.handle('getGitStatus', async (_: IpcMainInvokeEvent, path: string) => await getGitStatus(path));
    ipcMain.handle('getGitLog', async (_: IpcMainInvokeEvent, path: string, limit: number) => await getGitLog(path, limit));
    ipcMain.handle('isGitRepository', async (_: IpcMainInvokeEvent, path: string) => await isGitRepository(path));
    ipcMain.handle('createWindow', () => {
        createWindow();
    });
});
