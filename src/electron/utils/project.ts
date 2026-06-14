import {BrowserWindow, IpcMainInvokeEvent} from 'electron';
import path from 'path';
import fs from 'fs/promises';
import unzipper from 'unzipper';
import {spawn} from "node:child_process";
import {findMainClassName, generateJavaFiles, generateJavaProject} from './javaGenerator.js';

let testProcess: import('node:child_process').ChildProcess | null = null;

export const stopTest = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        if (testProcess && testProcess.pid) {
            console.log(`Остановка процесса теста с PID: ${testProcess.pid}`);

            if (process.platform === 'win32') {
                const { spawn } = require('node:child_process');
                spawn('taskkill', ['/PID', testProcess.pid.toString(), '/F']);
            } else {
                process.kill(testProcess.pid, 'SIGTERM');
            }
            
            testProcess = null;
            return { success: true };
        }
        return { success: false, error: 'Процесс теста не найден' };
    } catch (error) {
        console.error('Ошибка остановки теста:', error);
        return { success: false, error: (error as Error).message };
    }
};

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
            // Сохраняем название команды в метке соединения
            edges.push({
                id: `edge-${sourceId}-to-${moduleId}`,
                sourceBlockId: sourceId,
                targetBlockId: moduleId,
                label: source.command?.name || 'command',
                arrowhead: 'arrow',
            });
        });

        module.destinations.forEach(destination => {
            const destId = `destination-${destination.name}`;
            nodes.push({
                id: destId,
                type: 'destination',
                label: destination.name,
                caption: `Приёмник: ${destination.targetType || 'UNKNOWN'}`,
                data: destination,
            });
            let label = 'output';
            if (destination.targetType === 'POSTGRESQL' && destination.postgresql?.tableName) {
                label = destination.postgresql?.tableName;
            } else if (destination.targetType === 'KAFKA' && destination.kafka?.topic) {
                label = destination.kafka?.topic;
            }
            edges.push({
                id: `edge-${moduleId}-to-${destId}`,
                sourceBlockId: moduleId,
                targetBlockId: destId,
                label: label,
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

        await fs.mkdir(projectDir, {recursive: true});

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

        // Создаем файл .gitignore с папкой /generated
        const gitignorePath = path.join(projectDir, '.gitignore');
        const gitignoreContent = '/generated\n';
        await fs.writeFile(gitignorePath, gitignoreContent, 'utf-8');

        const modulesDir = path.join(projectDir, 'modules');
        await fs.mkdir(modulesDir, {recursive: true});

        const modulePromises = project.modules.map(async (module) => {
            const moduleDir = path.join(modulesDir, module.name);
            await fs.mkdir(moduleDir, {recursive: true});

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
        });

        await Promise.all(modulePromises);

        return {success: true, path: projectDir};
    } catch (error) {
        console.error('Ошибка создания проекта:', error);
        return {success: false, error: (error as Error).message};
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

        let testAddresses: Record<string, string> = {};
        try {
            const testConfigsPath = path.join(projectPath, 'test/test.json');
            const testConfigsRaw = await fs.readFile(testConfigsPath, 'utf-8');
            testAddresses = JSON.parse(testConfigsRaw);
        } catch (error: any) {
            if (error?.code !== 'ENOENT') {
                console.error('Ошибка загрузки тестовых конфигураций:', error);
            }
        }

        const project: Project = {
            name: projectConfig.name,
            location: projectPath,
            modules,
            sources,
            destinations,
            dependencies,
            schema,
            testAddresses
        };

        return {
            success: true,
            project,
        };
    } catch (error) {
        console.error('Ошибка загрузки проекта:', error);
        return {success: false, error: (error as Error).message};
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
        const modulesPromises = project.modules.map(async (module) => {
            const moduleDir = path.join(modulesDir, module.name);
            await fs.mkdir(moduleDir, {recursive: true});
            await fs.writeFile(
                path.join(moduleDir, `${module.name}.json`),
                JSON.stringify(module, null, 2),
                'utf-8'
            );
        });

        await Promise.all(modulesPromises);

        const testDir = path.join(projectDir, 'test');
        await fs.mkdir(testDir, {recursive: true});
        await fs.writeFile(
            path.join(testDir, 'test.json'),
            JSON.stringify(project.testAddresses || {}, null, 2),
            'utf-8'
        );

        return {success: true, path: projectDir};
    } catch (error) {
        console.error('Ошибка сохранения проекта:', error);
        return {success: false, error: (error as Error).message};
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
            await fs.rm(generatedDir, {recursive: true, force: true});
        } catch (err) {
            // Игнорируем ошибки при удалении несуществующей папки
        }

        await fs.mkdir(generatedDir, {recursive: true});

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
        await zip.extract({path: generatedDir});

        const generatedItems = await fs.readdir(generatedDir);
        const templateFolder = generatedItems.find(item =>
            fs.stat(path.join(generatedDir, item)).then(s => s.isDirectory()).catch(() => false)
        );

        if (!templateFolder) {
            throw new Error('Не найдена папка с распакованным шаблоном Spring Boot');
        }

        const templatePath = path.join(generatedDir, templateFolder);

        const mainClassName = await findMainClassName(templatePath);
        const generatedProjectInfo = generateJavaProject(project, mainClassName);
        await generateJavaFiles(project, generatedProjectInfo, templatePath);

        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
            window.webContents.send('build-progress', {
                type: 'stage',
                payload: {stage: 'generating'}
            });
        }

        if (window) {
            window.webContents.send('build-progress', {
                type: 'stage',
                payload: {stage: 'building'}
            });
        }

        const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

        console.log(`Выполнение Gradle сборки в папке: ${templatePath}`);

        await new Promise((resolve, reject) => {
            const gradleProcess = spawn(gradlewCmd, ['build'], {
                cwd: templatePath,
                stdio: 'pipe',
                shell: true,
                env: {...process.env, NO_COLOR: '1'}
            });

            gradleProcess.stdout.on('data', (data) => {
                console.log(data.toString());
                const output = data.toString();
                if (output.includes('BUILD')) {
                    const window = BrowserWindow.fromWebContents(event.sender);
                    if (window) {
                        window.webContents.send('build-progress', {
                            type: 'progress',
                            payload: {progress: 70}
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
                            payload: {progress: 100}
                        });
                        finishWindow.webContents.send('build-progress', {
                            type: 'finish'
                        });
                    }
                    resolve(true);
                } else {
                    reject(new Error(`Ошибка при сборке проекта`));
                }
            });

            gradleProcess.on('error', (error: Error) => {
                reject(new Error(`Ошибка запуска Gradle: ${error.message}`));
            });
        });

        return {success: true, path: generatedDir};
    } catch (error) {
        console.error('Ошибка сборки проекта:', error);
        return {success: false, error: (error as Error).message};
    }
};

export const runTest = async (
    event: IpcMainInvokeEvent,
    project: Project
): Promise<{ success: boolean; path?: string; error?: string }> => {
    try {
        const projectDir = project.location;
        const generatedDir = path.join(projectDir, 'generated');

        try {
            await fs.stat(generatedDir);
        } catch (err) {
            throw new Error('Сгенерированный проект не найден. Выполните сборку проекта (Build) перед запуском теста.');
        }

        const generatedItems = await fs.readdir(generatedDir);
        const templateFolder = generatedItems.find(item =>
            fs.stat(path.join(generatedDir, item)).then(s => s.isDirectory()).catch(() => false)
        );

        if (!templateFolder) {
            throw new Error('Не найдена папка с распакованным шаблоном Spring Boot');
        }

        const templatePath = path.join(generatedDir, templateFolder);

        const resourcesDir = path.join(templatePath, 'src', 'main', 'resources');
        await fs.mkdir(resourcesDir, {recursive: true});

        const applicationTestPropertiesPath = path.join(resourcesDir, 'application-test.properties');
        const testAddresses = project.testAddresses || {};

        const lines: string[] = [];
        lines.push('# Test configuration');

        if (project.sources && project.sources.length > 0) {
            project.sources.forEach(source => {
                const sourceName = source.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const key = `${source.name}`;
                if (testAddresses[key]) {
                    const [host, port] = testAddresses[key].split(':');
                    lines.push(`app.sources.${sourceName}.ipAddress=${host || 'localhost'}`);
                    lines.push(`app.sources.${sourceName}.tcpPort=${parseInt(port) || source.tcpPort}`);
                }

                if (source.command?.name) {
                    lines.push(`app.sources.${sourceName}.commandName=${source.command.name}`);
                }

                if (source.commandParams && Object.keys(source.commandParams).length > 0) {
                    Object.entries(source.commandParams).forEach(([key, value]) => {
                        lines.push(`app.sources.${sourceName}.${key.toLowerCase()}=${value}`);
                    });
                }
                lines.push('');
            });
        }

        if (project.destinations && project.destinations.length > 0) {
            project.destinations.forEach(destination => {
                const key = `${destination.name}`;
                if (testAddresses[key]) {
                    const destName = destination.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    if (destination.targetType === 'POSTGRESQL') {
                        const [host, portAndDb] = testAddresses[key].split(':');
                        const port = portAndDb ? portAndDb.split('/')[0] : '5432';
                        lines.push(`app.postgresql.${destName}.host=${host || 'localhost'}`);
                        lines.push(`app.postgresql.${destName}.port=${parseInt(port) || 5432}`);
                        lines.push(`app.postgresql.${destName}.database=${destination.postgresql?.databaseName || 'testdb'}`);
                        lines.push(`app.postgresql.${destName}.schema=${destination.postgresql?.schemaName || 'public'}`);
                        lines.push(`app.postgresql.${destName}.table=${destination.postgresql?.tableName || 'test_table'}`);
                        lines.push(`app.postgresql.${destName}.column=${destination.postgresql?.columnName || 'data'}`);
                    } else if (destination.targetType === 'KAFKA') {
                        lines.push(`app.kafka.${destName}.bootstrap-servers=${testAddresses[key]}`);
                        lines.push(`app.kafka.${destName}.topic=${destination.kafka?.topic || 'test-topic'}`);
                    } else if (destination.targetType === 'RABBITMQ') {
                        lines.push(`spring.rabbitmq.${destName}.host=${testAddresses[key].split(':')[0] || 'localhost'}`);
                        lines.push(`spring.rabbitmq.${destName}.port=${parseInt(testAddresses[key].split(':')[1]) || 5672}`);
                        lines.push(`app.rabbitmq.${destName}.queue=${destination.rabbitmq?.queueName || 'test-queue'}`);
                    } else if (destination.targetType === 'REDIS') {
                        lines.push(`spring.redis.${destName}.host=${testAddresses[key].split(':')[0] || 'localhost'}`);
                        lines.push(`spring.redis.${destName}.port=${parseInt(testAddresses[key].split(':')[1]) || 6379}`);
                        lines.push(`app.redis.${destName}.key=${destination.redis?.key || 'test-key'}`);
                    } else if (destination.targetType === 'CASSANDRA') {
                        lines.push(`spring.data.cassandra.${destName}.contact-points=${testAddresses[key]}`);
                        lines.push(`spring.data.cassandra.${destName}.keyspace=${destination.cassandra?.keyspace || 'test_keyspace'}`);
                        lines.push(`spring.data.cassandra.${destName}.table=${destination.cassandra?.table || 'test_table'}`);
                    }
                }
            });
        }

        await fs.writeFile(applicationTestPropertiesPath, lines.join('\n'), 'utf-8');

        const window = BrowserWindow.fromWebContents(event.sender);
        if (window) {
            window.webContents.send('run-test-progress', {
                type: 'stage',
                payload: {stage: 'configuring'}
            });
        }

        const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

        console.log(`Запуск Spring Boot с профилем test в папке: ${templatePath}`);

        testProcess = spawn(gradlewCmd, ['bootRun', '--args=\'--spring.profiles.active=test\''], {
            cwd: templatePath,
            stdio: 'pipe',
            shell: true,
            env: {...process.env, NO_COLOR: '1'}
        });

        if (window) {
            window.webContents.send('run-test-progress', {
                type: 'stage',
                payload: {stage: 'running'}
            });
        }

        testProcess.stdout?.on('data', (data) => {
            console.log(data.toString());
            if (window) {
                window.webContents.send('run-test-progress', {
                    type: 'output',
                    payload: {output: data.toString()}
                });
            }
        });

        testProcess.stderr?.on('data', (data) => {
            console.error(data.toString());
            if (window) {
                window.webContents.send('run-test-progress', {
                    type: 'output',
                    payload: {output: data.toString(), isError: true}
                });
            }
        });

        testProcess.on('close', (code) => {
            testProcess?.kill();
            if (window) {
                window.webContents.send('run-test-progress', {
                    type: 'finish',
                    payload: {success: code === 0}
                });
            }
        });

        testProcess.on('error', (error) => {
            console.error('Ошибка запуска Spring Boot:', error);
            testProcess?.kill();
            if (window) {
                window.webContents.send('run-test-progress', {
                    type: 'error',
                    payload: {message: error.message}
                });
            }
        });

        if (window) {
            window.webContents.send('run-test-progress', {
                type: 'process-info',
                payload: {pid: testProcess.pid}
            });
        }

        return {success: true, path: templatePath};
    } catch (error) {
        console.error('Ошибка запуска теста:', error);
        return {success: false, error: (error as Error).message};
    }
};
