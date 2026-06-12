import React from 'react';
import { TextInput } from '@gravity-ui/uikit';

interface DestinationConfigProps {
    targetType: string;
    postgresql?: DestinationPostgresqlSettings;
    kafka?: DestinationKafkaSettings;
    rabbitmq?: DestinationRabbitmqSettings;
    redis?: DestinationRedisSettings;
    cassandra?: DestinationCassandraSettings;
    onUpdate: (settings: {
        targetType: string;
        postgresql?: DestinationPostgresqlSettings;
        kafka?: DestinationKafkaSettings;
        rabbitmq?: DestinationRabbitmqSettings;
        redis?: DestinationRedisSettings;
        cassandra?: DestinationCassandraSettings;
    }) => void;
}

interface DestinationPostgresqlSettings {
    databaseName?: string;
    schemaName?: string;
    tableName?: string;
    columnName?: string;
    username?: string;
    password?: string;
}

interface DestinationKafkaSettings {
    topic?: string;
}

interface DestinationRabbitmqSettings {
    queueName?: string;
    exchangeName?: string;
    routingKey?: string;
}

interface DestinationRedisSettings {
    key?: string;
    ttl?: number;
}

interface DestinationCassandraSettings {
    keyspace?: string;
    table?: string;
    partitionKey?: string;
}

export const DestinationConfig: React.FC<DestinationConfigProps> = ({
    targetType,
    postgresql,
    kafka,
    rabbitmq,
    redis,
    cassandra,
    onUpdate,
}) => {
    const isPostgreSQL = targetType === 'POSTGRESQL';
    const isKafka = targetType === 'KAFKA';
    const isRabbitMQ = targetType === 'RABBITMQ';
    const isRedis = targetType === 'REDIS';
    const isCassandra = targetType === 'CASSANDRA';

    return (
        <div style={{ padding: '12px', borderBottom: '1px solid var(--g-color-line-generic)' }}>
            {isPostgreSQL && (
                <>
                    <TextInput
                        placeholder="Имя базы данных"
                        value={postgresql?.databaseName || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql: { ...postgresql, databaseName: e.target.value }, kafka, rabbitmq, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя схемы"
                        value={postgresql?.schemaName || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql: { ...postgresql, schemaName: e.target.value }, kafka, rabbitmq, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя таблицы"
                        value={postgresql?.tableName || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql: { ...postgresql, tableName: e.target.value }, kafka, rabbitmq, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя столбца"
                        value={postgresql?.columnName || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql: { ...postgresql, columnName: e.target.value }, kafka, rabbitmq, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя пользователя"
                        value={postgresql?.username || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql: { ...postgresql, username: e.target.value }, kafka, rabbitmq, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Пароль"
                        type="password"
                        value={postgresql?.password || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql: { ...postgresql, password: e.target.value }, kafka, rabbitmq, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                </>
            )}
            {isKafka && (
                <TextInput
                    placeholder="Имя темы (topic)"
                    value={kafka?.topic || ''}
                    onChange={(e: any) => onUpdate({ targetType, postgresql, kafka: { ...kafka, topic: e.target.value }, rabbitmq, redis, cassandra })}
                    size="s"
                    style={{ width: '100%', marginBottom: '8px' }}
                />
            )}
            {isRabbitMQ && (
                <>
                    <TextInput
                        placeholder="Имя очереди (queue)"
                        value={rabbitmq?.queueName || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql, kafka, rabbitmq: { ...rabbitmq, queueName: e.target.value }, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя exchange"
                        value={rabbitmq?.exchangeName || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql, kafka, rabbitmq: { ...rabbitmq, exchangeName: e.target.value }, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Ключ маршрутизации (routing key)"
                        value={rabbitmq?.routingKey || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql, kafka, rabbitmq: { ...rabbitmq, routingKey: e.target.value }, redis, cassandra })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                </>
            )}
            {isRedis && (
                <TextInput
                    placeholder="Ключ"
                    value={redis?.key || ''}
                    onChange={(e: any) => onUpdate({ targetType, postgresql, kafka, rabbitmq, redis: { ...redis, key: e.target.value }, cassandra })}
                    size="s"
                    style={{ width: '100%', marginBottom: '8px' }}
                />
            )}
            {isCassandra && (
                <>
                    <TextInput
                        placeholder="Keyspace"
                        value={cassandra?.keyspace || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql, kafka, rabbitmq, redis, cassandra: { ...cassandra, keyspace: e.target.value } })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Таблица"
                        value={cassandra?.table || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql, kafka, rabbitmq, redis, cassandra: { ...cassandra, table: e.target.value } })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Ключ партиции"
                        value={cassandra?.partitionKey || ''}
                        onChange={(e: any) => onUpdate({ targetType, postgresql, kafka, rabbitmq, redis, cassandra: { ...cassandra, partitionKey: e.target.value } })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                </>
            )}
        </div>
    );
};
