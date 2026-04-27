import React, {useState} from 'react';
import {Button, Modal, Tab, TabList, TabPanel, TabProvider, Text} from '@gravity-ui/uikit';
import {ProjectBasicInfo} from './components/ProjectBasicInfo';
import {DependenciesSelector} from './components/DependenciesSelector';
import type {ProjectData} from '../../../types/model.d.ts';

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
    const [activeTab, setActiveTab] = useState<'basic' | 'dependencies'>('basic');
    const [projectData, setProjectData] = useState<ProjectData>({
        serverURL: 'start.spring.io',
        name: 'demo',
        location: '~/IdeaProjects/JavaTutorials',
        createGitRepo: false,
        language: 'Java',
        buildSystem: 'Maven',
        groupId: 'com.example',
        artifactId: 'demo',
        packageName: 'com.example.demo',
        jdkVersion: '25',
        javaVersion: '17',
        packaging: 'Jar',
        configFormat: 'Properties',
        springBootVersion: '4.0.6',
        dependencies: [],
    });

    const handleCreate = () => {
        onCreate(projectData.name);
        onClose();
    };

    const updateProjectData = (updates: Partial<ProjectData>) => {
        setProjectData(prev => ({...prev, ...updates}));
    };

    const getProjectPath = () => {
        const basePath = projectData.location.replace(/^~/, '');
        return `${basePath}/${projectData.name}`;
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
                    <TabProvider value={activeTab} onUpdate={(value) => setActiveTab(value as 'basic' | 'dependencies')}>
                        <TabList size="l">
                            <Tab value="basic">Основные параметры</Tab>
                            <Tab value="dependencies">Настройка зависимостей</Tab>
                        </TabList>

                        <div style={styles.contentWrapper}>
                            <TabPanel value="basic">
                                <ProjectBasicInfo
                                    projectData={projectData}
                                    onUpdate={updateProjectData}
                                    projectPath={getProjectPath()}
                                />
                            </TabPanel>

                            <TabPanel value="dependencies">
                                <DependenciesSelector
                                    selectedDependencies={projectData.dependencies}
                                    onDependenciesChange={(deps) => updateProjectData({dependencies: deps})}
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
                        {activeTab === 'dependencies' && (
                            <Button view="normal" onClick={() => setActiveTab('basic')}>
                                Назад
                            </Button>
                        )}
                        {activeTab === 'dependencies' ? (
                            <Button view="action" onClick={handleCreate}>
                                Создать
                            </Button>
                        ) : (
                            <Button view="action" onClick={() => setActiveTab('dependencies')}>
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