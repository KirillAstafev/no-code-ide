import {IpcMainInvokeEvent, BrowserWindow} from 'electron';
import path from 'path';
import fs from 'fs/promises';
import unzipper from 'unzipper';
import {spawn} from "node:child_process";

function generateSchemaFromProject(project: Project): Schema {
    const nodes: SchemaNode[] = [];
    const edges: SchemaEdge[] = [];

    project.modules.forEach(module => {
        const moduleId = `module-${module.name}`;
        nodes.push({
            id: moduleId,
            type: 'module',
            label: module.name,
            caption: 'Модуль',
            data: module,
        });

        module.sources.forEach(source => {
            const sourceId = `source-${source.name}`;
            nodes.push({
                id: sourceId,
                type: 'source',
                label: source.name,
                caption: `${source.ipAddress}:${source.tcpPort}`,
                data: source,
            });
            edges.push({
                id: `edge-${sourceId}-to-${moduleId}`,
                sourceBlockId: sourceId,
                targetBlockId: moduleId,
                label: 'input',
                arrowhead: 'arrow',
            });
        });

        module.destinations.forEach(destination => {
            const destId = `destination-${destination.name}`;
            nodes.push({
                id: destId,
                type: 'destination',
                label: destination.name,
                caption: 'Приёмник',
                data: destination,
            });
            edges.push({
                id: `edge-${moduleId}-to-${destId}`,
                sourceBlockId: moduleId,
                targetBlockId: destId,
                label: 'output',
                arrowhead: 'arrow',
            });
        });
    });

    return {
        nodes,
        edges,
        metadata: {
            layout: 'dagre',
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            createdAt: new Date().toISOString()
        }
    };
}

export const createProject = async (
    event: IpcMainInvokeEvent,
    project: Project
): Promise<{ success: boolean; path?: string; error?: string }> => {
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

        const schema = generateSchemaFromProject(project);
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

            const moduleData = {
                name: module.name,
                location: module.location,
                sources: module.sources,
                destinations: module.destinations
            };

            await fs.writeFile(
                path.join(moduleDir, `${module.name}.json`),
                JSON.stringify(moduleData, null, 2),
                'utf-8'
            );
        }

        return { success: true, path: projectDir };
    } catch (error) {
        console.error('Ошибка создания проекта:', error);
        return { success: false, error: (error as Error).message };
    }
};

export const loadProject = async (
    event: IpcMainInvokeEvent,
    projectPath: string
): Promise<{
    success: boolean;
    project?: Project;
    error?: string;
}> => {
    try {
        const projectConfigPath = path.join(projectPath, 'project.json');
        const projectConfigRaw = await fs.readFile(projectConfigPath, 'utf-8');
        const projectConfig = JSON.parse(projectConfigRaw);

        const schemaPath = path.join(projectPath, 'schema.json');
        const schemaRaw = await fs.readFile(schemaPath, 'utf-8');
        const schema: Schema = JSON.parse(schemaRaw);

        const modulesDir = path.join(projectPath, 'modules');
        const moduleNames = await fs.readdir(modulesDir);
        const modules: Module[] = [];

        for (const moduleName of moduleNames) {
            const moduleFilePath = path.join(modulesDir, moduleName, `${moduleName}.json`);
            const moduleRaw = await fs.readFile(moduleFilePath, 'utf-8');
            const moduleData = JSON.parse(moduleRaw) as Module;
            modules.push(moduleData);
        }

        const dependencies: ExternalDependency[] = projectConfig.dependencies.map((dep: any) => ({
            name: dep.name,
            dependencyCode: dep.code,
            category: dep.category,
            description: ''
        }));

        const sources: DataSource[] = projectConfig.sources || [];
        const destinations: DataDestination[] = projectConfig.destinations || [];

        const project: Project = {
            name: projectConfig.name,
            location: projectPath,
            modules,
            sources,
            destinations,
            dependencies,
            schema
        };

        return {
            success: true,
            project,
        };
    } catch (error) {
        console.error('Ошибка загрузки проекта:', error);
        return { success: false, error: (error as Error).message };
    }
}

export const saveProject = async (
    event: IpcMainInvokeEvent,
    project: Project
): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const projectDir = project.location;

        await fs.writeFile(
            path.join(projectDir, 'project.json'),
            JSON.stringify(
                {
                    name: project.name,
                    version: '1.0.0',
                    created: new Date().toISOString(),
                    dependencies: project.dependencies.map(d => ({
                        name: d.name,
                        code: d.dependencyCode,
                        category: d.category
                    })),
                    modules: project.modules.map(m => m.name),
                    sources: project.sources,
                    destinations: project.destinations
                },
                null,
                2
            ),
            'utf-8'
        );

        await fs.writeFile(
            path.join(projectDir, 'schema.json'),
            JSON.stringify(project.schema, null, 2),
            'utf-8'
        );

        const modulesDir = path.join(projectDir, 'modules');
        for (const module of project.modules) {
            const moduleDir = path.join(modulesDir, module.name);
            await fs.mkdir(moduleDir, { recursive: true });
            await fs.writeFile(
                path.join(moduleDir, `${module.name}.json`),
                JSON.stringify(module, null, 2),
                'utf-8'
            );
        }

        return { success: true, path: projectDir };
    } catch (error) {
        console.error('Ошибка сохранения проекта:', error);
        return { success: false, error: (error as Error).message };
    }
};

export const buildProject = async (
    event: IpcMainInvokeEvent,
    project: Project
): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const projectDir = project.location;
        const generatedDir = path.join(projectDir, 'generated');

        try {
            await fs.rm(generatedDir, { recursive: true, force: true });
        } catch (err) {
            // Игнорируем ошибки при удалении несуществующей папки
        }

        await fs.mkdir(generatedDir, { recursive: true });

        const dependencyCodes = project.dependencies.map(d => d.dependencyCode).filter(Boolean);
        const dependenciesParam = dependencyCodes.length > 0 ? dependencyCodes.join(',') : 'web';

        const initializrUrl = 'https://start.spring.io/starter.zip';
        
        const formData = new FormData();
        formData.append('type', 'gradle-project');
        formData.append('language', 'java');
        formData.append('bootVersion', '3.5.0');
        formData.append('baseDir', `${project.name}-generated`);
        formData.append('groupId', 'com.example');
        formData.append('artifactId', `${project.name}-generated`);
        formData.append('name', `${project.name} Generated`);
        formData.append('description', `Generated project for ${project.name}`);
        formData.append('packageName', `com.example.${project.name.replace(/\s+/g, '_')}`);
        formData.append('packaging', 'jar');
        formData.append('javaVersion', '21');
        formData.append('dependencies', dependenciesParam);

        const response = await fetch(initializrUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка загрузки шаблона Spring Boot: ${response.statusText}. Details: ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const zip = await unzipper.Open.buffer(buffer);
        await zip.extract({ path: generatedDir });

        // Отправляем сообщение о прогрессе - скачивание завершено
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
            window.webContents.send('build-progress', {
                type: 'stage',
                payload: { stage: 'generating' }
            });
        }

        const generatedItems = await fs.readdir(generatedDir);
        const templateFolder = generatedItems.find(item => 
            fs.stat(path.join(generatedDir, item)).then(s => s.isDirectory()).catch(() => false)
        );
        
        if (templateFolder) {
            const templatePath = path.join(generatedDir, templateFolder);

            // Отправляем сообщение о прогрессе - начало сборки
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                window.webContents.send('build-progress', {
                    type: 'stage',
                    payload: { stage: 'building' }
                });
            }

            const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
            
            console.log(`Выполнение Gradle сборки в папке: ${templatePath}`);
            
            await new Promise((resolve, reject) => {
                const gradleProcess = spawn(gradlewCmd, ['build'], {
                    cwd: templatePath,
                    stdio: 'pipe',
                    shell: true,
                    env: { ...process.env, NO_COLOR: '1' }
                });
                
                gradleProcess.stdout.on('data', (data) => {
                    console.log(data.toString());
                    // Обновляем прогресс на основе вывода (примерная логика)
                    const output = data.toString();
                    if (output.includes('BUILD')) {
                        const window = BrowserWindow.fromWebContents(event.sender);
                        if (window) {
                            window.webContents.send('build-progress', {
                                type: 'progress',
                                payload: { progress: 70 }
                            });
                        }
                    }
                });
                
                gradleProcess.stderr.on('data', (data) => {
                    console.error(data.toString());
                });
                
                gradleProcess.on('close', (code: number) => {
                    if (code === 0) {
                        console.log('Gradle сборка завершена успешно');
                        // Отправляем сообщение о завершении
                        const finishWindow = BrowserWindow.fromWebContents(event.sender);
                        if (finishWindow) {
                            finishWindow.webContents.send('build-progress', {
                                type: 'progress',
                                payload: { progress: 100 }
                            });
                            finishWindow.webContents.send('build-progress', {
                                type: 'finish'
                            });
                        }
                        resolve(true);
                    } else {
                        reject(new Error(`Gradle сборка завершилась с кодом ${code}`));
                    }
                });
                
                gradleProcess.on('error', (error: Error) => {
                    reject(new Error(`Ошибка запуска Gradle: ${error.message}`));
                });
            });
        } else {
            // Если шаблон не найден, отправляем прогресс 100% и finish
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                window.webContents.send('build-progress', {
                    type: 'progress',
                    payload: { progress: 100 }
                });
                window.webContents.send('build-progress', {
                    type: 'finish'
                });
            }
        }

        return { success: true, path: generatedDir };
    } catch (error) {
        console.error('Ошибка сборки проекта:', error);
        return { success: false, error: (error as Error).message };
    }
};