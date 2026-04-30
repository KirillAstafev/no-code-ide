import {ipcMain} from "electron";

export function ipcMainHandle<Key extends keyof ChannelPayloadMapping>(
    key: Key,
    handler: () => ChannelPayloadMapping[Key]
) {
    ipcMain.handle(key, () => {
        return handler();
    });
}

export function ipcMainOn<Key extends keyof ChannelPayloadMapping>(
    key: Key,
    handler: (payload: ChannelPayloadMapping[Key]) => void
) {
    ipcMain.on(key, (event, payload) => {
        handler(payload);
    });
}