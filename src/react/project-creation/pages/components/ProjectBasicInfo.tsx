import React from 'react';
import {Label, Text, TextInput} from '@gravity-ui/uikit';

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
    const styles = {
        pathHint: {
            marginTop: '4px',
            display: 'block' as const,
        },
        row: {
            marginBottom: '16px',
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
                <TextInput
                    value={project.location}
                    onUpdate={(value) => onUpdate({location: value})}
                    placeholder="~/IdeaProjects/JavaTutorials"
                    size="l"
                />
                <Text variant="caption-2" color="secondary" style={styles.pathHint}>
                    Проект будет создан в: {projectPath}
                </Text>
            </div>
        </div>
    );
};