import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {useState} from 'react';
import CreateProjectPage from '../../project-creation/pages/CreateProjectPage';
import {useProject} from "../../context/ProjectContext.tsx";
import {useWindow} from "../../context/WindowContext.tsx";

function MenuContainer() {
    const {loadProject, saveProject, clearProject, state} = useProject();
    const {state: windowState} = useWindow();
    const {isLoaded, isModified, project} = state;
    const {windowId} = windowState;
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

    const handleBuildProject = async () => {
        if (!project) return;

        try {
            const result = await window.electron.buildProject(project);

            if (result.success) {
                alert(`Проект успешно собран! Шаблон Spring Boot приложения сгенерирован и распакован в папку ${result.path}`);
            } else {
                alert(`Ошибка сборки: ${result.error}`);
            }
        } catch (err) {
            alert(`Ошибка сборки: ${(err as Error).message}`);
        }
    };

    return (
        <>
            <div style={{padding: '4px 8px', display: 'flex', gap: '4px'}} id="menu-container">
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
                            Сборка
                        </Button>
                    }
                    items={[
                        {
                            text: 'Собрать проект',
                            disabled: !isLoaded,
                            action: handleBuildProject
                        }
                    ]}
                />
            </div>

            {isLoaded && (
                <div
                    style={{
                        fontSize: '14px',
                        color: isModified ? 'var(--g-color-text-warning)' : 'var(--g-color-text-secondary)',
                    }}
                >
                    {isModified ? '• Не сохранено' : 'Сохранено'}
                </div>
            )}

            <CreateProjectPage
                open={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onCreate={handleCreateProject}
            />
        </>
    );
}

export default MenuContainer;
