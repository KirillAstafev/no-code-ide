import { app } from "electron";
import { createWindow } from "./window.js";

app.on("ready", () => {
    createWindow("http://localhost:5123", {
        fullscreen: true,
        show: false,
    });
});
