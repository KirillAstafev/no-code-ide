import React from 'react';
import { Text, TextInput, Select } from '@gravity-ui/uikit';

interface DestinationConfigProps {
    destinationName: string;
    targetType: string;
    databaseName?: string;
    schemaName?: string;
    tableName?: string;
    columnName?: string;
    topic?: string;
    onUpdate: (settings: {
        targetType: string;
        databaseName?: string;
        schemaName?: string;
        tableName?: string;
        columnName?: string;
        topic?: string;
    }) => void;
}

export const DestinationConfig: React.FC<DestinationConfigProps> = ({
    destinationName,
    targetType,
    databaseName,
    schemaName,
    tableName,
    columnName,
    topic,
    onUpdate,
}) => {
    const handleTargetTypeChange = (value: string[]) => {
        const newType = value[0] as string;
        onUpdate({
            targetType: newType,
            databaseName: newType === 'POSTGRESQL' ? databaseName : undefined,
            schemaName: newType === 'POSTGRESQL' ? schemaName : undefined,
            tableName: newType === 'POSTGRESQL' ? tableName : undefined,
            columnName: newType === 'POSTGRESQL' ? columnName : undefined,
            topic: newType === 'KAFKA' ? topic : undefined,
        });
    };

    return (
        <div style={{ padding: '12px', borderBottom: '1px solid var(--g-color-line-generic)' }}>
            <Text variant="body-2" style={{ fontWeight: 500, marginBottom: '8px' }}>
                {destinationName}
            </Text>
            <Select
                value={[targetType]}
                options={[
                    { content: 'Не выбрано', value: '' },
                    { content: 'PostgreSQL', value: 'POSTGRESQL' },
                    { content: 'Kafka', value: 'KAFKA' },
                ]}
                onUpdate={handleTargetTypeChange}
                size="s"
            />
            {targetType === 'POSTGRESQL' && (
                <>
                    <TextInput
                        placeholder="Имя базы данных"
                        value={databaseName || ''}
                        onChange={(e: any) => onUpdate({ targetType, databaseName: e.target.value, schemaName, tableName, columnName, topic })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя схемы"
                        value={schemaName || ''}
                        onChange={(e: any) => onUpdate({ targetType, databaseName, schemaName: e.target.value, tableName, columnName, topic })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя таблицы"
                        value={tableName || ''}
                        onChange={(e: any) => onUpdate({ targetType, databaseName, schemaName, tableName: e.target.value, columnName, topic })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                    <TextInput
                        placeholder="Имя столбца"
                        value={columnName || ''}
                        onChange={(e: any) => onUpdate({ targetType, databaseName, schemaName, tableName, columnName: e.target.value, topic })}
                        size="s"
                        style={{ width: '100%', marginBottom: '8px' }}
                    />
                </>
            )}
            {targetType === 'KAFKA' && (
                <TextInput
                    placeholder="Имя темы (topic)"
                    value={topic || ''}
                    onChange={(e: any) => onUpdate({ targetType, databaseName, schemaName, tableName, columnName, topic: e.target.value })}
                    size="s"
                    style={{ width: '100%', marginBottom: '8px' }}
                />
            )}
        </div>
    );
};
