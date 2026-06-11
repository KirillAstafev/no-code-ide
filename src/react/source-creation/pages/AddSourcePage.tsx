import React, {useState} from 'react';
import { Modal, Text, TextInput, Button } from '@gravity-ui/uikit';
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
    const [errors, setErrors] = useState<{name?: string; ipAddress?: string; tcpPort?: string}>({});

    const validateField = (field: string, value: string): string | null => {
        switch (field) {
            case 'name':
                const trimmedName = value.trim();
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
                return null;
            case 'ipAddress':
                if (!value) {
                    return 'Введите IP-адрес';
                }
                if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value)) {
                    return 'Введите корректный IP-адрес';
                }
                return null;
            case 'tcpPort':
                if (!value) {
                    return 'Введите TCP-порт';
                }
                const portNum = parseInt(value, 10);
                if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
                    return 'Введите корректный TCP-порт (1-65535)';
                }
                return null;
            default:
                return null;
        }
    };

    const handleAdd = () => {
        const nameError = validateField('name', name);
        const ipAddressError = validateField('ipAddress', ipAddress);
        const tcpPortError = validateField('tcpPort', tcpPort);
        
        const newErrors = {
            name: nameError || undefined,
            ipAddress: ipAddressError || undefined,
            tcpPort: tcpPortError || undefined,
        };
        
        setErrors(newErrors);
        
        if (nameError || ipAddressError || tcpPortError) {
            return;
        }

        onAdd({
            name: name.trim(),
            ipAddress: ipAddress,
            tcpPort: parseInt(tcpPort, 10)
        });
        setName('');
        setIpAddress('');
        setTcpPort('');
        setErrors({});
        onClose();
    };

    const handleNameChange = (value: string) => {
        setName(value);
        setErrors({});
    };

    const handleIpAddressChange = (value: string) => {
        setIpAddress(value);
        setErrors({});
    };

    const handleTcpPortChange = (value: string) => {
        setTcpPort(value);
        setErrors({});
    };

    const isSaveEnabled = Object.keys(errors).length === 0;

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
                            onUpdate={handleNameChange}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop: '12px' }}
                            autoFocus
                            size="l"
                        />
                        {errors.name && (
                            <Text variant="caption-1" color="danger" style={{ marginTop: '4px' }}>
                                {errors.name}
                            </Text>
                        )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            IP-адрес
                        </Text>
                        <TextInput
                            value={ipAddress}
                            onUpdate={handleIpAddressChange}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop: '12px' }}
                            size="l"
                        />
                        {errors.ipAddress && (
                            <Text variant="caption-1" color="danger" style={{ marginTop: '4px' }}>
                                {errors.ipAddress}
                            </Text>
                        )}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            TCP-порт
                        </Text>
                        <TextInput
                            value={tcpPort}
                            onUpdate={handleTcpPortChange}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop: '12px' }}
                            size="l"
                            type="number"
                        />
                        {errors.tcpPort && (
                            <Text variant="caption-1" color="danger" style={{ marginTop: '4px' }}>
                                {errors.tcpPort}
                            </Text>
                        )}
                    </div>
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
                        disabled={!isSaveEnabled}
                    >
                        Добавить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
