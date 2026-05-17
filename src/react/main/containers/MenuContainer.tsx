import { Button, DropdownMenu } from '@gravity-ui/uikit';
import { useState } from 'react';
import CreateProjectPage from '../../project-creation/pages/CreateProjectPage';
import {useProject} from "../../context/ProjectContext.tsx";
import {useWindow} from "../../context/WindowContext.tsx";

function MenuContainer() {
    const { loadProject, saveProject, clearProject, state } = useProject();
    const { state: windowState } = useWindow();
    const { isLoaded, isModified, project } = state;
    const { windowId } = windowState;
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

    const handleNewWindow = async () => {
        await window.electron.createWindow();
    };

    const handleCloseProject = () => {
        if (isModified) {
            const confirm = window.confirm('Проект не сохранён. Закрыть проект?');
            if (!confirm) return;
        }
        clearProject();
    };

    const handleCloseWindow = async () => {
        if (!windowId) return;
        if (isModified) {
            const confirm = window.confirm('Проект не сохранён. Закрыть окно?');
            if (!confirm) return;
        }
        window.electron.closeWindow(windowId);
    };

    return (
        <>
            <div style={{ padding: '4px 8px', display: 'flex', gap: '4px' }} id="menu-container">
                <DropdownMenu
                    switcher={
                        <Button view="flat" size="l">
                            Общие
                        </Button>
                    }
                    items={[
                        [
                            {
                                text: 'Новое окно',
                                action: handleNewWindow,
                            },
                            {
                                text: 'Новый проект',
                                action: () => {
                                    setIsNewProjectModalOpen(true);
                                }
                            },
                        ],
                        [
                            {
                                text: 'Открыть проект',
                                action: handleOpenProject
                            },
                            {
                                text: 'Сохранить проект',
                                disabled: !isLoaded,
                                action: handleSaveProject,
                            },
                        ],
                        [
                            {
                                text: 'Закрыть проект',
                                disabled: !isLoaded,
                                action: handleCloseProject
                            },
                            {
                                text: 'Закрыть окно',
                                action: handleCloseWindow
                            }
                        ],
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
