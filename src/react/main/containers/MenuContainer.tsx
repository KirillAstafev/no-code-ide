import { Button, DropdownMenu } from '@gravity-ui/uikit';
import { useState } from 'react';
import CreateProjectPage from '../../project-creation/pages/CreateProjectPage';
import {useProject} from "../../context/ProjectContext.tsx";

function MenuContainer() {
    const { loadProject, saveProject, clearProject, state } = useProject();
    const { isLoaded, isModified, project } = state;
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    const handleOpenProject = async () => {
        const result = await window.electron.openProjectDialog();
        if (result.path) {
            const projectResult = await window.electron.loadProject(result.path);

            if (projectResult.success && projectResult.project) {
                loadProject(projectResult.project);
            } else {
                throw new Error(projectResult.error || 'Неизвестная ошибка загрузки');
            }
        }
    };

    const handleCreateProject = async (projectPath: string | undefined) => {
        const projectResult = await window.electron.loadProject(projectPath as string);

        if (projectResult.success && projectResult.project) {
            loadProject(projectResult.project);
            setIsNewProjectModalOpen(false);
        }
    }

    const handleSaveProject = async () => {
        try {
            await saveProject();
            alert('Проект успешно сохранён!');
        } catch (err) {
            alert(`Ошибка сохранения: ${err}`);
        }
    };

    const handleNewWindow = () => {
        window.electron.createWindow();
    };

    const handleCloseProject = () => {
        const confirm = window.confirm('Вы уверены, что хотите закрыть проект? Все несохранённые изменения будут потеряны.');
        if (confirm) {
            clearProject();
        }
    };

    return (
        <>
            <div style={{ padding: '4px 8px', display: 'flex', gap: '4px' }} id="menu-container">
                <DropdownMenu
                    switcher={
                        <Button view="flat" size="l">
                            Окно
                        </Button>
                    }
                    items={[
                        {
                            text: 'Новое окно',
                            action: handleNewWindow,
                        },
                        {
                            text: 'Закрыть',
                            action: () => {
                                window.electron.closeWindow();
                            }
                        }
                    ]}
                />

                <DropdownMenu
                    switcher={
                        <Button view="flat" size="l">
                            Проект
                            {isModified && (
                                <span
                                    style={{
                                        marginLeft: '6px',
                                        color: 'var(--g-color-text-warning)',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    •
                                </span>
                            )}
                        </Button>
                    }
                    items={[
                        {
                            text: 'Создать проект',
                            action: () => {
                                setIsNewProjectModalOpen(true);
                            }
                        },
                        {
                            text: 'Открыть проект',
                            action: handleOpenProject
                        },
                        {
                            text: 'Сохранить проект',
                            disabled: !isLoaded,
                            action: handleSaveProject,
                        },
                        {
                            text: 'Закрыть проект',
                            disabled: !isLoaded,
                            action: handleCloseProject
                        }
                    ]}
                />

                <DropdownMenu
                    switcher={
                        <Button view="flat" size="l">
                            Редактировать
                        </Button>
                    }
                    items={[
                        {
                            text: 'Добавить модуль',
                            disabled: !isLoaded,
                            action: () => {
                                console.log('Добавить модуль');
                            }
                        },
                        {
                            text: 'Добавить ККТ',
                            disabled: !isLoaded,
                            action: () => {
                                console.log('Добавить ККТ');
                            }
                        },
                        {
                            text: 'Добавить приёмник данных',
                            disabled: !isLoaded,
                            action: () => {
                                console.log('Добавить приёмник данных');
                            }
                        }
                    ]}
                />

                <DropdownMenu
                    switcher={
                        <Button view="flat" size="l">
                            Сборка
                        </Button>
                    }
                    items={[
                        {
                            text: 'Собрать проект',
                            disabled: !isLoaded,
                            action: () => {
                                console.log('Собрать проект');
                            }
                        }
                    ]}
                />
            </div>

            <CreateProjectPage
                open={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onCreate={handleCreateProject}
            />

            {isLoaded && (
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontSize: '12px',
                        color: isModified ? 'var(--g-color-text-warning)' : 'var(--g-color-text-secondary)',
                    }}
                >
                    {project?.name} {isModified ? '• Не сохранено' : '✓ Сохранено'}
                </div>
            )}
        </>
    );
}

export default MenuContainer;
