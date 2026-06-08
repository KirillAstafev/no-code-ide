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

export const ModuleConnectionsModal: React.FC<ModuleConnectionsModalProps> = ({
    open,
    onClose,
    onConfirm,
    module,
    availableSources,
    availableDestinations,
}) => {
    const [selectedSourceIds, setSelectedSourceIds] = React.useState<string[]>(module.sources?.map(s => s.name) || []);
    const [selectedDestinationIds, setSelectedDestinationIds] = React.useState<string[]>(module.destinations?.map(d => d.name) || []);
    const [error, setError] = React.useState<string | null>(null);

    const availableSourceItems = availableSources.map(source => ({
        content: source.name,
        value: source.name,
        title: `${source.name} (${source.ipAddress}:${source.tcpPort})`
    }));

    const availableDestinationItems = availableDestinations.map(destination => ({
        content: destination.name,
        value: destination.name,
        title: `${destination.name} (${destination.url})`
    }));

    const handleConfirm = () => {
        if (selectedSourceIds.length === 0 && selectedDestinationIds.length === 0) {
            setError('Модуль должен быть связан хотя бы с одним источником или приёмником');
            return;
        }

        onConfirm(selectedSourceIds, selectedDestinationIds);
        setError(null);
    };

    return (
        <Modal open={open} onClose={onClose} aria-label="Редактирование связей модуля">
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="header-2">Редактирование связей модуля "{module.name}"</Text>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Text variant="body-2" style={{ marginBottom: '12px' }}>
                        Доступные источники данных
                    </Text>
                    <Select
                        value={selectedSourceIds}
                        options={availableSourceItems}
                        onUpdate={(values) => setSelectedSourceIds(values as string[])}
                        placeholder="Выберите источники"
                        size="l"
                        multiple
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Text variant="body-2" style={{ marginBottom: '12px' }}>
                        Доступные приёмники данных
                    </Text>
                    <Select
                        value={selectedDestinationIds}
                        options={availableDestinationItems}
                        onUpdate={(values) => setSelectedDestinationIds(values as string[])}
                        placeholder="Выберите приёмники"
                        size="l"
                        multiple
                    />
                </div>

                {error && (
                    <Alert
                        theme="danger"
                        message={error}
                        style={{ marginBottom: '12px' }}
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
                        disabled={selectedSourceIds.length === 0 && selectedDestinationIds.length === 0}
                    >
                        Сохранить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
