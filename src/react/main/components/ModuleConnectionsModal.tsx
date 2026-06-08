import React from 'react';
import { Modal, Text, Button, Alert, Select } from '@gravity-ui/uikit';

interface ModuleConnectionsModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (sourceIds: string[], destinationIds: string[]) => void;
    module: Module;
    availableSources: DataSource[];
    availableDestinations: DataDestination[];
}

interface SourceConnection {
    source: DataSource;
    enabled: boolean;
}

interface DestinationConnection {
    destination: DataDestination;
    enabled: boolean;
}

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
                availableSources.map(source => ({
                    source,
                    enabled: module.sources?.some(s => s.name === source.name) || false
                }))
            );
            setDestinationConnections(
                availableDestinations.map(destination => ({
                    destination,
                    enabled: module.destinations?.some(d => d.name === destination.name) || false
                }))
            );
        }
    }, [open, availableSources, availableDestinations, module]);

    const handleSourceToggle = (sourceName: string, enabled: boolean) => {
        setSourceConnections(prev =>
            prev.map(sc => sc.source.name === sourceName ? { ...sc, enabled } : sc)
        );
    };

    const handleDestinationToggle = (destinationName: string, enabled: boolean) => {
        setDestinationConnections(prev =>
            prev.map(dc => dc.destination.name === destinationName ? { ...dc, enabled } : dc)
        );
    };

    const handleConfirm = () => {
        const selectedSources = sourceConnections.filter(sc => sc.enabled).map(sc => sc.source.name);
        const selectedDestinations = destinationConnections.filter(dc => dc.enabled).map(dc => dc.destination.name);

        if (selectedSources.length === 0 && selectedDestinations.length === 0) {
            setError('Модуль должен быть связан хотя бы с одним источником или приёмником');
            return;
        }

        onConfirm(selectedSources, selectedDestinations);
        setError(null);
    };

    const SelectedSourcesList = () => {
        const selected = sourceConnections.filter(sc => sc.enabled).map(sc => sc.source);
        return (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {selected.length === 0 ? (
                    <Text variant="body-2" color="secondary">Нет выбранных источников</Text>
                ) : (
                    selected.map(source => (
                        <div key={source.name} style={{ padding: '8px', borderBottom: '1px solid var(--g-color-line-generic)' }}>
                            <Text variant="body-2">{source.name}</Text>
                            <Text variant="caption-1" color="secondary">
                                {source.ipAddress}:{source.tcpPort}
                            </Text>
                        </div>
                    ))
                )}
            </div>
        );
    };

    const SelectedDestinationsList = () => {
        const selected = destinationConnections.filter(dc => dc.enabled).map(dc => dc.destination);
        return (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {selected.length === 0 ? (
                    <Text variant="body-2" color="secondary">Нет выбранных приёмников</Text>
                ) : (
                    selected.map(destination => (
                        <div key={destination.name} style={{ padding: '8px', borderBottom: '1px solid var(--g-color-line-generic)' }}>
                            <Text variant="body-2">{destination.name}</Text>
                            <Text variant="caption-1" color="secondary">{destination.url}</Text>
                        </div>
                    ))
                )}
            </div>
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
                                {availableSources.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center' }}>
                                        <Text variant="body-2" color="secondary">Нет доступных источников</Text>
                                    </div>
                                ) : (
                                    availableSources.map(source => (
                                        <div key={source.name} style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--g-color-line-generic)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <Text variant="body-2">{source.name}</Text>
                                                <Text variant="caption-1" color="secondary">
                                                    {source.ipAddress}:{source.tcpPort}
                                                </Text>
                                            </div>
                                            <Select
                                                value={sourceConnections.find(sc => sc.source.name === source.name)?.enabled ? ['enabled'] : ['disabled']}
                                                options={[
                                                    { content: 'Подключить', value: 'enabled' },
                                                    { content: 'Отключить', value: 'disabled' }
                                                ]}
                                                onUpdate={(values) => handleSourceToggle(source.name, (values as string[])[0] === 'enabled')}
                                                size="s"
                                                multiple={false}
                                            />
                                        </div>
                                    ))
                                )}
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
                                    availableDestinations.map(destination => (
                                        <div key={destination.name} style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--g-color-line-generic)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div>
                                                <Text variant="body-2">{destination.name}</Text>
                                                <Text variant="caption-1" color="secondary">{destination.url}</Text>
                                            </div>
                                            <Select
                                                value={destinationConnections.find(dc => dc.destination.name === destination.name)?.enabled ? ['enabled'] : ['disabled']}
                                                options={[
                                                    { content: 'Подключить', value: 'enabled' },
                                                    { content: 'Отключить', value: 'disabled' }
                                                ]}
                                                onUpdate={(values) => handleDestinationToggle(destination.name, (values as string[])[0] === 'enabled')}
                                                size="s"
                                                multiple={false}
                                            />
                                        </div>
                                    ))
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
                                <SelectedSourcesList />
                            </div>
                            <div>
                                <Text variant="body-2" style={{ fontWeight: 500, marginBottom: '12px' }}>
                                    Выбранные приёмники ({destinationConnections.filter(dc => dc.enabled).length})
                                </Text>
                                <SelectedDestinationsList />
                            </div>
                        </div>
                    </div>
                </div>

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
