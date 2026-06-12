import React, {useState} from 'react';
import { Modal, Text, TextInput, Button } from '@gravity-ui/uikit';

interface AddDestinationPageProps {
    open: boolean;
    onClose: () => void;
    onAdd: (name: string, url: string, dependency: ExternalDependency) => void;
    dependency: ExternalDependency;
}

export const AddDestinationPage: React.FC<AddDestinationPageProps> = ({
    open,
    onClose,
    onAdd,
    dependency,
}) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [errors, setErrors] = useState<{name?: string; url?: string}>({});

    const validateField = (field: string, value: string): string | null => {
        switch (field) {
            case 'name':
                const trimmed = value.trim();
                if (!trimmed) {
                    return 'Введите название приёмника';
                }
                if (trimmed.length < 2) {
                    return 'Название должно быть не менее 2 символов';
                }
                if (trimmed.length > 50) {
                    return 'Название не должно превышать 50 символов';
                }
                if (!/^[a-zA-Z]+$/.test(trimmed)) {
                    return 'Название должно содержать только латинские буквы';
                }
                return null;
            case 'url':
                if (!value) {
                    return 'Введите URL подключения';
                }
                return null;
            default:
                return null;
        }
    };

    const handleAdd = () => {
        const nameError = validateField('name', name);
        const urlError = validateField('url', url);
        
        const newErrors = {
            name: nameError || undefined,
            url: urlError || undefined,
        };
        
        setErrors(newErrors);
        
        if (nameError || urlError) {
            return;
        }

        onAdd(name.trim(), url, dependency);
        setName('');
        setUrl('');
        setErrors({});
        onClose();
    };

    const handleNameChange = (value: string) => {
        setName(value);
        setErrors({});
    };

    const handleUrlChange = (value: string) => {
        setUrl(value);
        setErrors({});
    };

    const isSaveEnabled = Object.keys(errors).length === 0;

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="header-2">Добавить приёмник данных</Text>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            Название приёмника
                        </Text>
                        <TextInput
                            value={name}
                            onUpdate={handleNameChange}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop:'12px' }}
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
                            URL подключения
                        </Text>
                        <TextInput
                            value={url}
                            onUpdate={handleUrlChange}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px' }}
                            size="l"
                            placeholder="http://localhost:5432"
                        />
                        {errors.url && (
                            <Text variant="caption-1" color="danger" style={{ marginTop: '4px' }}>
                                {errors.url}
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
