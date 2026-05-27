import { useState, useEffect } from 'react';
import { Toc, type TocItem } from '@gravity-ui/uikit';
import {useProject} from "../../context/ProjectContext.tsx";

function ProjectEditor() {
    const { state } = useProject();
    const { project, isLoaded } = state;
    const [tocItems, setTocItems] = useState<TocItem[]>([]);
    const [activeValue, setActiveValue] = useState<string>('schema');

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

    return (
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            <Toc
                items={tocItems}
                value={activeValue}
                onUpdate={setActiveValue}
            />
        </div>
    );
}

export default ProjectEditor;