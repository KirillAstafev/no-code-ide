import React from 'react';
import { Text, TextInput } from '@gravity-ui/uikit';

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
    return (
        <div style={{ padding: '12px', borderBottom: '1px solid var(--g-color-line-generic)' }}>
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
