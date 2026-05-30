import React, {useState} from 'react';
import { Modal, Text, TextInput, Button, Alert, Select } from '@gravity-ui/uikit';
import {useProject} from "../../context/ProjectContext.tsx";

interface AddDestinationPageProps {
    open: boolean;
    onClose: () => void;
    onAdd: (name: string, dependency: ExternalDependency, url: string) => void;
}

export const AddDestinationPage: React.FC<AddDestinationPageProps> = ({
    open,
    onClose,
    onAdd,
}) => {
    const { state } = useProject();
    const { project, isLoaded } = state;

    const [name, setName] = useState('');
    const [dependency, setDependency] = useState<ExternalDependency | null>(null);
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const availableDependencies = isLoaded ? project?.dependencies || [] : [];
    const dependencyItems = availableDependencies.map(dep => ({
        content: dep.name,
        value: dep.dependencyCode,
        title: `${dep.name} (${dep.category})`
    }));

    const validate = (): string | null => {
        const trimmed = name.trim();

        if (!trimmed) {
            return 'Введите название приёмника';
        }

        if (trimmed.length < 2) {
            return 'Название должно быть не менее 2 символов';
        }

        if (trimmed.length > 50) {
            return 'Название не должно превышать 50 символов';
        }

        if (!/^[a-zA-Zа-яА-Я0-9_-]+$/.test(trimmed)) {
            return 'Название может содержать только буквы, цифры, _, -';
        }

        if (project?.destinations?.some(d => d.name.toLowerCase() === trimmed.toLowerCase())) {
            return 'Приёмник с таким именем уже существует';
        }

        if (!dependency) {
            return 'Выберите зависимость для приёмника';
        }

        if (!url) {
            return 'Введите URL подключения';
        }

        return null;
    };

    const handleAdd = () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (dependency) {
            onAdd(name.trim(), dependency, url);
        }
        setName('');
        setDependency(null);
        setError(null);
        onClose();
    };

    const handleChange = (value: string) => {
        setName(value);
        if (error) {
            const newError = validate();
            setError(newError);
        }
    };

    const handleDependencyChange = (value: string[]) => {
        if (value.length > 0) {
            const selectedDep = availableDependencies.find(d => d.dependencyCode === value[0]);
            setDependency(selectedDep || null);
        } else {
            setDependency(null);
        }
        if (error) {
            const newError = validate();
            setError(newError);
        }
    };

    const handleUrlChange = (value: string) => {
        setUrl(value);
        if (error) {
            const newError = validate();
            setError(newError);
        }
    };

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
                            onUpdate={handleChange}
                            hasClear
                            style={{ width: '100%', marginBottom: '12px', marginTop:'12px' }}
                            autoFocus
                            size="l"
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px', marginRight: '8px' }}>
                            Зависимость
                        </Text>
                        <Select
                            value={dependency ? [dependency.dependencyCode] : []}
                            options={dependencyItems}
                            onUpdate={handleDependencyChange}
                            placeholder="Выберите зависимость"
                            size="l"
                        />
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
                        disabled={!!error || !name.trim() || !dependency || !url}
                    >
                        Добавить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};