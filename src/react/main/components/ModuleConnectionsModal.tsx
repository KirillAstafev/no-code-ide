import React from 'react';
import { Modal, Text, Button, Alert, Select } from '@gravity-ui/uikit';
import { SourceCommandConfig } from './SourceCommandConfig';
import { DestinationConfig } from './DestinationConfig';
import { DATA_SOURCE_COMMANDS } from './constants/dataSourceCommands';

interface ModuleConnectionsModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (sourceConnections: SourceConnectionInfo[], destinationConnections: SelectedDestination[]) => void;
    module: Module;
    availableSources: DataSource[];
    availableDestinations: DataDestination[];
}

interface SourceConnectionInfo {
    sourceName: string;
    commandName: string;
    commandParams: Record<string, string | number | boolean>;
}

interface SourceConnection {
    source: DataSource;
    enabled: boolean;
    command: DataSourceCommand;
    commandParams: Record<string, string | number | boolean>;
}

interface DestinationConnection {
    destination: DataDestination;
    enabled: boolean;
    settings: DestinationSettings;
}

interface DestinationSettings {
    targetType: string;
    postgresql?: DestinationPostgresqlSettings;
    kafka?: DestinationKafkaSettings;
    rabbitmq?: DestinationRabbitmqSettings;
    redis?: DestinationRedisSettings;
    cassandra?: DestinationCassandraSettings;
}

interface DestinationPostgresqlSettings {
    databaseName?: string;
    schemaName?: string;
    tableName?: string;
    columnName?: string;
    host?: string;
    port?: number;
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

interface SelectedDestination {
    destinationName: string;
    settings: DestinationSettings;
}

// Конфигурация значений по умолчанию для разных типов команд
const DEFAULT_VALUES_CONFIG: Record<string, Record<string, string | number | boolean>> = {
    NEVA_: {
        connectionType: 'TCPIP',
        ipAddress: '192.168.1.100',
        ipPort: 7777,
        comPort: 'COM3',
        baudRate: 115200,
        model: 2,
        accessPassword: '',
        userPassword: '',
        operatorId: 1,
        receiptType: 'SELL',
        paymentType: 'CASH',
        documentType: 'RECEIPT',
        syncWithSystem: true
    },
    DEFAULT_: {
        pollingInterval: 1000,
        maxRetries: 3,
        timeout: 5000,
        bufferSize: 4096,
        compression: false
    }
};

// Типы значений по умолчанию в зависимости от типа параметра
const DEFAULT_BY_TYPE: Record<string, string | number | boolean> = {
    string: '',
    number: 0,
    boolean: false
};

export const ModuleConnectionsModal: React.FC<ModuleConnectionsModalProps> = ({
                                                                                  open,
                                                                                  onClose,
                                                                                  onConfirm,
                                                                                  module,
                                                                                  availableSources,
                                                                                  availableDestinations,
                                                                              }) => {
    const [sourceConnections, setSourceConnections] = React.useState<SourceConnection[]>([]);
    const [destinationConnections, setDestinationConnections] = React.useState<DestinationConnection[]>([]);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setSourceConnections(
                availableSources.map(source => {
                    const existingSource = module.sources?.find(s => s.name === source.name);
                    return {
                        source,
                        enabled: !!existingSource,
                        command: existingSource?.command || DATA_SOURCE_COMMANDS[0],
                        commandParams: existingSource?.commandParams || {}
                    };
                })
            );
            setDestinationConnections(
                availableDestinations.map(destination => ({
                    destination,
                    enabled: module.destinations?.some(d => d.name === destination.name) || false,
                    settings: {
                        targetType: destination.targetType || '',
                        postgresql: destination.postgresql || {},
                        kafka: destination.kafka || {},
                        rabbitmq: destination.rabbitmq || {},
                        redis: destination.redis || {},
                        cassandra: destination.cassandra || {},
                    }
                }))
            );
        }
    }, [open, availableSources, availableDestinations, module]);

    const getDefaultParamsForCommand = (command: DataSourceCommand): Record<string, string | number | boolean> => {
        const commandPrefix = command.name.split('_')[0] + '_';
        const defaultValues = DEFAULT_VALUES_CONFIG[commandPrefix] || DEFAULT_VALUES_CONFIG.DEFAULT_;

        const params: Record<string, string | number | boolean> = {};

        command.parameters.forEach(param => {
            if (defaultValues[param.name] !== undefined) {
                params[param.name] = defaultValues[param.name];
            } else if (param.defaultValue !== undefined) {
                params[param.name] = param.defaultValue;
            } else {
                params[param.name] = DEFAULT_BY_TYPE[param.type] ?? '';
            }
        });

        return params;
    };

    const handleSourceToggle = (sourceName: string, enabled: boolean) => {
        setSourceConnections(prev =>
            prev.map(sc => sc.source.name === sourceName ? { ...sc, enabled } : sc)
        );
    };

    const handleSourceCommandChange = (sourceName: string, commandName: string) => {
        const command = DATA_SOURCE_COMMANDS.find(c => c.name === commandName) || DATA_SOURCE_COMMANDS[0];
        const params = getDefaultParamsForCommand(command);

        setSourceConnections(prev =>
            prev.map(sc => sc.source.name === sourceName ? { ...sc, command, commandParams: params } : sc)
        );
    };

    const handleSourceParamChange = (sourceName: string, paramName: string, value: string | number | boolean) => {
        setSourceConnections(prev =>
            prev.map(sc =>
                sc.source.name === sourceName
                    ? { ...sc, commandParams: { ...sc.commandParams, [paramName]: value } }
                    : sc
            )
        );
    };

    const handleDestinationToggle = (destinationName: string, enabled: boolean) => {
        setDestinationConnections(prev =>
            prev.map(dc => dc.destination.name === destinationName ? { ...dc, enabled } : dc)
        );
    };

    const [editingDestination, setEditingDestination] = React.useState<DataDestination | null>(null);

    const handleDestinationClick = (destination: DataDestination) => {
        const existingConnection = destinationConnections.find(dc => dc.destination.name === destination.name);
        if (existingConnection) {
            setEditingDestination({
                ...destination,
                targetType: existingConnection.settings.targetType,
                postgresql: existingConnection.settings.postgresql || {},
                kafka: existingConnection.settings.kafka || {},
                rabbitmq: existingConnection.settings.rabbitmq || {},
                redis: existingConnection.settings.redis || {},
                cassandra: existingConnection.settings.cassandra || {},
            });
        } else {
            setEditingDestination({
                ...destination,
                targetType: '',
                postgresql: destination.postgresql || {},
                kafka: destination.kafka || {},
                rabbitmq: destination.rabbitmq || {},
                redis: destination.redis || {},
                cassandra: destination.cassandra || {},
            });
        }
    };

    const handleDestinationConfigConfirm = () => {
        if (editingDestination) {
            const destinationName = editingDestination.name;
            const settings: DestinationSettings = {
                targetType: editingDestination.targetType || '',
                postgresql: editingDestination.postgresql,
                kafka: editingDestination.kafka,
                rabbitmq: editingDestination.rabbitmq,
                redis: editingDestination.redis,
                cassandra: editingDestination.cassandra,
            };
            setDestinationConnections(prev =>
                prev.map(dc => dc.destination.name === destinationName ? { ...dc, settings } : dc)
            );
            setEditingDestination(null);
        }
    };

    const handleDestinationConfigCancel = () => {
        setEditingDestination(null);
    };

    const handleConfirm = () => {
        const selectedSourceConnections = sourceConnections
            .filter(sc => sc.enabled)
            .map(sc => ({
                sourceName: sc.source.name,
                commandName: sc.command.name,
                commandParams: sc.commandParams
            }));
        const selectedDestinations = destinationConnections
            .filter(dc => dc.enabled)
            .map(dc => ({
                destinationName: dc.destination.name,
                settings: dc.settings
            }));

        if (selectedSourceConnections.length === 0 && selectedDestinations.length === 0) {
            setError('Модуль должен быть связан хотя бы с одним источником или приёмником');
            return;
        }

        onConfirm(selectedSourceConnections, selectedDestinations);
        setError(null);
    };

    const renderSelectedDestinations = () => {
        const selected = destinationConnections.filter(dc => dc.enabled).map(dc => dc.destination);
        return (
            selected.map(destination => {
                const connection = destinationConnections.find(dc => dc.destination.name === destination.name);
                const settings = connection?.settings || { targetType: '' };
                const targetType = settings.targetType || 'UNKNOWN';
                return (
                    <div key={destination.name} style={{ padding: '8px', borderBottom: '1px solid var(--g-color-line-generic)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text variant="body-2">{destination.name}</Text>
                            <Button size="s" onClick={() => handleDestinationClick(destination)}>
                                Настроить
                            </Button>
                        </div>
                        <Text variant="caption-1" color="secondary" style={{ fontSize: '12px' }}>
                            {destination.url} ({targetType})
                        </Text>
                    </div>
                );
            })
        );
    };

    return (
        <Modal open={open} onClose={onClose} aria-label="Редактирование связей модуля">
            <div style={{ padding: '20px', minWidth: '1200px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="header-2">Редактирование связей модуля "{module.name}"</Text>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '20px',
                    height: '500px'
                }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid var(--g-color-line-generic)',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--g-color-line-generic)',
                                backgroundColor: 'var(--g-color-surface-generic)'
                            }}>
                                <Text variant="body-2" style={{ fontWeight: 500 }}>Источники данных</Text>
                            </div>
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {availableSources.map(source => {
                                        const connection = sourceConnections.find(sc => sc.source.name === source.name);
                                        return (
                                            <div key={source.name} style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--g-color-line-generic)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div>
                                                    <Text variant="body-2">{source.name}</Text>
                                                    <Text variant="caption-1" color="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
                                                        {source.ipAddress}:{source.tcpPort}
                                                    </Text>
                                                </div>
                                                <Select
                                                    value={connection?.enabled ? ['enabled'] : ['disabled']}
                                                    options={[
                                                        { content: 'Подключён', value: 'enabled' },
                                                        { content: 'Отключён', value: 'disabled' }
                                                    ]}
                                                    onUpdate={(values) => handleSourceToggle(source.name, (values as string[])[0] === 'enabled')}
                                                    size="s"
                                                    multiple={false}
                                                />
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>

                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid var(--g-color-line-generic)',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--g-color-line-generic)',
                                backgroundColor: 'var(--g-color-surface-generic)'
                            }}>
                                <Text variant="body-2" style={{ fontWeight: 500 }}>Приёмники данных</Text>
                            </div>
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {availableDestinations.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                        <Text variant="body-2" color="secondary">Нет доступных приёмников</Text>
                                    </div>
                                ) : (
                                    availableDestinations.map(destination => {
                                        const connection = destinationConnections.find(dc => dc.destination.name === destination.name);
                                        return (
                                            <div key={destination.name} style={{
                                                padding: '12px 16px',
                                                borderBottom: '1px solid var(--g-color-line-generic)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <div>
                                                    <Text variant="body-2">{destination.name}</Text>
                                                    <Text variant="caption-1" color="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
                                                        {destination.url}
                                                    </Text>
                                                </div>
                                                <Select
                                                    value={connection?.enabled ? ['enabled'] : ['disabled']}
                                                    options={[
                                                        { content: 'Подключён', value: 'enabled' },
                                                        { content: 'Отключён', value: 'disabled' }
                                                    ]}
                                                    onUpdate={(values) => handleDestinationToggle(destination.name, (values as string[])[0] === 'enabled')}
                                                    size="s"
                                                    multiple={false}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid var(--g-color-line-generic)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '16px',
                            borderBottom: '1px solid var(--g-color-line-generic)',
                            backgroundColor: 'var(--g-color-surface-generic)'
                        }}>
                            <Text variant="body-2" style={{ fontWeight: 500 }}>Настройка подключения</Text>
                        </div>
                        <div style={{
                            flex: 1,
                            padding: '16px',
                            overflowY: 'auto'
                        }}>
                            <div style={{ marginBottom: '24px' }}>
                                <Text variant="body-2" style={{ fontWeight: 500, marginBottom: '12px' }}>
                                    Выбранные источники ({sourceConnections.filter(sc => sc.enabled).length})
                                </Text>
                                {sourceConnections.filter(sc => sc.enabled).map(sc => (
                                    <SourceCommandConfig
                                        key={sc.source.name}
                                        sourceName={sc.source.name}
                                        command={sc.command}
                                        commandParams={sc.commandParams}
                                        onCommandChange={(commandName) => handleSourceCommandChange(sc.source.name, commandName)}
                                        onParamChange={(paramName, value) => handleSourceParamChange(sc.source.name, paramName, value)}
                                    />
                                ))}
                                {sourceConnections.filter(sc => sc.enabled).length === 0 && (
                                    <Text variant="body-2" color="secondary">Нет выбранных источников</Text>
                                )}
                            </div>
                            <div>
                                <Text variant="body-2" style={{ fontWeight: 500, marginBottom: '12px' }}>
                                    Выбранные приёмники ({destinationConnections.filter(dc => dc.enabled).length})
                                </Text>
                                {renderSelectedDestinations()}
                            </div>
                        </div>
                    </div>
                </div>

                <Modal
                    open={!!editingDestination}
                    onClose={handleDestinationConfigCancel}
                    aria-label="Настройка приёмника"
                >
                    <div style={{ padding: '20px' }}>
                        {editingDestination && (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <Text variant="header-2">Настройка приёмника "{editingDestination.name}"</Text>
                                </div>
                                <DestinationConfig
                                    targetType={editingDestination?.targetType || ''}
                                    postgresql={editingDestination?.postgresql}
                                    kafka={editingDestination?.kafka}
                                    onUpdate={(settings) => setEditingDestination(prev => prev ? {
                                        ...prev,
                                        targetType: settings.targetType,
                                        postgresql: settings.postgresql,
                                        kafka: settings.kafka,
                                        rabbitmq: settings.rabbitmq || prev.rabbitmq || {},
                                        redis: settings.redis || prev.redis || {},
                                        cassandra: settings.cassandra || prev.cassandra || {},
                                    } as DataDestination | null : null)}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '10px',
                                        marginTop: '20px',
                                    }}
                                >
                                    <Button view="flat" size="m" onClick={handleDestinationConfigCancel}>
                                        Отмена
                                    </Button>
                                    <Button
                                        view="action"
                                        size="m"
                                        onClick={handleDestinationConfigConfirm}
                                    >
                                        Сохранить
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Modal>

                {error && (
                    <Alert
                        theme="danger"
                        message={error}
                        style={{ marginBottom: '20px' }}
                    />
                )}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        borderTop: '1px solid var(--g-color-line-generic)',
                        paddingTop: '16px',
                    }}
                >
                    <Button view="flat" size="m" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        view="action"
                        size="m"
                        onClick={handleConfirm}
                        disabled={
                            sourceConnections.filter(sc => sc.enabled).length === 0 &&
                            destinationConnections.filter(dc => dc.enabled).length === 0
                        }
                    >
                        Сохранить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};