import React, {useEffect, useState} from 'react';
import {Alert, Button, Card, Checkbox, Modal, Text, TextInput} from '@gravity-ui/uikit';
import {useProject} from "../../context/ProjectContext.tsx";
import {availableDependencies as AVAILABLE_DEPENDENCIES} from '../../shared/availableDependencies';

interface ProjectConfigModalProps {
    open: boolean;
    onClose: () => void;
}

export const ProjectConfigPage: React.FC<ProjectConfigModalProps> = ({
    open,
    onClose,
}) => {
    const { state, updateProject } = useProject();
    const { project, isLoaded } = state;

    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (project) {
            setName(project.name);
            setLocation(project.location);
        }
    }, [project]);

    const [selectedDependencies, setSelectedDependencies] = useState<ExternalDependency[]>([]);
    const [dependenciesToDelete, setDependenciesToDelete] = useState<ExternalDependency[]>([]);

    useEffect(() => {
        if (project) {
            setSelectedDependencies(project.dependencies);
        }
    }, [project]);

    const validate = (): string | null => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            return 'Введите название проекта';
        }

        if (trimmedName.length < 2) {
            return 'Название должно быть не менее 2 символов';
        }

        if (trimmedName.length > 100) {
            return 'Название не должно превышать 100 символов';
        }

        return null;
    };

    const handleSave = () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (project) {
            let updatedDependencies = [...selectedDependencies];
            let updatedDestinations = [...(project.destinations || [])];
            
            dependenciesToDelete.forEach(dep => {
                updatedDependencies = updatedDependencies.filter(d => d.dependencyCode !== dep.dependencyCode);
                updatedDestinations = updatedDestinations.filter(dest => {
                    return !Object.keys(dest.dependency).includes(dep.dependencyCode);
                });
            });

            updateProject({
                name: name.trim(),
                location: location.trim(),
                dependencies: updatedDependencies,
                destinations: updatedDestinations,
            });
            
            setDependenciesToDelete([]);
        }

        onClose();
    };

    const handleReset = () => {
        if (project) {
            setName(project.name);
            setLocation(project.location);
            setError(null);
            setSelectedDependencies(project.dependencies);
            setDependenciesToDelete([]);
        }
    };

    if (!isLoaded || !project) {
        return null;
    }

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ padding: '20px', width: '600px', maxWidth: '90vw' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="header-2">Конфигурация проекта</Text>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Text variant="subheader-1" style={{ marginTop: '16px', marginBottom: '12px' }}>
                        Основная информация
                    </Text>

                    <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            Название проекта
                        </Text>
                        <TextInput
                            value={name}
                            onUpdate={setName}
                            hasClear
                            style={{ marginTop: '8px', width: '100%' }}
                            size="l"
                        />
                    </div>

                    <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                        <Text variant="body-2" style={{ marginBottom: '6px' }}>
                            Расположение на диске
                        </Text>
                        <TextInput
                            value={location}
                            onUpdate={setLocation}
                            hasClear
                            style={{ marginTop: '8px', width: '100%' }}
                            size="l"
                            disabled
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

                <div style={{ marginBottom: '20px' }}>
                    <Text variant="subheader-1" style={{ marginBottom: '12px' }}>
                        Библиотеки проекта
                    </Text>
                    <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                        <div style={{
                            maxHeight: '350px',
                            overflowY: 'auto',
                            padding: '8px',
                            border: '1px solid var(--g-color-line-generic)',
                            borderRadius: 'var(--g-border-radius-m)',
                            background: 'var(--g-color-base-background)',
                            marginTop: '4px'
                        }}>
                            {AVAILABLE_DEPENDENCIES.map((dep) => (
                                <div key={dep.dependencyCode} style={{ marginBottom: '8px' }}>
                                    <Checkbox
                                        checked={selectedDependencies.some(d => d.dependencyCode === dep.dependencyCode)}
                                        onUpdate={() => {
                                        const isSelected = selectedDependencies.some(d => d.dependencyCode === dep.dependencyCode);
                                        if (isSelected) {
                                            const dependentDestinations = project.destinations?.filter(dest => {
                                                return dest.dependency?.dependencyCode === dep.dependencyCode;
                                            }) || [];

                                            if (dependentDestinations.length > 0) {
                                                const confirmRemove = window.confirm(
                                                    `Библиотека "${dep.name}" используется приёмниками данных: ` +
                                                    `${dependentDestinations.map(d => d.name).join(', ')}. ` +
                                                    `При удалении библиотеки эти приёмники будут удалены. Продолжить?`
                                                );
                                                if (confirmRemove) {
                                                    setDependenciesToDelete([...dependenciesToDelete, dep]);
                                                    setSelectedDependencies(selectedDependencies.filter(d => d.dependencyCode !== dep.dependencyCode));
                                                }
                                            } else {
                                                setSelectedDependencies(selectedDependencies.filter(d => d.dependencyCode !== dep.dependencyCode));
                                            }
                                        } else {
                                            setSelectedDependencies([...selectedDependencies, dep]);
                                        }
                                    }}
                                    style={{ marginBottom: '0' }}
                                >
                                    <div>
                                        <div>{dep.name}</div>
                                        <Text variant="caption-2" color="secondary">
                                            {dep.description}
                                        </Text>
                                    </div>
                                </Checkbox>
                            </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <Text variant="subheader-2">Добавленные зависимости:</Text>
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            borderRadius: 'var(--g-border-radius-m)',
                            background: 'var(--g-color-base-misc-light)',
                        }}>
                            {selectedDependencies.length === 0 ? (
                                <Text variant="body-1" color="secondary" style={{ padding: '8px' }}>
                                    Нет добавленных библиотек
                                </Text>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px',
                                }}>
                                    {selectedDependencies.map((dep) => (
                                        <Card key={dep.name} view="outlined" style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '4px 8px',
                                            borderRadius: 'var(--g-border-radius-m)',
                                            background: 'var(--g-color-base-background)',
                                        }}>
                                            <span>{dep.name}</span>
                                            <Button
                                                view="flat"
                                                size="xs"
                                                onClick={() => setSelectedDependencies(selectedDependencies.filter(d => d.dependencyCode !== dep.dependencyCode))}
                                                style={{ marginLeft: '4px' }}
                                            >
                                                ×
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
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
                        Закрыть
                    </Button>
                    <Button view="normal" size="m" onClick={handleReset}>
                        Сбросить
                    </Button>
                    <Button
                        view="action"
                        size="m"
                        onClick={handleSave}
                    >
                        Сохранить
                    </Button>
                </div>
            </div>
        </Modal>
    );
};