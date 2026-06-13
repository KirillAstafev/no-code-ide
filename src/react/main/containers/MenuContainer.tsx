import { Button, DropdownMenu } from '@gravity-ui/uikit';
import { useState, useEffect } from 'react';
import CreateProjectPage from '../../project-creation/pages/CreateProjectPage';
import { useProject } from "../../context/ProjectContext.tsx";
import { useWindow } from "../../context/WindowContext.tsx";
import { CloneGitProjectPage } from "../../git/components/CloneGitProjectPage.tsx";
import { useBuildProgress } from "../context/BuildProgressContext";
import TestSettingsPage from '../../test/TestSettingsPage';
import TestRunPage from '../../test/TestRunPage';

function MenuContainer() {
    const { loadProject, saveProject, clearProject, state } = useProject();
    const { state: windowState } = useWindow();
    const { isLoaded, isModified, project } = state;
    const { windowId } = windowState;
    const { startBuild, setStage, finishBuild } = useBuildProgress();
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [isCloneGitModalOpen, setIsCloneGitModalOpen] = useState(false);
    const [isTestSettingsOpen, setIsTestSettingsOpen] = useState(false);
    const [isTestRunOpen, setIsTestRunOpen] = useState(false);

    useEffect(() => {
        const handleBuildProgress = (_event: any, { type, payload }: any) => {
            switch (type) {
                case 'stage':
                    setStage(payload.stage);
                    break;
                case 'progress':
                    // TODO: обновление прогресса (нужна реализация)
                    break;
                case 'finish':
                    finishBuild();
                    break;
            }
        };

        window.electron.on('build-progress', handleBuildProgress);

        return () => {
            window.electron.off('build-progress', handleBuildProgress);
        };
    }, [setStage, finishBuild]);

    useEffect(() => {
        const handleRunTestProgress = (_event: any, { type, payload }: any) => {
            switch (type) {
                case 'stage':
                    console.log(`Тест: ${payload.stage}`);
                    break;
                case 'output':
                    // Выводим в консоль и обновляем состояние
                    if (payload.output && payload.output.trim()) {
                        const outputElem = document.getElementById('test-output');
                        if (outputElem) {
                            const timestamp = new Date().toLocaleTimeString();
                            outputElem.innerHTML += `<div><span style="color: #888;">[${timestamp}]</span> ${payload.output}</div>`;
                            outputElem.scrollTop = outputElem.scrollHeight;
                        }
                    }
                    break;
                case 'finish':
                    console.log(`Тест завершен: ${payload.success}`);
                    setIsTestRunOpen(false);
                    break;
                case 'error':
                    console.error(`Ошибка теста: ${payload.message}`);
                    setIsTestRunOpen(false);
                    break;
                case 'process-info':
                    if (payload.pid) {
                        console.log(`PID процесса теста: ${payload.pid}`);
                    }
                    break;
            }
        };

        window.electron.on('run-test-progress', handleRunTestProgress);

        return () => {
            window.electron.off('run-test-progress', handleRunTestProgress);
        };
    }, []);

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

        // Начинаем сборку
        startBuild('downloading');

        try {
            const result = await window.electron.buildProject(project);

            if (result.success) {
                alert(`Проект успешно собран в папке ${result.path}`);
            } else {
                alert(`Ошибка сборки: ${result.error}`);
            }
        } catch (err) {
            alert(`Ошибка сборки: ${(err as Error).message}`);
        }
    };

    const handleCloneGitProject = async (url: string, path: string) => {
        try {
            await window.electron.cloneGitRepository(url, path);
            const projectResult = await window.electron.loadProject(path);

            if (projectResult.success && projectResult.project) {
                loadProject(projectResult.project);
                setIsCloneGitModalOpen(false);
                alert('Проект успешно загружен из Git-репозитория');
            } else {
                alert(`Ошибка загрузки проекта: ${projectResult.error}`);
            }
        } catch (err) {
            alert(`Ошибка клонирования репозитория: ${(err as Error).message}`);
        }
    };

    const handleTestSettings = () => {
        setIsTestSettingsOpen(true);
    };

    const handleRunTest = () => {
        setIsTestRunOpen(true);
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
                                text: 'Открыть проект из Git',
                                action: () => {
                                    setIsCloneGitModalOpen(true);
                                }
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
                            Тестирование
                        </Button>
                    }
                    items={[
                        [
                            {
                                text: 'Настроить',
                                action: handleTestSettings,
                            },
                            {
                                text: 'Запустить',
                                disabled: !isLoaded,
                                action: handleRunTest,
                            },
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

            <CloneGitProjectPage
                open={isCloneGitModalOpen}
                onClose={() => setIsCloneGitModalOpen(false)}
                onClone={handleCloneGitProject}
            />

            <TestSettingsPage
                open={isTestSettingsOpen}
                onClose={() => setIsTestSettingsOpen(false)}
            />

            <TestRunPage
                open={isTestRunOpen}
                onClose={() => setIsTestRunOpen(false)}
            />
        </>
    );
}

export default MenuContainer;
