import path from 'path';
import fs from 'fs/promises';

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
            lines.push('');
        });
    }

    // Настройки приёмников данных
    if (destinations.length > 0) {
        destinations.forEach((destination) => {
            const destName = normalizePropertyName(destination.destinationName);

            if (destination.targetType === 'POSTGRESQL') {
                const pgSettings = destination.postgresql;
                const host = pgSettings?.host || 'localhost';
                const port = pgSettings?.port || 5432;
                const database = pgSettings?.databaseName || 'postgres';
                const username = pgSettings?.username || 'postgres';
                const password = pgSettings?.password || '';
                const schemaName = pgSettings?.schemaName || 'public';
                const tableName = pgSettings?.tableName || 'your_table';
                const columnName = pgSettings?.columnName || 'data_column';

                lines.push(`# PostgreSQL Configuration for ${destination.destinationName}`);
                lines.push(`spring.datasource.${destName}.url=jdbc:postgresql://${host}:${port}/${database}`);
                lines.push(`spring.datasource.${destName}.username=${username}`);
                lines.push(`spring.datasource.${destName}.password=${password}`);
                lines.push(`spring.datasource.${destName}.driver-class-name=org.postgresql.Driver`);
                lines.push(`app.postgresql.${destName}.schema=${schemaName}`);
                lines.push(`app.postgresql.${destName}.table=${tableName}`);
                lines.push(`app.postgresql.${destName}.column=${columnName}`);
                lines.push('');

            } else if (destination.targetType === 'KAFKA') {
                const kafkaSettings = destination.kafka;
                const bootstrapServers = kafkaSettings?.bootstrapServers || 'localhost:9092';
                const groupId = kafkaSettings?.groupId || `${destName}-group`;
                const clientId = kafkaSettings?.clientId || `${destName}-client`;
                const topic = kafkaSettings?.topic || 'default-topic';

                lines.push(`# Kafka Configuration for ${destination.destinationName}`);
                lines.push(`spring.kafka.${destName}.bootstrap-servers=${bootstrapServers}`);
                lines.push(`spring.kafka.${destName}.consumer.group-id=${groupId}`);
                lines.push(`spring.kafka.${destName}.client-id=${clientId}`);
                lines.push(`spring.kafka.${destName}.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer`);
                lines.push(`spring.kafka.${destName}.producer.value-serializer=org.apache.kafka.common.serialization.StringSerializer`);
                lines.push(`spring.kafka.${destName}.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer`);
                lines.push(`spring.kafka.${destName}.consumer.value-deserializer=org.apache.kafka.common.serialization.StringDeserializer`);
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
        const javaFiles = await fs.readdir(path.join(basePath, 'src', 'main', 'java'), { recursive: true });
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
            commandName: source.command?.name || source.name || 'DEFAULT_COMMAND',
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
                commandName: source.command?.name || source.name || 'DEFAULT_COMMAND',
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
    outputDir: string
): Promise<void> {
    const { modules, sources, destinations, mainPackage } = generatedProjectInfo;
    const basePackage = mainPackage;

    const javaBaseDir = path.join(outputDir, 'src', 'main', 'java', ...basePackage.split('.'));
    const resourcesDir = path.join(outputDir, 'src', 'main', 'resources');
    const configDir = path.join(javaBaseDir, 'config');

    await fs.mkdir(javaBaseDir, { recursive: true });
    await fs.mkdir(resourcesDir, { recursive: true });
    await fs.mkdir(configDir, { recursive: true });

    // Генерация application.properties
    const applicationPropertiesPath = path.join(resourcesDir, 'application.properties');
    const applicationPropertiesContent = generateApplicationProperties(project, sources, destinations);
    await fs.writeFile(applicationPropertiesPath, applicationPropertiesContent, 'utf-8');

    // Генерация конфигурационных классов для каждого типа приёмника
    const configClasses = generateConfigurationClasses(destinations, basePackage);
    for (const [fileName, content] of Object.entries(configClasses)) {
        const configPath = path.join(configDir, fileName);
        await fs.writeFile(configPath, content, 'utf-8');
    }

    // Генерация классов для приёмников
    const destinationPromises = destinations.map(destination => {
        const destinationPath = path.join(javaBaseDir, destination.className + '.java');
        return fs.writeFile(destinationPath, generateDestinationClass(destination, basePackage), 'utf-8');
    });

    await Promise.all(destinationPromises);

    // Генерация сервисных классов модулей
    const modulePromises = modules.flatMap(module => [
        (function() {
            const serviceClassName = generateJavaClassNameFromId(module.id) + 'Service';
            const servicePath = path.join(javaBaseDir, serviceClassName + '.java');
            return fs.writeFile(servicePath, generateModuleServiceClass(module, basePackage), 'utf-8');
        })()
    ]);

    await Promise.all(modulePromises);
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
        const host = pgSettings?.host || 'localhost';
        const port = pgSettings?.port || 5432;
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
        const kafkaSettings = dest.kafka;
        const bootstrapServers = kafkaSettings?.bootstrapServers || 'localhost:9092';

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

function generateModuleServiceClass(module: ModuleInfo, basePackage: string): string {
    const className = generateJavaClassNameFromId(module.id) + 'Service';
    const packageDeclaration = `package ${basePackage};\n`;

    const imports = new Set<string>();
    imports.add('import org.springframework.stereotype.Service;');
    imports.add('import org.springframework.beans.factory.annotation.Qualifier;');

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

    let methods = '';

    module.sourceConnections.forEach(source => {
        const methodName = `processDataFrom${generateJavaClassNameFromId(source.id)}`;
        methods += `
    public void ${methodName}() {
        System.out.println("${source.commandName} - обработка данных от источника ${normalizeIdentifier(source.sourceName)}");
        // TODO: Реализовать логику обработки данных
    }
`;
    });

    module.destinationConnections.forEach(destination => {
        const methodName = `sendDataTo${generateJavaClassNameFromId(destination.id)}`;
        const clientField = `${normalizePropertyName(destination.destinationName.toLowerCase())}Client`;

        methods += `
    public void ${methodName}(String data) {
        ${clientField}.sendData(data);
    }
`;
    });

    return `${packageDeclaration}${importsStr}
@Service
public class ${className} {
${fields}
    
    public ${className}(${constructorParams}) {
${constructorAssignments}
    }
${methods}}
`;
}

function generateDestinationClass(destination: DestinationConnectionInfo, basePackage: string): string {
    const className = destination.className;
    const packageDeclaration = `package ${basePackage};\n`;
    const targetType = destination.targetType || 'UNKNOWN';
    const propertyName = normalizePropertyName(destination.destinationName);

    const beanName = `${propertyName}Client`;

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