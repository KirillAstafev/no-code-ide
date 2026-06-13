import path from 'path';
import fs from 'fs/promises';
import {isDev} from "./environment.js";
import {app} from "electron";

function generateJavaClassNameFromId(id: string): string {
    return normalizeIdentifier(id.charAt(0).toUpperCase() + id.slice(1));
}

function generateId(prefix: string, index: number): string {
    return `${prefix}${index}`;
}

function normalizeIdentifier(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]+/, '');
}

function normalizePropertyName(str: string): string {
    const normalized = str.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]+/, '');
    return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

async function addEnableSchedulingToApplicationClass(outputDir: string): Promise<void> {
    const javaBaseDir = path.join(outputDir, 'src', 'main', 'java');

    if (!javaBaseDir) {
        console.error('Java base directory not found');
        return;
    }

    let applicationClassPath: string | null = null;
    let existingClassName: string | null = null;

    async function findApplicationClass(dir: string): Promise<void> {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.isDirectory()) {
                    await findApplicationClass(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.java')) {
                    const content = await fs.readFile(fullPath, 'utf-8');
                    if (content.includes('@SpringBootApplication')) {
                        applicationClassPath = fullPath;
                        existingClassName = entry.name.replace('.java', '');
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning directory:', error);
        }
    }

    await findApplicationClass(javaBaseDir);

    if (!applicationClassPath || !existingClassName) {
        console.error('No class with @SpringBootApplication found');
        return;
    }

    try {
        let content = await fs.readFile(applicationClassPath, 'utf-8');

        if (content.includes('@EnableScheduling')) {
            console.log('@EnableScheduling already present in ' + existingClassName + ' class');
            return;
        }

        if (content.includes('@SpringBootApplication')) {
            content = content.replace(
                /(@SpringBootApplication)(\s*)/,
                '$1\n@EnableScheduling$2'
            );

            if (!content.includes('import org.springframework.scheduling.annotation.EnableScheduling;')) {
                const importRegex = /(import .*;\n)+/;
                const importsMatch = content.match(importRegex);

                if (importsMatch) {
                    content = content.replace(
                        importRegex,
                        importsMatch[0] + 'import org.springframework.scheduling.annotation.EnableScheduling;\n'
                    );
                } else {
                    content = content.replace(
                        /(package .*;\n)/,
                        '$1\nimport org.springframework.scheduling.annotation.EnableScheduling;\n'
                    );
                }
            }

            await fs.writeFile(applicationClassPath, content, 'utf-8');
            console.log('Added @EnableScheduling to ' + existingClassName + ' class');
        } else {
            console.warn('@SpringBootApplication not found in ' + existingClassName + ' class');
        }

    } catch (error) {
        console.error('Failed to update Application class:', error);
    }
}

function generateApplicationProperties(
    project: Project,
    sources: DataSourceInfo[],
    destinations: DestinationConnectionInfo[]
): string {
    const lines: string[] = [];

    // Настройки источников данных
    if (sources.length > 0) {
        sources.forEach((source) => {
            const sourceName = normalizePropertyName(source.name);
            lines.push(`app.sources.${sourceName}.name=${source.name}`);
            lines.push(`app.sources.${sourceName}.ipAddress=${source.ipAddress}`);
            lines.push(`app.sources.${sourceName}.tcpPort=${source.tcpPort}`);
            lines.push(`app.sources.${sourceName}.commandName=${source.commandName}`);

            const commandParams = project.sources.filter(s => s.name === source.name)[0].commandParams || {};
            lines.push(`app.sources.${sourceName}.accessPassword=${commandParams.accessPassword || ''}`);
            lines.push(`app.sources.${sourceName}.userPassword=${commandParams.userPassword || ''}`);
            lines.push('');
        });
    }

    if (destinations.length > 0) {
        destinations.forEach((destination) => {
            const destName = normalizePropertyName(destination.destinationName);

            if (destination.targetType === 'POSTGRESQL') {
                const pgSettings = destination.postgresql;
                const schemaName = pgSettings?.schemaName || 'public';
                const tableName = pgSettings?.tableName || 'your_table';
                const columnName = pgSettings?.columnName || 'data_column';

                lines.push(`# PostgreSQL Configuration for ${destination.destinationName}`);
                lines.push(`app.postgresql.${destName}.schema=${schemaName}`);
                lines.push(`app.postgresql.${destName}.table=${tableName}`);
                lines.push(`app.postgresql.${destName}.column=${columnName}`);
                lines.push('');

            } else if (destination.targetType === 'KAFKA') {
                const kafkaSettings = destination.kafka;
                const topic = kafkaSettings?.topic || 'default-topic';

                lines.push(`# Kafka Configuration for ${destination.destinationName}`);
                lines.push(`app.kafka.${destName}.topic=${topic}`);
                lines.push('');

            } else if (destination.targetType === 'RABBITMQ') {
                const urlParts = destination.destinationUrl.split(':');
                const host = urlParts[0] || 'localhost';
                const port = urlParts[1] || '5672';
                const queueName = destination.rabbitmq?.queueName || `queue-${destName}`;
                const exchangeName = destination.rabbitmq?.exchangeName || '';
                const routingKey = destination.rabbitmq?.routingKey || '';

                lines.push(`# RabbitMQ Configuration for ${destination.destinationName}`);
                lines.push(`spring.rabbitmq.${destName}.host=${host}`);
                lines.push(`spring.rabbitmq.${destName}.port=${port}`);
                lines.push(`app.rabbitmq.${destName}.queue=${queueName}`);
                if (exchangeName) {
                    lines.push(`app.rabbitmq.${destName}.exchange=${exchangeName}`);
                }
                if (routingKey) {
                    lines.push(`app.rabbitmq.${destName}.routing-key=${routingKey}`);
                }
                lines.push('');

            } else if (destination.targetType === 'REDIS') {
                const urlParts = destination.destinationUrl.split(':');
                const host = urlParts[0] || 'localhost';
                const port = urlParts[1] || '6379';
                const key = destination.redis?.key || 'default-key';
                const ttl = destination.redis?.ttl || 0;

                lines.push(`# Redis Configuration for ${destination.destinationName}`);
                lines.push(`spring.redis.${destName}.host=${host}`);
                lines.push(`spring.redis.${destName}.port=${port}`);
                lines.push(`app.redis.${destName}.key=${key}`);
                lines.push(`app.redis.${destName}.ttl=${ttl}`);
                lines.push('');

            } else if (destination.targetType === 'CASSANDRA') {
                const contactPoints = destination.destinationUrl.split(',');
                const keyspace = destination.cassandra?.keyspace || 'default_keyspace';
                const table = destination.cassandra?.table || 'default_table';

                lines.push(`# Cassandra Configuration for ${destination.destinationName}`);
                lines.push(`spring.data.cassandra.${destName}.contact-points=${contactPoints.join(',')}`);
                lines.push(`spring.data.cassandra.${destName}.port=9042`);
                lines.push(`spring.data.cassandra.${destName}.keyspace=${keyspace}`);
                lines.push(`app.cassandra.${destName}.table=${table}`);
                lines.push('');
            }
        });
    }

    return lines.join('\n');
}

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

async function updateBuildGradle(
    outputDir: string,
    sources: DataSourceInfo[],
    basePackage: string
): Promise<void> {
    const buildGradlePath = path.join(outputDir, 'build.gradle');

    const hasKKTSources = sources.some(source =>
        source.commandName && source.commandName.startsWith('NEVA_')
    );

    if (!hasKKTSources) {
        return;
    }

    const kktDependencies = `
// Зависимости для драйвера ККТ НЕВА 03-Ф
dependencies {
    // Локальная JAR-библиотека драйвера ККТ из папки libs
    implementation fileTree(dir: 'libs', include: ['*.jar'])
}

// Настройка для подключения нативной библиотеки
bootRun {
    systemProperty "java.library.path", "libs/native"
}

test {
    systemProperty "java.library.path", "libs/native"
}
`;

    const flatDirRepo = `
    flatDir {
        dirs 'libs'
    }
`;

    try {
        let existingContent = '';
        try {
            existingContent = await fs.readFile(buildGradlePath, 'utf-8');
        } catch (error) {
            // Файл не существует, создаём базовый
            existingContent = `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = '${basePackage.replace(/\./g, '.')}'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter'
    implementation 'org.springframework.boot:spring-boot-starter-jdbc'
    implementation 'org.postgresql:postgresql'
    implementation 'org.springframework.kafka:spring-kafka'
    implementation 'org.springframework.boot:spring-boot-starter-amqp'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.boot:spring-boot-starter-data-cassandra'
}
`;
        }

        if (existingContent.includes('fiscal_core_driver')) {
            console.log('KKT dependencies already present in build.gradle');
            return;
        }

        if (existingContent.includes('repositories {')) {
            if (!existingContent.includes('flatDir')) {
                existingContent = existingContent.replace(
                    /repositories\s*\{/,
                    `repositories {\n    mavenCentral()${flatDirRepo}`
                );
            }
        } else {
            existingContent = existingContent.replace(
                /dependencies\s*\{/,
                `repositories {\n    mavenCentral()${flatDirRepo}\n}\n\ndependencies {`
            );
        }

        if (existingContent.includes('dependencies {')) {
            if (!existingContent.includes('implementation fileTree(dir: \'libs\'')) {
                existingContent = existingContent.replace(
                    /dependencies\s*\{/,
                    `dependencies {\n    // Зависимости для драйвера ККТ НЕВА 03-Ф\n    implementation fileTree(dir: 'libs', include: ['*.jar'])`
                );
            }
        } else {
            existingContent += `\n\n${kktDependencies}`;
        }

        if (!existingContent.includes('bootRun {')) {
            existingContent += `

bootRun {
    systemProperty "java.library.path", "libs/native"
}

test {
    systemProperty "java.library.path", "libs/native"
}`;
        }

        await fs.writeFile(buildGradlePath, existingContent, 'utf-8');
        console.log('build.gradle updated with KKT driver dependencies');

    } catch (error) {
        console.error('Failed to update build.gradle:', error);
        throw error;
    }
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

async function copyDriverLibraries(
    outputDir: string,
): Promise<void> {
    const libsDir = path.join(outputDir, 'libs');
    const nativeDir = path.join(libsDir, 'native');

    await fs.mkdir(libsDir, {recursive: true});
    await fs.mkdir(nativeDir, {recursive: true});

    const sourceLibsDir = path.join(app.getAppPath(), isDev() ? '' : '..', '/libs');

    try {
        const jarFiles = await fs.readdir(sourceLibsDir);
        for (const file of jarFiles) {
            if (file.endsWith('.jar')) {
                const sourcePath = path.join(sourceLibsDir, file);
                const destPath = path.join(libsDir, file);
                await fs.copyFile(sourcePath, destPath);
                console.log(`Copied: ${file}`);
            }
        }

        const sourceNativeDir = path.join(sourceLibsDir, 'native');
        try {
            const nativeFiles = await fs.readdir(sourceNativeDir);
            for (const file of nativeFiles) {
                if (file.endsWith('.dll') || file.endsWith('.so')) {
                    const sourcePath = path.join(sourceNativeDir, file);
                    const destPath = path.join(nativeDir, file);
                    await fs.copyFile(sourcePath, destPath);
                    console.log(`Copied native: ${file}`);
                }
            }
        } catch (error) {
            console.log('No native libraries found in source, skipping');
        }

        const infoContent = {
            source: "Copied from No-Code IDE",
            copyDate: new Date().toISOString(),
            jarFiles: jarFiles.filter(f => f.endsWith('.jar')),
            nativeFiles: await getNativeFilesList(sourceNativeDir)
        };

        await fs.writeFile(
            path.join(libsDir, 'driver_info.json'),
            JSON.stringify(infoContent, null, 2),
            'utf-8'
        );

        console.log('Driver libraries copied successfully');

    } catch (error) {
        console.error('Failed to copy driver libraries:', error);

        // Создаём README с инструкцией
        const readmeContent = `# Установка драйвера ККТ

## Автоматическое копирование не удалось

Пожалуйста, скопируйте файлы драйвера вручную:

1. Скопируйте \`fiscal_core_driver.jar\` в папку \`libs/\`
2. Скопируйте нативные библиотеки:
   - \`fiscal_core_driver.dll\` для Windows в \`libs/native/\`
   - \`libfiscal_core_driver.so\` для Linux в \`libs/native/\`

## Где взять драйвер
Драйвер поставляется вместе с приложением No-Code IDE.
Найдите его в папке установки приложения.
`;

        await fs.writeFile(path.join(libsDir, 'README.md'), readmeContent, 'utf-8');
    }
}

async function getNativeFilesList(nativeDir: string): Promise<string[]> {
    try {
        const files = await fs.readdir(nativeDir);
        return files.filter(f => f.endsWith('.dll') || f.endsWith('.so'));
    } catch {
        return [];
    }
}

function generateConfigurationClasses(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): Record<string, string> {
    const configs: Record<string, string> = {};

    // Группируем приёмники по типу
    const postgresqlDests = destinations.filter(d => d.targetType === 'POSTGRESQL');
    if (postgresqlDests.length > 0) {
        configs['PostgreSQLConfig.java'] = generatePostgreSQLConfig(postgresqlDests, basePackage);
    }

    const kafkaDests = destinations.filter(d => d.targetType === 'KAFKA');
    if (kafkaDests.length > 0) {
        configs['KafkaConfig.java'] = generateKafkaConfig(kafkaDests, basePackage);
    }

    const rabbitmqDests = destinations.filter(d => d.targetType === 'RABBITMQ');
    if (rabbitmqDests.length > 0) {
        configs['RabbitMQConfig.java'] = generateRabbitMQConfig(rabbitmqDests, basePackage);
    }

    const redisDests = destinations.filter(d => d.targetType === 'REDIS');
    if (redisDests.length > 0) {
        configs['RedisConfig.java'] = generateRedisConfig(redisDests, basePackage);
    }

    const cassandraDests = destinations.filter(d => d.targetType === 'CASSANDRA');
    if (cassandraDests.length > 0) {
        configs['CassandraConfig.java'] = generateCassandraConfig(cassandraDests, basePackage);
    }

    return configs;
}

function generatePostgreSQLConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import javax.sql.DataSource;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const pgSettings = dest.postgresql;
        const host = dest?.destinationUrl.split(":")[0].trim() || 'localhost';
        const port = dest?.destinationUrl.split(":")[1].trim() || 5432;
        const database = pgSettings?.databaseName || 'postgres';
        const username = pgSettings?.username || 'postgres';
        const password = pgSettings?.password || '';

        beans += `
    @Bean(name = "${destName}DataSource")
    public DataSource ${destName}DataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:postgresql://${host}:${port}/${database}")
            .username("${username}")
            .password("${password}")
            .driverClassName("org.postgresql.Driver")
            .build();
    }
    
    @Bean(name = "${destName}JdbcTemplate")
    public JdbcTemplate ${destName}JdbcTemplate(
            @Qualifier("${destName}DataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class PostgreSQLConfig {${beans}
}
`;
}

function generateKafkaConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import java.util.HashMap;
import java.util.Map;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const bootstrapServers = dest.destinationUrl || 'localhost:9092';

        beans += `
    @Bean(name = "${destName}ProducerFactory")
    public ProducerFactory<String, String> ${destName}ProducerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "${bootstrapServers}");
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        return new DefaultKafkaProducerFactory<>(configProps);
    }
    
    @Bean(name = "${destName}KafkaTemplate")
    public KafkaTemplate<String, String> ${destName}KafkaTemplate(
            @Qualifier("${destName}ProducerFactory") ProducerFactory<String, String> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class KafkaConfig {${beans}
}
`;
}

function generateRabbitMQConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const urlParts = dest.destinationUrl.split(':');
        const host = urlParts[0] || 'localhost';
        const port = parseInt(urlParts[1]) || 5672;
        const queueName = dest.rabbitmq?.queueName || `queue-${destName}`;

        beans += `
    @Bean(name = "${destName}ConnectionFactory")
    public ConnectionFactory ${destName}ConnectionFactory() {
        CachingConnectionFactory connectionFactory = new CachingConnectionFactory("${host}", ${port});
        return connectionFactory;
    }
    
    @Bean(name = "${destName}RabbitTemplate")
    public RabbitTemplate ${destName}RabbitTemplate(
            @Qualifier("${destName}ConnectionFactory") ConnectionFactory connectionFactory) {
        return new RabbitTemplate(connectionFactory);
    }
    
    @Bean(name = "${destName}Queue")
    public Queue ${destName}Queue() {
        return new Queue("${queueName}", true);
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class RabbitMQConfig {${beans}
}
`;
}

function generateRedisConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const urlParts = dest.destinationUrl.split(':');
        const host = urlParts[0] || 'localhost';
        const port = parseInt(urlParts[1]) || 6379;

        beans += `
    @Bean(name = "${destName}RedisConnectionFactory")
    public LettuceConnectionFactory ${destName}RedisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName("${host}");
        config.setPort(${port});
        return new LettuceConnectionFactory(config);
    }
    
    @Bean(name = "${destName}RedisTemplate")
    public RedisTemplate<String, String> ${destName}RedisTemplate(
            @Qualifier("${destName}RedisConnectionFactory") LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        return template;
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class RedisConfig {${beans}
}
`;
}

function generateCassandraConfig(
    destinations: DestinationConnectionInfo[],
    basePackage: string
): string {
    const packageDeclaration = `package ${basePackage}.config;\n`;

    const imports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.cassandra.core.CassandraTemplate;
import com.datastax.oss.driver.api.core.CqlSession;
import java.net.InetSocketAddress;\n`;

    let beans = '';

    destinations.forEach(dest => {
        const destName = normalizePropertyName(dest.destinationName);
        const contactPoints = dest.destinationUrl.split(',');

        beans += `
    @Bean(name = "${destName}CassandraSession")
    public CqlSession ${destName}CassandraSession() {
        return CqlSession.builder()
            .addContactPoints(${contactPoints.map(cp => `new InetSocketAddress("${cp.trim()}", 9042)`).join(', ')})
            .withLocalDatacenter("datacenter1")
            .build();
    }
    
    @Bean(name = "${destName}CassandraTemplate")
    public CassandraTemplate ${destName}CassandraTemplate(
            @Qualifier("${destName}CassandraSession") CqlSession session) {
        return new CassandraTemplate(session);
    }
`;
    });

    return `${packageDeclaration}
${imports}
@Configuration
public class CassandraConfig {${beans}
}
`;
}

function generateSourceClass(source: DataSourceInfo, basePackage: string): string {
    const className = `${normalizeIdentifier(source.name)}Source`;
    const packageDeclaration = `package ${basePackage};\n`;
    const propertyName = normalizePropertyName(source.name);

    const imports = `import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import ru.neva.drivers.fptr.Fptr;
import ru.neva.drivers.fptr.IFptr;\n`;

    // Генерация полей для настроек
    const fields = `
    private IFptr fptr;
    private boolean connected = false;
    
    @Value("${"$"}{app.sources.${propertyName}.ipAddress}")
    private String ipAddress;
    
    @Value("${"$"}{app.sources.${propertyName}.tcpPort}")
    private int tcpPort;
    
    @Value("${"$"}{app.sources.${propertyName}.accessPassword:}")
    private String accessPassword;
    
    @Value("${"$"}{app.sources.${propertyName}.userPassword:}")
    private String userPassword;`;

    // Метод инициализации
    const initMethod = `
    @PostConstruct
    public void init() {
        try {
            fptr = new Fptr();
            
            String settings = String.format(
                "{\\"%s\\": %d, \\"%s\\": %d, \\"%s\\": \\"%s\\", \\"%s\\": %d}",
                IFptr.LIBFPTR_SETTING_MODEL, IFptr.LIBFPTR_MODEL_NEVA_3F,
                IFptr.LIBFPTR_SETTING_PORT, IFptr.LIBFPTR_PORT_TCPIP,
                IFptr.LIBFPTR_SETTING_IPADDRESS, ipAddress,
                IFptr.LIBFPTR_SETTING_IPPORT, tcpPort
            );
            
            fptr.setSettings(settings);
            
            if (accessPassword != null && !accessPassword.isEmpty()) {
                fptr.setSingleSetting(IFptr.LIBFPTR_SETTING_ACCESS_PASSWORD, accessPassword);
            }
            if (userPassword != null && !userPassword.isEmpty()) {
                fptr.setSingleSetting(IFptr.LIBFPTR_SETTING_USER_PASSWORD, userPassword);
            }
            
            fptr.applySingleSettings();
            fptr.open();
            connected = fptr.isOpened();
            
            System.out.println("KKT ${source.name} initialized at " + ipAddress + ":" + tcpPort);
        } catch (Exception e) {
            System.err.println("Failed to initialize KKT ${source.name}: " + e.getMessage());
        }
    }`;

    // Метод деинициализации
    const destroyMethod = `
    @PreDestroy
    public void destroy() {
        if (fptr != null) {
            fptr.close();
            fptr.destroy();
            connected = false;
            System.out.println("KKT ${source.name} destroyed");
        }
    }`;

    // Методы для всех поддерживаемых команд (возвращают результат)
    const commandMethods = `
    public boolean isConnected() {
        return connected;
    }
    
    private void checkConnection() {
        if (!connected || fptr == null) {
            throw new RuntimeException("KKT ${source.name} not connected");
        }
    }
    
    // 1. Запрос общей информации и статуса ККТ
    public String getStatus() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_STATUS);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("KKT Status\\n");
        sb.append("Operator ID: ").append(fptr.getParamInt(IFptr.LIBFPTR_PARAM_OPERATOR_ID)).append("\\n");
        sb.append("Shift state: ").append(fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_STATE)).append("\\n");
        sb.append("Shift number: ").append(fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_NUMBER)).append("\\n");
        sb.append("Receipt sum: ").append(fptr.getParamDouble(IFptr.LIBFPTR_PARAM_RECEIPT_SUM)).append("\\n");
        sb.append("Cash drawer opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_CASHDRAWER_OPENED)).append("\\n");
        sb.append("Paper present: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_RECEIPT_PAPER_PRESENT)).append("\\n");
        sb.append("Cover opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_COVER_OPENED)).append("\\n");
        sb.append("Serial number: ").append(fptr.getParamString(IFptr.LIBFPTR_PARAM_SERIAL_NUMBER)).append("\\n");
        sb.append("Model: ").append(fptr.getParamString(IFptr.LIBFPTR_PARAM_MODEL_NAME)).append("\\n");
        sb.append("Firmware: ").append(fptr.getParamString(IFptr.LIBFPTR_PARAM_UNIT_VERSION));
        
        return sb.toString();
    }
    
    // 2. Короткий запрос статуса ККТ
    public String getShortStatus() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_SHORT_STATUS);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("KKT Short Status\\n");
        sb.append("Cash drawer opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_CASHDRAWER_OPENED)).append("\\n");
        sb.append("Paper present: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_RECEIPT_PAPER_PRESENT)).append("\\n");
        sb.append("Paper near end: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_PAPER_NEAR_END)).append("\\n");
        sb.append("Cover opened: ").append(fptr.getParamBool(IFptr.LIBFPTR_PARAM_COVER_OPENED));
        
        return sb.toString();
    }
    
    // 3. Запрос суммы наличных в денежном ящике
    public String getCashSum() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_CASH_SUM);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Cash sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 4. Запрос состояния смены
    public String getShiftState() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_SHIFT_STATE);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        
        long state = fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_STATE);
        long number = fptr.getParamInt(IFptr.LIBFPTR_PARAM_SHIFT_NUMBER);
        String stateStr = "";
        if (state == IFptr.LIBFPTR_SS_CLOSED) stateStr = "CLOSED";
        else if (state == IFptr.LIBFPTR_SS_OPENED) stateStr = "OPENED";
        else if (state == IFptr.LIBFPTR_SS_EXPIRED) stateStr = "EXPIRED";
        
        return "Shift state: " + stateStr + ", number: " + number;
    }
    
    // 5. Открытие смены
    public String openShift() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_OPERATOR_ID, 1);
        if (fptr.openShift() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Shift opened successfully";
    }
    
    // 6. Закрытие смены
    public String closeShift() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_OPERATOR_ID, 1);
        if (fptr.close() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Shift closed successfully";
    }
    
    // 7. Запрос количества регистраций
    public String getRegistrationsCount() {
        return getRegistrationsCount(IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getRegistrationsCount(int receiptType) {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_REGISTRATIONS_COUNT);
        fptr.setParam(IFptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Registrations count: " + fptr.getParamInt(IFptr.LIBFPTR_PARAM_COUNT);
    }
    
    // 8. Запрос суммы регистраций
    public String getRegistrationsSum() {
        return getRegistrationsSum(IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getRegistrationsSum(int receiptType) {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_REGISTRATIONS_SUM);
        fptr.setParam(IFptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Registrations sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 9. Запрос суммы платежей
    public String getPaymentSum() {
        return getPaymentSum(IFptr.LIBFPTR_PT_CASH, IFptr.LIBFPTR_RT_SELL);
    }
    
    public String getPaymentSum(int paymentType, int receiptType) {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_PAYMENT_SUM);
        fptr.setParam(IFptr.LIBFPTR_PARAM_PAYMENT_TYPE, paymentType);
        fptr.setParam(IFptr.LIBFPTR_PARAM_RECEIPT_TYPE, receiptType);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Payment sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 10. Запрос суммы внесений
    public String getCashInSum() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_CASHIN_SUM);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Cash in sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 11. Запрос суммы выплат
    public String getCashOutSum() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_CASHOUT_SUM);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Cash out sum: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 12. Запрос суммы выручки
    public String getRevenue() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_REVENUE);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "Revenue: " + fptr.getParamDouble(IFptr.LIBFPTR_PARAM_SUM);
    }
    
    // 13. Запрос текущих даты и времени с ККТ
    public String getDateTime() {
        checkConnection();
        fptr.setParam(IFptr.LIBFPTR_PARAM_DATA_TYPE, IFptr.LIBFPTR_DT_DATE_TIME);
        if (fptr.queryData() < 0) {
            return "Error: " + fptr.errorDescription();
        }
        return "KKT Date/Time: " + fptr.getParamDateTime(IFptr.LIBFPTR_PARAM_DATE_TIME);
    }`;

    return `${packageDeclaration}
${imports}
@Component
public class ${className} {${fields}
    
${initMethod}
${destroyMethod}
${commandMethods}
}
`;
}

function generateModuleServiceClass(module: ModuleInfo, basePackage: string): string {
    const className = generateJavaClassNameFromId(module.id) + 'Service';
    const packageDeclaration = `package ${basePackage};\n`;

    const imports = new Set<string>();
    imports.add('import org.springframework.stereotype.Service;');
    imports.add('import org.springframework.beans.factory.annotation.Qualifier;');
    imports.add('import org.springframework.scheduling.annotation.Scheduled;');

    const importsStr = Array.from(imports).join('\n') + '\n\n';

    let fields = '';
    let constructorParams = '';
    let constructorAssignments = '';

    module.destinationConnections.forEach((destination, index) => {
        const fieldName = `${normalizePropertyName(destination.destinationName.toLowerCase())}Client`;
        const qualifierName = normalizePropertyName(destination.destinationName);
        const beanName = `${qualifierName}Client`;

        fields += `    private final ${destination.className} ${fieldName};\n`;

        if (index > 0) {
            constructorParams += ', ';
            constructorAssignments += '\n';
        }
        constructorParams += `@Qualifier("${beanName}") ${destination.className} ${fieldName}`;
        constructorAssignments += `        this.${fieldName} = ${fieldName};`;
    });

    let sourceFields = '';
    let sourceConstructorParams = '';
    let sourceConstructorAssignments = '';

    module.sourceConnections.forEach((source, index) => {
        const fieldName = `${normalizePropertyName(source.sourceName)}Source`;
        const sourceClassName = `${normalizeIdentifier(source.sourceName)}Source`;
        const beanName = `${normalizePropertyName(source.sourceName)}Source`;

        sourceFields += `    private final ${sourceClassName} ${fieldName};\n`;

        if (index > 0) {
            sourceConstructorParams += ', ';
            sourceConstructorAssignments += '\n';
        }
        sourceConstructorParams += `@Qualifier("${beanName}") ${sourceClassName} ${fieldName}`;
        sourceConstructorAssignments += `        this.${fieldName} = ${fieldName};`;
    });

    let sourceMethods = '';
    module.sourceConnections.forEach(source => {
        const methodName = `processDataFrom${generateJavaClassNameFromId(source.id)}`;
        const sourceField = `${normalizePropertyName(source.sourceName)}Source`;
        const commandName = source.commandName;

        sourceMethods += `
    @Scheduled(fixedRate = 10000)
    public void ${methodName}() {
        System.out.println("${commandName} - ${methodName} calling ${normalizeIdentifier(source.sourceName)}");
        
        if (!${sourceField}.isConnected()) {
            System.err.println("KKT ${normalizeIdentifier(source.sourceName)} not connected");
            return;
        }
        
        String result = "";`;

        switch (commandName) {
            case "NEVA_GET_STATUS":
                sourceMethods += `
        result = ${sourceField}.getStatus();`;
                break;
            case "NEVA_GET_SHORT_STATUS":
                sourceMethods += `
        result = ${sourceField}.getShortStatus();`;
                break;
            case "NEVA_GET_CASH_SUM":
                sourceMethods += `
        result = ${sourceField}.getCashSum();`;
                break;
            case "NEVA_GET_SHIFT_STATE":
                sourceMethods += `
        result = ${sourceField}.getShiftState();`;
                break;
            case "NEVA_OPEN_SHIFT":
                sourceMethods += `
        result = ${sourceField}.openShift();`;
                break;
            case "NEVA_CLOSE_SHIFT":
                sourceMethods += `
        result = ${sourceField}.closeShift();`;
                break;
            case "NEVA_GET_REGISTRATIONS_COUNT":
                sourceMethods += `
        result = ${sourceField}.getRegistrationsCount();`;
                break;
            case "NEVA_GET_REGISTRATIONS_SUM":
                sourceMethods += `
        result = ${sourceField}.getRegistrationsSum();`;
                break;
            case "NEVA_GET_PAYMENT_SUM":
                sourceMethods += `
        result = ${sourceField}.getPaymentSum();`;
                break;
            case "NEVA_GET_CASHIN_SUM":
                sourceMethods += `
        result = ${sourceField}.getCashInSum();`;
                break;
            case "NEVA_GET_CASHOUT_SUM":
                sourceMethods += `
        result = ${sourceField}.getCashOutSum();`;
                break;
            case "NEVA_GET_REVENUE":
                sourceMethods += `
        result = ${sourceField}.getRevenue();`;
                break;
            case "NEVA_GET_DATE_TIME":
                sourceMethods += `
        result = ${sourceField}.getDateTime();`;
                break;
            default:
                sourceMethods += `
        result = "Unknown command: ${commandName}";`;
        }

        sourceMethods += `
        System.out.println("Command result: " + result);
        
        `;

        module.destinationConnections.forEach(destination => {
            const sendMethod = `sendDataTo${generateJavaClassNameFromId(destination.id)}`;
            sourceMethods += `
        ${sendMethod}(result);`;
        });

        sourceMethods += `
    }`;
    });

    // Методы для отправки данных в приёмники
    let destinationMethods = '';
    module.destinationConnections.forEach(destination => {
        const methodName = `sendDataTo${generateJavaClassNameFromId(destination.id)}`;
        const clientField = `${normalizePropertyName(destination.destinationName.toLowerCase())}Client`;

        destinationMethods += `
    public void ${methodName}(String data) {
        ${clientField}.sendData(data);
    }`;
    });

    const allConstructorParams = constructorParams + (sourceConstructorParams ? (constructorParams ? ', ' : '') + sourceConstructorParams : '');
    const allConstructorAssignments = constructorAssignments + (sourceConstructorAssignments ? '\n' + sourceConstructorAssignments : '');

    return `${packageDeclaration}${importsStr}
@Service
public class ${className} {
${fields}${sourceFields}
    
    public ${className}(${allConstructorParams}) {
${allConstructorAssignments}
    }
${sourceMethods}
${destinationMethods}
}
`;
}

function generateDestinationClass(destination: DestinationConnectionInfo, basePackage: string): string {
    const className = destination.className;
    const packageDeclaration = `package ${basePackage};\n`;
    const targetType = destination.targetType || 'UNKNOWN';
    const propertyName = normalizePropertyName(destination.destinationName);

    const beanName = `${propertyName}Client`;

    const imports = `import org.springframework.stereotype.Component;\n`;
    let fields = '';
    let constructorParams = '';
    let constructorAssignments = '';
    let sendDataImpl = '';
    let additionalImports = '';
    const componentAnnotation = `@Component("${beanName}")`;

    if (targetType === 'POSTGRESQL') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        const tableName = destination.postgresql?.tableName || 'your_table';
        const columnName = destination.postgresql?.columnName || 'data_column';

        fields = `    private final JdbcTemplate jdbcTemplate;
    
    @Value("${"$"}{app.postgresql.${propertyName}.schema:public}")
    private String schema;
    
    @Value("${"$"}{app.postgresql.${propertyName}.table:${tableName}}")
    private String tableName;
    
    @Value("${"$"}{app.postgresql.${propertyName}.column:${columnName}}")
    private String columnName;\n`;

        constructorParams = `@Qualifier("${propertyName}JdbcTemplate") JdbcTemplate jdbcTemplate`;
        constructorAssignments = `        this.jdbcTemplate = jdbcTemplate;`;

        sendDataImpl = `
        String insertSql = String.format("INSERT INTO %s.%s (%s) VALUES (?)", schema, tableName, columnName);
        jdbcTemplate.update(insertSql, data);
        System.out.println("Data saved to PostgreSQL table '" + schema + "." + tableName + "': " + data);`;

    } else if (targetType === 'KAFKA') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final KafkaTemplate<String, String> kafkaTemplate;
    
    @Value("${"$"}{app.kafka.${propertyName}.topic:default-topic}")
    private String topic;\n`;

        constructorParams = `@Qualifier("${propertyName}KafkaTemplate") KafkaTemplate<String, String> kafkaTemplate`;
        constructorAssignments = `        this.kafkaTemplate = kafkaTemplate;`;

        sendDataImpl = `
        kafkaTemplate.send(topic, data);
        System.out.println("Message sent to Kafka topic '" + topic + "': " + data);`;

    } else if (targetType === 'RABBITMQ') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final RabbitTemplate rabbitTemplate;
    
    @Value("${"$"}{app.rabbitmq.${propertyName}.queue:default-queue}")
    private String queueName;
    
    @Value("${"$"}{app.rabbitmq.${propertyName}.exchange:}")
    private String exchangeName;
    
    @Value("${"$"}{app.rabbitmq.${propertyName}.routing-key:}")
    private String routingKey;\n`;

        constructorParams = `@Qualifier("${propertyName}RabbitTemplate") RabbitTemplate rabbitTemplate`;
        constructorAssignments = `        this.rabbitTemplate = rabbitTemplate;`;

        sendDataImpl = `
        if (exchangeName != null && !exchangeName.isEmpty()) {
            rabbitTemplate.convertAndSend(exchangeName, routingKey, data);
        } else {
            rabbitTemplate.convertAndSend(queueName, data);
        }
        System.out.println("Message sent to RabbitMQ: " + data);`;

    } else if (targetType === 'REDIS') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final RedisTemplate<String, String> redisTemplate;
    
    @Value("${"$"}{app.redis.${propertyName}.key:default-key}")
    private String key;
    
    @Value("${"$"}{app.redis.${propertyName}.ttl:0}")
    private int ttl;\n`;

        constructorParams = `@Qualifier("${propertyName}RedisTemplate") RedisTemplate<String, String> redisTemplate`;
        constructorAssignments = `        this.redisTemplate = redisTemplate;`;

        sendDataImpl = `
        redisTemplate.opsForValue().set(key, data);
        if (ttl > 0) {
            redisTemplate.expire(key, java.time.Duration.ofSeconds(ttl));
        }
        System.out.println("Data stored in Redis with key '" + key + "': " + data);`;

    } else if (targetType === 'CASSANDRA') {
        additionalImports = `import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.cassandra.core.CassandraTemplate;
import org.springframework.beans.factory.annotation.Value;\n`;

        fields = `    private final CassandraTemplate cassandraTemplate;
    
    @Value("${"$"}{app.cassandra.${propertyName}.table:default_table}")
    private String table;\n`;

        constructorParams = `@Qualifier("${propertyName}CassandraTemplate") CassandraTemplate cassandraTemplate`;
        constructorAssignments = `        this.cassandraTemplate = cassandraTemplate;`;

        sendDataImpl = `
        // Создание сущности для вставки
        // ExampleEntity entity = new ExampleEntity();
        // entity.setData(data);
        // cassandraTemplate.insert(entity);
        System.out.println("Data inserted into Cassandra table '" + table + "': " + data);`;

    } else {
        throw new Error(`Unsupported destination type: ${targetType}. Supported types: POSTGRESQL, KAFKA, RABBITMQ, REDIS, CASSANDRA`);
    }

    return `${packageDeclaration}
${imports}
${additionalImports}
${componentAnnotation}
public class ${className} {
${fields}
    
    public ${className}(${constructorParams}) {
${constructorAssignments}
    }
    
    public void sendData(String data) {${sendDataImpl}
    }
}
`;
}