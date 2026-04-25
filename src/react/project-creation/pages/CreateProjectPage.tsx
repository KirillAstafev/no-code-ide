import React, {useState} from 'react';
import {Button, Label, Modal, Select, Tab, TabList, TabPanel, TabProvider, Text} from '@gravity-ui/uikit';
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
    const [activeTab, setActiveTab] = useState<'basic' | 'spring'>('basic');
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
                    <TabProvider value={activeTab} onUpdate={(value) => setActiveTab(value as 'basic' | 'spring')}>
                        <TabList size="l">
                            <Tab value="basic">Основные параметры</Tab>
                            <Tab value="spring">Spring Boot</Tab>
                        </TabList>

                        <div style={styles.contentWrapper}>
                            <TabPanel value="basic">
                                <ProjectBasicInfo
                                    projectData={projectData}
                                    onUpdate={updateProjectData}
                                    projectPath={getProjectPath()}
                                />
                            </TabPanel>

                            <TabPanel value="spring">
                                <div style={styles.springVersionWrapper}>
                                    <Label>Spring Boot версия</Label>
                                    <Select
                                        value={[projectData.springBootVersion]}
                                        onUpdate={(value) => updateProjectData({springBootVersion: value[0]})}
                                        options={[
                                            {value: '4.0.6', content: 'Spring Boot 4.0.6'},
                                            {value: '3.4.5', content: 'Spring Boot 3.4.5'},
                                            {value: '3.3.10', content: 'Spring Boot 3.3.10'},
                                            {value: '2.7.18', content: 'Spring Boot 2.7.18'},
                                        ]}
                                        width="max"
                                    />
                                </div>

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
                        {activeTab === 'spring' && (
                            <Button view="normal" onClick={() => setActiveTab('basic')}>
                                Назад
                            </Button>
                        )}
                        {activeTab === 'spring' ? (
                            <Button view="action" onClick={handleCreate}>
                                Создать
                            </Button>
                        ) : (
                            <Button view="action" onClick={() => setActiveTab('spring')}>
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