import { Button, DropdownMenu } from '@gravity-ui/uikit';
import { useState } from 'react';
import CreateProjectPage from '../../project-creation/pages/CreateProjectPage';
import {useProject} from "../../context/ProjectContext.tsx";

function MenuContainer() {
    const { loadProject, saveProject } = useProject();
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    const handleOpenProject = async () => {
        const result = await window.electron.openProjectDialog();
        if (result.path) {
            const projectResult = await window.electron.loadProject(result.path);

            if (projectResult.success && projectResult.project) {
                loadProject(projectResult.project);
                // onProjectLoaded(projectResult.project);
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

    return (
        <>
            <div style={{ padding: '4px 8px', display: 'flex', gap: '4px' }} id="menu-container">
                <DropdownMenu
                    switcher={
                        <Button view="flat" size="l">
                            Файл
                        </Button>
                    }
                    items={[
                        {
                            text: 'Создать новый проект',
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
                            action: handleSaveProject,
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
                            Редактировать
                        </Button>
                    }
                    items={[
                        {
                            text: 'Добавить модуль',
                            disabled: !useProject().state.isLoaded,
                            action: () => {
                                console.log('Добавить модуль');
                            }
                        },
                        {
                            text: 'Добавить ККТ',
                            disabled: !useProject().state.isLoaded,
                            action: () => {
                                console.log('Добавить ККТ');
                            }
                        },
                        {
                            text: 'Добавить приёмник данных',
                            disabled: !useProject().state.isLoaded,
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
                            disabled: !useProject().state.isLoaded,
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
        </>
    );
}

export default MenuContainer;
