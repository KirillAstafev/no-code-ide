import React, {useState} from 'react';
import { Modal, Text, TextInput, Button, Alert } from '@gravity-ui/uikit';
import {useProject} from "../../context/ProjectContext.tsx";

interface AddSourcePageProps {
    open: boolean;
    onClose: () => void;
    onAdd: (source: DataSource) => void;
}

export const AddSourcePage: React.FC<AddSourcePageProps> = ({
    open,
    onClose,
    onAdd,
}) => {
    const { state } = useProject();
    const { project } = state;

    const [name, setName] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    const [tcpPort, setTcpPort] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validate = (): string | null => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            return 'Введите название источника';
        }

        if (trimmedName.length < 2) {
            return 'Название должно быть не менее 2 символов';
        }

        if (trimmedName.length > 50) {
            return 'Название не должно превышать 50 символов';
        }

        if (!/^[a-zA-Zа-яА-Я0-9_\-]+$/.test(trimmedName)) {
            return 'Название может содержать только буквы, цифры, _, -';
        }

        if (project?.sources?.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
            return 'Источник с таким именем уже существует';
        }

        if (!ipAddress) {
            return 'Введите IP-адрес';
        }

        // Простая валидация IP-адреса
        if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipAddress)) {
            return 'Введите корректный IP-адрес';
        }

        if (!tcpPort) {
            return 'Введите TCP-порт';
        }

        const portNum = parseInt(tcpPort, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            return 'Введите корректный TCP-порт (1-65535)';
        }

        return null;
    };

    const handleAdd = () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        onAdd({
            name: name.trim(),
            url: `http://${ipAddress}:${tcpPort}`
        });
        setName('');
        setIpAddress('');
        setTcpPort('');
        setError(null);
        onClose();
    };

    const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (value: string) => {
        setter(value);
        if (error) {
            const newError = validate();
            setError(newError);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="header-2">Добавить источник данных (ККТ)</Text>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            Название источника
                        </Text>
                        <TextInput
                            value={name}
                            onUpdate={handleChange(setName)}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop: '12px' }}
                            autoFocus
                            size="l"
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            IP-адрес
                        </Text>
                        <TextInput
                            value={ipAddress}
                            onUpdate={handleChange(setIpAddress)}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop: '12px' }}
                            size="l"
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            TCP-порт
                        </Text>
                        <TextInput
                            value={tcpPort}
                            onUpdate={handleChange(setTcpPort)}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop: '12px' }}
                            size="l"
                            type="number"
                        />
                    </div>

                    {error && (
                        <Alert
                            theme="danger"
                            message={error}
                            style={{ marginBottom: '12px' }}
                        />
                    )}
                </div>

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
                        onClick={handleAdd}
                        disabled={!!error || !name.trim() || !ipAddress || !tcpPort}
                    >
                        Добавить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};