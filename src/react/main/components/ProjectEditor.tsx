import { useState } from 'react';
import { Toc, type TocItem } from '@gravity-ui/uikit';

const tocItems: TocItem[] = [
    {
        value: 'schema',
        content: 'Схема проекта',
    },
    {
        value: 'modules',
        content: 'Модули проекта',
        items: [
            { value: 'module-kafka', content: 'Модуль обработки в Kafka' },
            { value: 'module-postgresql', content: 'Модуль обработки НЕВА 03-Ф (Postgresql)' },
            { value: 'module-prometheus', content: 'Модуль обработки в Prometheus' },
        ],
    },
    {
        value: 'config',
        content: 'Конфигурация проекта',
    },
];

function ProjectEditor() {
    const [activeValue, setActiveValue] = useState<string>('schema');

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
