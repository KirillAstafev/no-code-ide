export const availableDependencies: ExternalDependency[] = [
    {
        name: 'Apache Kafka',
        category: 'Обмен сообщениями',
        description: 'Потоковая обработка событий',
        dependencyCode: 'kafka'
    },
    {
        name: 'RabbitMQ',
        category: 'Обмен сообщениями',
        description: 'Параллельный и асинхронный обмен сообщениями',
        dependencyCode: 'amqp'
    },
    {
        name: 'PostgreSQL',
        category: 'SQL',
        description: 'Реляционная СУБД',
        dependencyCode: 'postgresql'
    },
    {
        name: 'Redis',
        category: 'NoSQL',
        description: 'In-memory СУБД',
        dependencyCode: 'data-redis'
    },
    {
        name: 'Cassandra',
        category: 'NoSQL',
        description: 'Кластеризованное хранилище данных',
        dependencyCode: 'data-cassandra'
    }
];
