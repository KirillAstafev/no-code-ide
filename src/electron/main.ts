import {app, BrowserWindow, dialog, ipcMain} from "electron";
import {createWindow} from "./window.js";
import {getPreloadPath} from "./utils/preload.js";
import {ipcMainHandle, ipcMainOn} from "./ipc/main.js";
import path from "path";
import fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

app.on("ready", () => {
    mainWindow = createWindow("http://localhost:5123", {
        fullscreen: true,
        show: false,
        webPreferences: {
            preload: getPreloadPath()
        }
    }) as BrowserWindow;

    ipcMainOn("closeWindow", () => {
        mainWindow?.close();
    });

    ipcMainOn("minimizeWindow", () => {
       mainWindow?.minimize();
    });

    ipcMainOn("maximizeWindow", () => {
        mainWindow?.maximize();
    });

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

    ipcMain.handle("createProjectFiles", async (event, project: Project) => {
        try {
            const basePath = project.location.replace(/^~/, process.env.HOME || process.env.USERPROFILE || '');
            const projectDir = path.join(basePath, project.name);

            await fs.mkdir(projectDir, { recursive: true });

            const projectConfig = {
                name: project.name,
                version: '1.0.0',
                created: new Date().toISOString(),
                dependencies: project.dependencies.map(d => ({
                    name: d.name,
                    code: d.dependencyCode,
                    category: d.category
                })),
                modules: project.modules.map(m => m.name)
            };

            await fs.writeFile(
                path.join(projectDir, 'project.json'),
                JSON.stringify(projectConfig, null, 2),
                'utf-8'
            );

            const schema = {
                modules: project.modules.reduce((acc, module) => {
                    acc[module.name] = {
                        sources: module.sources,
                        destinations: module.destinations
                    };
                    return acc;
                }, {} as Record<string, any>),
                createdAt: new Date().toISOString()
            };

            await fs.writeFile(
                path.join(projectDir, 'schema.json'),
                JSON.stringify(schema, null, 2),
                'utf-8'
            );

            const modulesDir = path.join(projectDir, 'modules');
            await fs.mkdir(modulesDir, { recursive: true });

            for (const module of project.modules) {
                const moduleDir = path.join(modulesDir, module.name);
                await fs.mkdir(moduleDir, { recursive: true });

                const moduleSchema = {
                    name: module.name,
                    sources: module.sources,
                    destinations: module.destinations,
                    commands: []
                };

                await fs.writeFile(
                    path.join(moduleDir, `${module.name}.json`),
                    JSON.stringify(moduleSchema, null, 2),
                    'utf-8'
                );
            }

            return { success: true, path: projectDir };
        } catch (error) {
            console.error('Ошибка создания проекта:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('loadProject', async (event, projectPath: string) => {
        try {
            const projectConfigPath = path.join(projectPath, 'project.json');
            const projectConfigRaw = await fs.readFile(projectConfigPath, 'utf-8');
            const project = JSON.parse(projectConfigRaw) as Project;

            const schemaPath = path.join(projectPath, 'schema.json');
            const schemaRaw = await fs.readFile(schemaPath, 'utf-8');
            const schema = JSON.parse(schemaRaw);

            const modulesDir = path.join(projectPath, 'modules');
            const moduleNames = await fs.readdir(modulesDir);
            const modules = [];

            for (const moduleName of moduleNames) {
                const moduleFilePath = path.join(modulesDir, moduleName, `${moduleName}.json`);
                const moduleRaw = await fs.readFile(moduleFilePath, 'utf-8');
                const moduleData = JSON.parse(moduleRaw);
                modules.push(moduleData);
            }

            return {
                success: true,
                project: project,
                schema: schema,
                modules: modules
            };
        } catch (error) {
            console.error('Ошибка загрузки проекта:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('selectFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: 'Выберите папку для проекта'
        });

        return result.canceled ? null : result.filePaths[0];
    });
});
