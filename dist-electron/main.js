import { app, BrowserWindow } from "electron";
app.on("ready", () => {
    const mainWindow = new BrowserWindow({
        fullscreen: true
    });
    mainWindow.loadURL("http://localhost:5123");
});
