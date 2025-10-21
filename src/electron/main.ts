import { app, BrowserWindow } from "electron";
import { isDev } from "./utils.js";

app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        fullscreen: true
    });

    if (isDev()) {
        mainWindow.loadURL("http://localhost:5123");
    }
});
