import React, {useState, useEffect} from 'react';
import {Button, Modal, Text, TextInput} from '@gravity-ui/uikit';
import {useProject} from "../context/ProjectContext.tsx";

interface TestSettingsPageProps {
    open: boolean;
    onClose: () => void;
}

const TestSettingsPage: React.FC<TestSettingsPageProps> = ({
                                                               open,
                                                               onClose,
                                                           }) => {
    const {state, updateProject} = useProject();
    const {project} = state;

    const [tempAddresses, setTempAddresses] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && project) {
            const addresses: Record<string, string> = {};

            project.sources?.forEach(source => {
                addresses[`${source.name}`] = project.testAddresses ? project.testAddresses[source.name] : '';
            });

            project.destinations?.forEach(destination => {
                addresses[`${destination.name}`] = project.testAddresses ? project.testAddresses[destination.name] : '';;
            });

            setTempAddresses(addresses);
        }
    }, [open, project]);

    const handleTestAddressChange = (key: string, value: string) => {
        const updatedAddresses = {
            ...tempAddresses,
            [key]: value
        };
        setTempAddresses(updatedAddresses);
    };

    const handleSave = async () => {
        updateProject({
            ...project,
            testAddresses: tempAddresses
        });
        onClose();
    };

    const styles = {
        modalContent: {
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column' as const,
        },
        header: {
            padding: '16px',
            borderBottom: '1px solid var(--g-color-line-generic)',
        },
        body: {
            padding: '16px',
            flex: 1,
            overflowY: 'auto' as const,
        },
        panel: {
            marginBottom: '24px',
            padding: '16px',
            border: '1px solid var(--g-color-line-generic)',
            borderRadius: '4px',
        },
        panelTitle: {
            marginTop: '0',
            marginBottom: '16px',
        },
        fieldRow: {
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: '8px',
            alignItems: 'center',
            marginTop: '8px',
        },
        footer: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px',
            borderTop: '1px solid var(--g-color-line-generic)',
            gap: '8px',
        },
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div style={styles.modalContent}>
                <div style={styles.header}>
                    <Text variant="header-2">Настройки теста</Text>
                </div>

                <div style={styles.body}>
                    {project ? (
                        <>
                            <div style={styles.panel}>
                                <Text variant="subheader-2" style={styles.panelTitle}>Источники данных</Text>
                                {project.sources?.map(source => (
                                    <div key={`source-${source.name}`} style={styles.fieldRow}>
                                        <Text variant="body-2">{source.name}</Text>
                                        <TextInput
                                            value={tempAddresses[`${source.name}`] || ''}
                                            size="m"
                                            placeholder="Тестовый адрес (хост/порт)"
                                            onUpdate={(value) => handleTestAddressChange(`${source.name}`, value)}
                                            style={{width: '100%'}}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div style={styles.panel}>
                                <Text variant="subheader-2" style={styles.panelTitle}>Приёмники данных</Text>
                                {project.destinations?.map(destination => (
                                    <div key={`destination-${destination.name}`} style={styles.fieldRow}>
                                        <Text variant="body-2">{destination.name}</Text>
                                        <TextInput
                                            value={tempAddresses[`${destination.name}`] || ''}
                                            size="m"
                                            placeholder="Тестовый адрес (хост/порт)"
                                            onUpdate={(value) => handleTestAddressChange(`${destination.name}`, value)}
                                            style={{width: '100%'}}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <Text variant="body-2">Для настройки теста откройте проект</Text>
                    )}
                </div>

                <div style={styles.footer}>
                    <Button view="flat" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button view="action" onClick={handleSave}>
                        Сохранить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TestSettingsPage;
