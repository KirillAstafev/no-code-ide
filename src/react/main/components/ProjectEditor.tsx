import { useState, useEffect } from 'react';
import { Toc, type TocItem } from '@gravity-ui/uikit';
import {useProject} from "../../context/ProjectContext.tsx";
import {ProjectConfigPage} from "../../project-config/pages/ProjectConfigPage.tsx";

function ProjectEditor() {
    const { state } = useProject();
    const { project, isLoaded } = state;
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeValue, setActiveValue] = useState<string>('schema');
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

    useEffect(() => {
        if (!isLoaded || !project) {
            setTocItems([
                {
                    value: 'schema',
                    content: 'Схема проекта',
                },
                {
                    value: 'modules',
                    content: 'Модули проекта',
                    items: [],
                },
                {
                    value: 'sources',
                    content: 'Источники данных',
                    items: [],
                },
                {
                    value: 'destinations',
                    content: 'Приёмники данных',
                    items: [],
                },
                {
                    value: 'config',
                    content: 'Конфигурация проекта',
                },
            ]);
            return;
        }

        const moduleItems: TocItem[] = project.modules.map((module) => ({
            value: `module-${module.name}`,
            content: module.name,
        }));

        const sourceItems: TocItem[] = project.sources.map((source) => ({
            value: `source-${source.name}`,
            content: source.name,
        }));

        const destinationItems: TocItem[] = project.destinations.map((destination) => ({
            value: `destination-${destination.name}`,
            content: destination.name,
        }));

        const items: TocItem[] = [
            {
                value: 'schema',
                content: 'Схема проекта',
            },
            {
                value: 'modules',
                content: 'Модули проекта',
                items: moduleItems.length > 0 ? moduleItems : undefined,
            },
            {
                value: 'sources',
                content: 'Источники данных',
                items: sourceItems.length > 0 ? sourceItems : undefined,
            },
            {
                value: 'destinations',
                content: 'Приёмники данных',
                items: destinationItems.length > 0 ? destinationItems : undefined,
            },
            {
                value: 'config',
                content: 'Конфигурация проекта',
            },
        ];

        setTocItems(items);

        const isValidActive = items.some(item =>
            item.value === activeValue ||
            item.items?.some(sub => sub.value === activeValue)
        );

        if (!isValidActive) {
            setActiveValue('schema');
        }
    }, [project, isLoaded, activeValue]);

    useEffect(() => {
        if (!isLoaded) {
            setActiveValue('schema');
            setIsConfigModalOpen(false);
        }
    }, [isLoaded]);

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            <Toc
                items={tocItems}
                value={activeValue}
                onUpdate={(value) => {
                    if (isLoaded && value === 'config') {
                        setIsConfigModalOpen(true);
                    } else {
                        setActiveValue(value);
                    }
                }}
            />
            <ProjectConfigPage
                open={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
            />
        </div>
    );
}

export default ProjectEditor;
