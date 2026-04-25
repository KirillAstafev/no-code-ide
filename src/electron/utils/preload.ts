import path from "path";
import {app} from "electron";
import {isDev} from "./environment.js";

export function getPreloadPath(): string {
    return path.join(
        app.getAppPath(),
        isDev() ? '.' : '..',
        '/dist-electron/preload.cjs'
    )
}