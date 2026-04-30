import React from 'react';
import {Button, Label, Text, TextInput} from '@gravity-ui/uikit';

interface ProjectBasicInfoProps {
    project: Project;
    onUpdate: (updates: Partial<Project>) => void;
    projectPath: string;
}

export const ProjectBasicInfo: React.FC<ProjectBasicInfoProps> = ({
                                                                      project,
                                                                      onUpdate,
                                                                      projectPath,
                                                                  }) => {
    const handleSelectFolder = async () => {
        const folder = await window.electron.selectFolder();
        if (folder) {
            onUpdate({location: folder});
        }
    };

    const styles = {
        pathHint: {
            marginTop: '4px',
            display: 'block' as const,
        },
        row: {
            marginBottom: '16px',
        },
        buttonRow: {
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end',
        },
    };

    return (
        <div>
            <div style={styles.row}>
                <Label>Название проекта</Label>
                <TextInput
                    value={project.name}
                    onUpdate={(value) => onUpdate({name: value})}
                    placeholder="demo"
                    size="l"
                />
            </div>

            <div style={styles.row}>
                <Label>Расположение</Label>
                <div style={styles.buttonRow}>
                    <TextInput
                        value={project.location}
                        onUpdate={(value) => onUpdate({location: value})}
                        placeholder="~/IdeaProjects/JavaTutorials"
                        size="l"
                        style={{flex: 1}}
                    />
                    <Button onClick={handleSelectFolder} size="l">
                        Обзор
                    </Button>
                </div>
                <Text variant="caption-2" color="secondary" style={styles.pathHint}>
                    Проект будет создан в: {projectPath}
                </Text>
            </div>
        </div>
    );
};