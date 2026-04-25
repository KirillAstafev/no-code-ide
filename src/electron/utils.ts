import {ipcMain} from "electron";

export function ipcMainOn(channel: WindowAction, handler: () => void): void {
    ipcMain.on(channel, handler);
}
