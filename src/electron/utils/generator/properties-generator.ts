import {normalizePropertyName} from "./shared.js";

export function generateApplicationProperties(
    project: Project,
    sources: DataSourceInfo[],
    destinations: DestinationConnectionInfo[]
): string {
    const lines: string[] = [];

    if (sources.length > 0) {
        sources.forEach((source) => {
            const sourceName = normalizePropertyName(source.name);
            lines.push(`app.sources.${sourceName}.name=${source.name}`);
            lines.push(`app.sources.${sourceName}.ipAddress=${source.ipAddress}`);
            lines.push(`app.sources.${sourceName}.tcpPort=${source.tcpPort}`);
            lines.push(`app.sources.${sourceName}.commandName=${source.commandName}`);

            if (source.commandParams && Object.keys(source.commandParams).length > 0) {
                Object.entries(source.commandParams).forEach(([key, value]) => {
                    lines.push(`app.sources.${sourceName}.${key.toLowerCase()}=${value}`);
                });
            }

            lines.push(`app.sources.${sourceName}.userPassword=`);
            lines.push(`app.sources.${sourceName}.accessPassword=`);
            lines.push('');
        });
    }

    if (destinations.length > 0) {
        destinations.forEach((destination) => {
            const destName = normalizePropertyName(destination.destinationName);

            if (destination.targetType === 'POSTGRESQL') {
                const pgSettings = destination.postgresql;
                const urlParts = destination.destinationUrl.split(':');
                const host = urlParts[0] || 'localhost';
                const port = parseInt(urlParts[1]) || 5432;
                const database = pgSettings?.databaseName || 'postgres';
                const username = pgSettings?.username || 'postgres';
                const password = pgSettings?.password || '';
                const schemaName = pgSettings?.schemaName || 'public';
                const tableName = pgSettings?.tableName || 'your_table';
                const columnName = pgSettings?.columnName || 'data_column';

                lines.push(`# PostgreSQL Configuration for ${destination.destinationName}`);
                lines.push(`app.postgresql.${destName}.host=${host}`);
                lines.push(`app.postgresql.${destName}.port=${port}`);
                lines.push(`app.postgresql.${destName}.database=${database}`);
                lines.push(`app.postgresql.${destName}.username=${username}`);
                lines.push(`app.postgresql.${destName}.password=${password}`);
                lines.push(`app.postgresql.${destName}.schema=${schemaName}`);
                lines.push(`app.postgresql.${destName}.table=${tableName}`);
                lines.push(`app.postgresql.${destName}.column=${columnName}`);
                lines.push('');

            } else if (destination.targetType === 'KAFKA') {
                const kafkaSettings = destination.kafka;
                const topic = kafkaSettings?.topic || 'default-topic';
                const bootstrapServers = destination.destinationUrl || 'localhost:9092';

                lines.push(`# Kafka Configuration for ${destination.destinationName}`);
                lines.push(`app.kafka.${destName}.bootstrap-servers=${bootstrapServers}`);
                lines.push(`app.kafka.${destName}.topic=${topic}`);
                lines.push('');

            } else if (destination.targetType === 'RABBITMQ') {
                const urlParts = destination.destinationUrl.split(':');
                const host = urlParts[0] || 'localhost';
                const port = urlParts[1] ? parseInt(urlParts[1]) : 5672;
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
                const port = urlParts[1] ? parseInt(urlParts[1]) : 6379;
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
                const port = 9042;

                lines.push(`# Cassandra Configuration for ${destination.destinationName}`);
                lines.push(`spring.data.cassandra.${destName}.contact-points=${contactPoints.join(',')}`);
                lines.push(`spring.data.cassandra.${destName}.port=${port}`);
                lines.push(`spring.data.cassandra.${destName}.keyspace=${keyspace}`);
                lines.push(`app.cassandra.${destName}.table=${table}`);
                lines.push('');
            }
        });
    }

    lines.push('\nspring.main.show-banner=false');
    lines.push('\nlogging.level.root=error');

    return lines.join('\n');
}