import { useState } from 'react';
import { ChevronDown } from '@gravity-ui/icons';
import { Icon, Text } from '@gravity-ui/uikit';
import {useProject} from "../../context/ProjectContext.tsx";

interface PanelSection {
    title: string;
    items: string[];
}

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

function AccordionItem({ title, children }: AccordionItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{ borderBottom: '1px solid var(--g-color-line-generic)' }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: 'var(--g-color-base-background)',
                }}
            >
                <Text variant="subheader-2">{title}</Text>
                <Icon
                    data={ChevronDown}
                    size={16}
                    style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                    }}
                />
            </div>
            {isExpanded && (
                <div style={{ padding: '8px 16px 16px' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

function ElementPanel() {
    const { state } = useProject();
    const { project, isLoaded } = state;

    const availableDestinations = isLoaded && project?.dependencies
        ? project.dependencies
              .map(dep => dep.name)
              .filter(Boolean) as string[]
        : [];

    const staticSections: Omit<PanelSection, 'items'>[] = [
        {
            title: 'Общие',
        },
        {
            title: 'Источники данных',
        },
    ];

    const sections: PanelSection[] = staticSections.map(section => {
        switch (section.title) {
            case 'Общие':
                return {
                    title: section.title,
                    items: ['Модуль обработки данных'],
                };
            case 'Источники данных':
                return {
                    title: section.title,
                    items: ['ККТ НЕВА 03-Ф'],
                };
            default:
                return {
                    title: section.title,
                    items: [],
                };
        }
    });

    sections.push({
        title: 'Приёмники данных',
        items: availableDestinations.length > 0
            ? availableDestinations
            : ['Нет доступных приёмников'],
    });

    return (
        <div style={{ flex: 2, overflow: 'auto', background: 'var(--g-color-base-background)' }}>
            {sections.map(section => (
                <AccordionItem key={section.title} title={section.title}>
                    {section.items.map(item => (
                        <div
                            key={item}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', item);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '6px',
                                backgroundColor: 'var(--g-color-surface-flat)',
                                borderRadius: 'var(--g-border-radius-m)',
                                cursor: 'grab',
                                border: '1px solid var(--g-color-line-generic)',
                                boxSizing: 'border-box',
                                transition: 'all 0.2s',
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                            }}
                        >
                            <Text variant="body-2">{item}</Text>
                        </div>
                    ))}
                </AccordionItem>
            ))}
        </div>
    );
}

export default ElementPanel;