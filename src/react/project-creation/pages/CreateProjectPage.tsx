import React, {useState} from 'react';
import {Button, Modal, Tab, TabList, TabPanel, TabProvider, Text} from '@gravity-ui/uikit';
import {ProjectBasicInfo} from './components/ProjectBasicInfo';
import {DependenciesSelector} from './components/DependenciesSelector';

interface CreateProjectPageProps {
    open: boolean;
    onClose: () => void;
    onCreate: (projectName: string) => void;
}

const CreateProjectPage: React.FC<CreateProjectPageProps> = ({
                                                                 open,
                                                                 onClose,
                                                                 onCreate,
                                                             }) => {
    const [activeTab, setActiveTab] = useState<CreateProjectTab>('basic');
    const [project, setProject] = useState<Project>({
        name: 'demo',
        location: '~/IdeaProjects/JavaTutorials',
        modules: [],
        dependencies: [],
    });

    const handleCreate = async () => {
        if (!project.name.trim()) {
            alert('Укажите название проекта');
            return;
        }

        try {
            const result = await window.electron.createProjectFiles(project);

            if (result.success) {
                alert(`Проект "${project.name}" успешно создан в ${result.path}`);
                onCreate(project.name);
                onClose();
            } else {
                alert(`Ошибка создания: ${result.error}`);
            }
        } catch (error) {
            alert(`Ошибка: ${(error as Error).message}`);
        }
    };

    const updateProject = (updates: Partial<Project>) => {
        setProject(prev => ({...prev, ...updates}));
    };

    const getProjectPath = () => {
        const basePath = project.location.replace(/^~/, '');
        return `${basePath}/${project.name}`;
    };

    const styles = {
        modalContent: {
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column' as const,
        },
        header: {
            padding: '16px',
            borderBottom: '1px solid var(--g-color-line-generic)',
        },
        body: {
            padding: '0 16px',
            flex: 1,
            overflowY: 'auto' as const,
        },
        contentWrapper: {
            marginTop: '20px',
            marginBottom: '20px',
        },
        footer: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px',
            borderTop: '1px solid var(--g-color-line-generic)',
            gap: '8px',
        },
        buttonGroup: {
            display: 'flex',
            gap: '8px',
        },
        springVersionWrapper: {
            marginBottom: '16px',
        },
        tabPanel: {
            marginTop: '20px',
        },
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div style={styles.modalContent}>
                <div style={styles.header}>
                    <Text variant="header-2">Новый проект</Text>
                </div>

                <div style={styles.body}>
                    <TabProvider value={activeTab} onUpdate={(value) => setActiveTab(value as CreateProjectTab)}>
                        <TabList size="l">
                            <Tab value="basic">Основные параметры</Tab>
                            <Tab value="dependencies">Настройка зависимостей</Tab>
                        </TabList>

                        <div style={styles.contentWrapper}>
                            <TabPanel value="basic">
                                <ProjectBasicInfo
                                    project={project}
                                    onUpdate={updateProject}
                                    projectPath={getProjectPath()}
                                />
                            </TabPanel>

                            <TabPanel value="dependencies">
                                <DependenciesSelector
                                    selectedDependencies={project.dependencies}
                                    onDependenciesChange={(deps) => updateProject({dependencies: deps})}
                                />
                            </TabPanel>
                        </div>
                    </TabProvider>
                </div>

                <div style={styles.footer}>
                    <Button view="flat" onClick={onClose}>
                        Отмена
                    </Button>
                    <div style={styles.buttonGroup}>
                        {activeTab === "dependencies" && (
                            <Button view="normal" onClick={() => setActiveTab("basic")}>
                                Назад
                            </Button>
                        )}
                        {activeTab === "dependencies" ? (
                            <Button view="action" onClick={handleCreate}>
                                Создать
                            </Button>
                        ) : (
                            <Button view="action" onClick={() => setActiveTab("dependencies")}>
                                Далее
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateProjectPage;