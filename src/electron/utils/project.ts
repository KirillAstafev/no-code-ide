import { IpcMainInvokeEvent } from 'electron';
import path from 'path';
import fs from 'fs/promises';

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
                source: sourceId,
                target: moduleId,
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
                source: moduleId,
                target: destId,
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

        const project: Project = {
            name: projectConfig.name,
            location: projectPath,
            modules,
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

        // Обновляем project.json
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
                    modules: project.modules.map(m => m.name)
                },
                null,
                2
            ),
            'utf-8'
        );

        // Пересохраняем схему
        await fs.writeFile(
            path.join(projectDir, 'schema.json'),
            JSON.stringify(project.schema, null, 2),
            'utf-8'
        );

        // Пересохраняем модули
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