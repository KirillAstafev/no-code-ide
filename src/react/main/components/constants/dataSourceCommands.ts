export const DATA_SOURCE_COMMANDS: DataSourceCommand[] = [
    {
        name: 'READ_DATA',
        description: 'Периодическое чтение данных с источника',
        parameters: [
            {
                name: 'pollingInterval',
                type: 'number',
                defaultValue: 1000
            },
            {
                name: 'maxRetries',
                type: 'number',
                defaultValue: 3
            },
            {
                name: 'timeout',
                type: 'number',
                defaultValue: 5000
            }
        ]
    },
    {
        name: 'STREAM_DATA',
        description: 'Потоковая передача данных из источника',
        parameters: [
            {
                name: 'bufferSize',
                type: 'number',
                defaultValue: 4096
            },
            {
                name: 'compression',
                type: 'boolean',
                defaultValue: false
            }
        ]
    }
];
