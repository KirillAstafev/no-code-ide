import { Button, DropdownMenu } from '@gravity-ui/uikit';
import { useState } from 'react';
import CreateProjectPage from '../../project-creation/pages/CreateProjectPage';

function MenuContainer() {
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    const handleOpenProject = async () => {
        const result = await window.electron.openProjectDialog();
        if (result.path) {
            console.log('Открыт проект:', result.path);
        }
    };

    const handleCreateProject = (projectName: string) => {
        console.log('Создан проект:', projectName);
        setIsNewProjectModalOpen(false);
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
                            action: () => {
                                console.log('Добавить модуль');
                            }
                        },
                        {
                            text: 'Добавить ККТ',
                            action: () => {
                                console.log('Добавить ККТ');
                            }
                        },
                        {
                            text: 'Добавить приёмник данных',
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
                            action: () => {
                                console.log('Собрать проект');
                            }
                        },
                        {
                            text: 'Пересобрать проект',
                            action: () => {
                                console.log('Пересобрать проект');
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
