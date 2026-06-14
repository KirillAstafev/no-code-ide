import path from 'path';
import fs from 'fs/promises';
import {generateId, generateJavaClassNameFromId, normalizeIdentifier} from "./generator/shared.js";
import {addEnableSchedulingToApplicationClass} from "./generator/application-generator.js";
import {generateApplicationProperties} from "./generator/properties-generator.js";
import {generateConfigurationClasses} from "./generator/config-generator.js";
import {generateDestinationClass} from "./generator/destination-generator.js";
import {generateSourceClass} from "./generator/source-generator.js";
import {generateModuleServiceClass} from "./generator/module-generator.js";
import {copyDriverLibraries} from "./generator/lib-generator.js";
import {updateBuildGradle} from "./generator/build-generator.js";

export async function findMainClassName(basePath: string): Promise<string> {
    try {
        const javaFiles = await fs.readdir(path.join(basePath, 'src', 'main', 'java'), {recursive: true});
        for (const file of javaFiles) {
            if (file.endsWith('Application.java')) {
                const filePath = path.join(basePath, 'src', 'main', 'java', file);
                const content = await fs.readFile(filePath, 'utf-8');
                const match = content.match(/package\s+([a-zA-Z0-9_.]+);/);
                if (match) {
                    return match[1];
                }
            }
        }
    } catch (error) {
        console.error('Ошибка поиска главного класса:', error);
    }
    return 'com.example.project';
}

export function generateJavaProject(project: Project, mainPackage: string): GeneratedProjectInfo {
    const basePackage = mainPackage;
    const mainClassName = 'Application';

    const modules: ModuleInfo[] = [];
    const sources: DataSourceInfo[] = [];
    let sourceCounter = 0;
    let destinationCounter = 0;

    project.sources.forEach((source) => {
        sourceCounter++;
        const sourceId = generateId('Source', sourceCounter);
        sources.push({
            id: sourceId,
            name: normalizeIdentifier(source.name),
            ipAddress: source.ipAddress,
            tcpPort: source.tcpPort,
            commandName: source.command?.name || 'DEFAULT_COMMAND',
            commandParams: source.commandParams || {},
        });
    });

    project.modules.forEach((module, moduleIndex) => {
        const moduleId = generateId('Module', moduleIndex + 1);

        const sourceConnections: SourceConnectionInfo[] = [];
        module.sources.forEach((source) => {
            sourceCounter++;
            const sourceId = generateId('Source', sourceCounter);
            const sourceName = normalizeIdentifier(source.name);
            sourceConnections.push({
                id: sourceId,
                sourceName: sourceName,
                sourceIpAddress: source.ipAddress,
                sourceTcpPort: source.tcpPort,
                commandName: source.command?.name || 'DEFAULT_COMMAND',
                commandParams: source.commandParams || {},
            });
        });

        const destinationConnections: DestinationConnectionInfo[] = [];
        module.destinations.forEach((destination) => {
            destinationCounter++;
            const destinationId = generateId('Destination', destinationCounter);

            destinationConnections.push({
                id: destinationId,
                destinationName: normalizeIdentifier(destination.name),
                destinationUrl: destination.url,
                className: generateJavaClassNameFromId(destinationId) + 'Client',
                targetType: destination.targetType || '',
                postgresql: destination.postgresql,
                kafka: destination.kafka,
                rabbitmq: destination.rabbitmq,
                redis: destination.redis,
                cassandra: destination.cassandra,
            });
        });

        modules.push({
            id: moduleId,
            name: normalizeIdentifier(module.name),
            sourceConnections,
            destinationConnections,
        });
    });

    return {
        projectName: project.name,
        mainPackage: basePackage,
        mainClassName: mainClassName,
        modules,
        sources,
        destinations: project.destinations.map((d, i) => ({
            id: generateId('Destination', i + 1),
            destinationName: normalizeIdentifier(d.name),
            destinationUrl: d.url,
            className: generateJavaClassNameFromId(`Destination${i + 1}`) + 'Client',
            targetType: d.targetType || '',
            postgresql: d.postgresql,
            kafka: d.kafka,
            rabbitmq: d.rabbitmq,
            redis: d.redis,
            cassandra: d.cassandra,
        })),
    };
}

export async function generateJavaFiles(
    project: Project,
    generatedProjectInfo: GeneratedProjectInfo,
    outputDir: string,
): Promise<void> {
    const { modules, sources, destinations, mainPackage } = generatedProjectInfo;
    const basePackage = mainPackage;

    const javaBaseDir = path.join(outputDir, 'src', 'main', 'java', ...basePackage.split('.'));
    const resourcesDir = path.join(outputDir, 'src', 'main', 'resources');
    const configDir = path.join(javaBaseDir, 'config');

    await fs.mkdir(javaBaseDir, { recursive: true });
    await fs.mkdir(resourcesDir, { recursive: true });
    await fs.mkdir(configDir, { recursive: true });

    await addEnableSchedulingToApplicationClass(outputDir);

    const applicationPropertiesPath = path.join(resourcesDir, 'application.properties');
    const applicationPropertiesContent = generateApplicationProperties(project, sources, destinations);
    await fs.writeFile(applicationPropertiesPath, applicationPropertiesContent, 'utf-8');

    const configClasses = generateConfigurationClasses(destinations, basePackage);
    for (const [fileName, content] of Object.entries(configClasses)) {
        const configPath = path.join(configDir, fileName);
        await fs.writeFile(configPath, content, 'utf-8');
    }

    const destinationPromises = destinations.map(destination => {
        const destinationPath = path.join(javaBaseDir, destination.className + '.java');
        return fs.writeFile(destinationPath, generateDestinationClass(destination, basePackage), 'utf-8');
    });

    await Promise.all(destinationPromises);

    if (sources.length > 0) {
        const sourcePromises = sources.map(source => {
            const sourceClassName = `${normalizeIdentifier(source.name)}Source`;
            const sourcePath = path.join(javaBaseDir, sourceClassName + '.java');
            return fs.writeFile(sourcePath, generateSourceClass(source, basePackage), 'utf-8');
        });
        await Promise.all(sourcePromises);
    }

    const modulePromises = modules.flatMap(module => [
        (function () {
            const serviceClassName = generateJavaClassNameFromId(module.id) + 'Service';
            const servicePath = path.join(javaBaseDir, serviceClassName + '.java');
            return fs.writeFile(servicePath, generateModuleServiceClass(module, basePackage), 'utf-8');
        })()
    ]);

    await Promise.all(modulePromises);

    await copyDriverLibraries(outputDir);
    await updateBuildGradle(outputDir, sources, basePackage);
}
