import { useState } from 'react';
import { ChevronRight } from '@gravity-ui/icons';
import { Icon, Text } from '@gravity-ui/uikit';

interface TreeItem {
    id: string;
    title: string;
    children?: TreeItem[];
}

const projectStructure: TreeItem[] = [
    {
        id: 'schema',
        title: 'Схема проекта',
        children: [
            { id: 'schema-main', title: 'main.graph' },
            { id: 'schema-modules', title: 'modules.graph' },
        ],
    },
    {
        id: 'modules',
        title: 'Модули проекта',
        children: [
            { id: 'module-kafka', title: 'Модуль обработки в Kafka' },
            { id: 'module-postgresql', title: 'Модуль обработки НЕВА 03-Ф (Postgresql)' },
            { id: 'module-prometheus', title: 'Модуль обработки в Prometheus' },
        ],
    },
    {
        id: 'config',
        title: 'Конфигурация проекта',
        children: [
            { id: 'config-general', title: 'general.json' },
            { id: 'config-database', title: 'database.json' },
            { id: 'config-monitoring', title: 'monitoring.json' },
        ],
    },
];

interface TreeNodeProps {
    item: TreeItem;
    level: number;
}

function TreeNode({ item, level }: TreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = item.children && item.children.length > 0;

    const handleClick = () => {
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div>
            <div
                onClick={handleClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    cursor: hasChildren ? 'pointer' : 'default',
                    backgroundColor: 'transparent',
                    borderRadius: '4px',
                }}
            >
                {hasChildren ? (
                    <Icon
                        data={ChevronRight}
                        size={16}
                        style={{
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }}
                    />
                ) : (
                    <span style={{ width: '16px' }} />
                )}

                <Text variant="body-2">{item.title}</Text>
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {item.children!.map(child => (
                        <TreeNode key={child.id} item={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ProjectEditor() {
    return (
        <div style={{ flex: 1, overflow: 'auto' }}>
            {projectStructure.map(item => (
                <TreeNode key={item.id} item={item} level={0} />
            ))}
        </div>
    );
}

export default ProjectEditor;
