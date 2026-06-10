import path from 'path';
import fs from 'fs/promises';

interface Project {
    name: string;
    location: string;
    modules: Module[];
    sources: DataSource[];
    destinations: DataDestination[];
    dependencies: ExternalDependency[];
    schema: Schema;
}

interface Module {
    name: string;
    location: string;
    sources: DataSource[];
    destinations: DataDestination[];
}

interface DataSource {
    name: string;
    ipAddress: string;
    tcpPort: number;
    command?: DataSourceCommand;
    commandParams?: Record<string, string | number | boolean>;
}

interface DataDestination {
    name: string;
    url: string;
    dependency: ExternalDependency;
    targetType?: string;
    databaseName?: string;
    schemaName?: string;
    tableName?: string;
    columnName?: string;
    topic?: string;
}

interface ExternalDependency {
    name: string;
    category: string;
    description: string;
    dependencyCode: string;
}

interface Schema {
    nodes?: SchemaNode[];
    edges?: SchemaEdge[];
    metadata?: {
        zoom?: number;
        offsetX?: number;
        offsetY?: number;
        layout?: 'dagre' | 'force' | 'grid';
        [key: string]: any;
    };
}

interface SchemaNode {
    id: string;
    type: 'module' | 'source' | 'destination';
    label: string;
    caption?: string;
    x?: number;
    y?: number;
    data: Module | DataSource | DataDestination;
}

interface SchemaEdge {
    id: string;
    sourceBlockId: string;
    targetBlockId: string;
    label?: string;
    style?: 'solid' | 'dashed';
    arrowhead?: 'none' | 'arrow' | 'dot';
}

interface GeneratedProjectInfo {
    projectName: string;
    mainPackage: string;
    mainClassName: string;
    modules: ModuleInfo[];
    sources: DataSourceInfo[];
    destinations: DestinationConnectionInfo[];
}

interface ModuleInfo {
    id: string;
    name: string;
    sourceConnections: SourceConnectionInfo[];
    destinationConnections: DestinationConnectionInfo[];
}

interface DataSourceInfo {
    id: string;
    name: string;
    ipAddress: string;
    tcpPort: number;
    commandName: string;
}

interface DestinationConnectionInfo {
    id: string;
    destinationName: string;
    destinationUrl: string;
    className: string;
    targetType: string;
    databaseName?: string;
    schemaName?: string;
    tableName?: string;
    columnName?: string;
    topic?: string;
}

interface SourceConnectionInfo {
    id: string;
    sourceName: string;
    sourceIpAddress: string;
    sourceTcpPort: number;
    commandName: string;
}

function generateJavaClassNameFromId(id: string): string {
    return normalizeIdentifier(id.charAt(0).toUpperCase() + id.slice(1));
}

function generateId(prefix: string, index: number): string {
    return `${prefix}${index}`;
}

function normalizeIdentifier(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]+/, '');
}

export async function findMainClassName(basePath: string): Promise<string> {
    try {
        const javaFiles = await fs.readdir(path.join(basePath, 'src', 'main', 'java'), { recursive: true });
        for (const file of javaFiles) {
            if (typeof file === 'string' && file.endsWith('Application.java')) {
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

    project.sources.forEach((source, index) => {
        sourceCounter++;
        const sourceId = generateId('Source', sourceCounter);
        sources.push({
            id: sourceId,
            name: normalizeIdentifier(source.name),
            ipAddress: source.ipAddress,
            tcpPort: source.tcpPort,
            commandName: source.command?.name || 'DEFAULT_COMMAND',
        });
    });

    project.modules.forEach((module, moduleIndex) => {
        const moduleId = generateId('Module', moduleIndex + 1);

        const sourceConnections: SourceConnectionInfo[] = [];
        module.sources.forEach((source, sourceIndex) => {
            sourceCounter++;
            const sourceId = generateId('Source', sourceCounter);
            const sourceName = normalizeIdentifier(source.name);
            sourceConnections.push({
                id: sourceId,
                sourceName: sourceName,
                sourceIpAddress: source.ipAddress,
                sourceTcpPort: source.tcpPort,
                commandName: source.command?.name || 'DEFAULT_COMMAND',
            });
        });

        const destinationConnections: DestinationConnectionInfo[] = [];
        module.destinations.forEach((destination, destinationIndex) => {
            destinationCounter++;
            const destinationId = generateId('Destination', destinationCounter);
            
            destinationConnections.push({
                id: destinationId,
                destinationName: normalizeIdentifier(destination.name),
                destinationUrl: destination.url,
                className: generateJavaClassNameFromId(destinationId) + 'Client',
                targetType: destination.targetType || '',
                databaseName: destination.databaseName,
                schemaName: destination.schemaName,
                tableName: destination.tableName,
                columnName: destination.columnName,
                topic: destination.topic,
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
            databaseName: d.databaseName,
            schemaName: d.schemaName,
            tableName: d.tableName,
            columnName: d.columnName,
            topic: d.topic,
        })),
    };
}

export async function generateJavaFiles(
    project: Project,
    generatedProjectInfo: GeneratedProjectInfo,
    outputDir: string
): Promise<void> {
    const { modules, sources, destinations, mainClassName, mainPackage } = generatedProjectInfo;
    const basePackage = mainPackage;

    const javaBaseDir = path.join(outputDir, 'src', 'main', 'java', ...basePackage.split('.'));
    const resourcesDir = path.join(outputDir, 'src', 'main', 'resources');

    await fs.mkdir(javaBaseDir, { recursive: true });
    await fs.mkdir(resourcesDir, { recursive: true });

    const destinationPromises = destinations.map(destination => {
        const destinationPath = path.join(javaBaseDir, destination.className + '.java');
        return fs.writeFile(destinationPath, generateDestinationClass(destination, basePackage), 'utf-8');
    });

    await Promise.all(destinationPromises);

    const modulePromises = modules.flatMap(module => [
        (function() {
            const serviceClassName = generateJavaClassNameFromId(module.id) + 'Service';
            const servicePath = path.join(javaBaseDir, serviceClassName + '.java');
            return fs.writeFile(servicePath, generateModuleServiceClass(module, basePackage), 'utf-8');
        })()
    ]);

    await Promise.all(modulePromises);
}

function generateModuleServiceClass(module: ModuleInfo, basePackage: string): string {
    const className = generateJavaClassNameFromId(module.id) + 'Service';
    const packageDeclaration = `package ${basePackage};\n`;

    const imports = new Set<string>();
    imports.add('import org.springframework.stereotype.Component;');

    const importsStr = Array.from(imports).join('\n') + '\n\n';

    let fields = '';
    module.destinationConnections.forEach(destination => {
        fields += `    private final ${destination.className} ${normalizeIdentifier(destination.destinationName.toLowerCase())}Client;\n`;
    });

    let constructorParams = '';
    module.destinationConnections.forEach((destination, index) => {
        if (index > 0) constructorParams += ', ';
        constructorParams += `${destination.className} ${normalizeIdentifier(destination.destinationName.toLowerCase())}Client`;
    });

    let methods = '';
    module.sourceConnections.forEach(source => {
        methods += `
    public void processDataFrom${generateJavaClassNameFromId(source.id)}() {
        System.out.println("${source.commandName} - обработка данных от источника ${normalizeIdentifier(source.sourceName)}");
    }
`;
    });

    module.destinationConnections.forEach(destination => {
        const methodName = 'sendData';
        const dataVar = '"Данные из модуля"';
        methods += `
    public void sendDataTo${generateJavaClassNameFromId(destination.id)}() {
        System.out.println("Отправка данных в приёмник ${destination.destinationName} (" + "${destination.targetType || 'UNKNOWN'}" + ")");
        ${normalizeIdentifier(destination.destinationName.toLowerCase())}Client.${methodName}(${dataVar});
    }
`;
    });

    return `${packageDeclaration}${importsStr}
@Component
public class ${className} {
${fields}    
    public ${className}(${constructorParams}) {
        System.out.println("Инициализация модуля ${normalizeIdentifier(module.name)}");
${module.destinationConnections.map((dest, i) => `        this.${normalizeIdentifier(dest.destinationName.toLowerCase())}Client = ${normalizeIdentifier(dest.destinationName.toLowerCase())}Client;`).join('\n')}
    }
${methods}}
`;
}

function generateDestinationClass(destination: DestinationConnectionInfo, basePackage: string): string {
    const className = destination.className;
    const packageDeclaration = `package ${basePackage};\n`;
    const targetType = destination.targetType || 'UNKNOWN';

    let extraFields = '';
    let extraMethods = '';

    if (targetType === 'POSTGRESQL') {
        const databaseName = destination.databaseName || 'default_db';
        const schemaName = destination.schemaName || 'public';
        const tableName = destination.tableName || 'default_table';
        const columnName = destination.columnName || 'data';

        extraFields = `    private static final String DATABASE_NAME = "${databaseName}";
    private static final String SCHEMA_NAME = "${schemaName}";
    private static final String TABLE_NAME = "${tableName}";
    private static final String COLUMN_NAME = "${columnName}";

    private static final String URL = "${destination.destinationUrl}";
`;

        extraMethods = `
    public void sendBatchData(java.util.List<String> dataList) {
        System.out.println("Отправка пакета данных в PostgreSQL БД: " + DATABASE_NAME + ", схема: " + SCHEMA_NAME + ", таблица: " + TABLE_NAME);
        dataList.forEach(data -> System.out.println("Данные в столбце " + COLUMN_NAME + ": " + data));
    }
`;
    } else if (targetType === 'KAFKA') {
        const topic = destination.topic || 'default-topic';

        extraFields = `    private static final String TOPIC = "${topic}";
    private static final String BOOTSTRAP_SERVERS = "${destination.destinationUrl}";
`;

        extraMethods = `
    public void sendMessage(String message) {
        System.out.println("Отправка сообщения в Kafka topic: " + TOPIC + " на сервер: " + BOOTSTRAP_SERVERS);
        System.out.println("Сообщение: " + message);
    }

    public void sendBatchMessages(java.util.List<String> messages) {
        System.out.println("Отправка пакета сообщений в Kafka topic: " + TOPIC);
        messages.forEach(msg -> System.out.println("Сообщение: " + msg));
    }
`;
    } else {
        extraFields = `    private static final String URL = "${destination.destinationUrl}";
`;
    }

    return `${packageDeclaration}
import org.springframework.stereotype.Component;

@Component
public class ${className} {
${extraFields}    
    public void sendData(String data) {
        System.out.println("Отправка данных в " + "${destination.destinationName}" + " (" + "${targetType}" + ")");
        System.out.println("Данные: " + data);
    }
${extraMethods}}
`;
}
