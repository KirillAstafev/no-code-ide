import { app, BrowserWindow } from "electron";
import { createWindow } from "./window.js";

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
    mainWindow = createWindow("http://localhost:5123", {
        fullscreen: true,
        show: false,
    }) as BrowserWindow;
});
