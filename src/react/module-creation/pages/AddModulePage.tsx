import React, {useState} from 'react';
import { Modal, Text, TextInput, Button } from '@gravity-ui/uikit';

interface AddModulePageProps {
    open: boolean;
    onClose: () => void;
    onAdd: (name: string) => void;
    existingModuleNames: string[];
}

export const AddModulePage: React.FC<AddModulePageProps> = ({
    open,
    onClose,
    onAdd,
    existingModuleNames,
}) => {
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validate = (value: string): string | null => {
        const trimmed = value.trim();

        if (!trimmed) {
            return 'Введите название модуля';
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

        if (existingModuleNames.map((n) => n.toLowerCase()).includes(trimmed.toLowerCase())) {
            return 'Модуль с таким именем уже существует';
        }

        return null;
    };

    const handleAdd = () => {
        const validationError = validate(name);
        if (validationError) {
            setError(validationError);
            return;
        }

        onAdd(name.trim());
        setName('');
        setError(null);
        onClose();
    };

    const handleNameChange = (value: string) => {
        setName(value);
        setError(null);
    };

    const isSaveEnabled = name.trim() !== '' && !error;

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="header-2">Добавить модуль</Text>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Text variant="body-1" style={{ marginBottom: '12px' }}>
                        Введите название нового модуля
                    </Text>

                    <TextInput
                        value={name}
                        onUpdate={handleNameChange}
                        hasClear
                        style={{ width: '100%', marginTop: '12px', marginBottom: '12px' }}
                        autoFocus
                        size="l"
                    />
                    {error && (
                        <Text variant="caption-1" color="danger" style={{ marginTop: '4px' }}>
                            {error}
                        </Text>
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
                        disabled={!isSaveEnabled}
                    >
                        Добавить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
