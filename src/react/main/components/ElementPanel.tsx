import { useState } from 'react';
import { ChevronDown } from '@gravity-ui/icons';
import { Icon, Text } from '@gravity-ui/uikit';

interface PanelSection {
    title: string;
    items: string[];
}

const sections: PanelSection[] = [
    {
        title: 'Общие',
        items: ['Модуль обработки данных'],
    },
    {
        title: 'Источники данных',
        items: ['ККТ НЕВА 03-Ф'],
    },
    {
        title: 'Приёмники данных',
        items: ['Kafka', 'PostgreSQL'],
    },
];

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

function AccordionItem({ title, children }: AccordionItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{ borderBottom: '1px solid #ccc' }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    cursor: 'pointer',
                }}
            >
                <Text variant="subheader-2">{title}</Text>
                <Icon
                    data={ChevronDown}
                    size={16}
                    style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
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
    return (
        <div style={{ flex: 2, overflow: 'auto' }}>
            {sections.map(section => (
                <AccordionItem key={section.title} title={section.title}>
                    {section.items.map(item => (
                        <div
                            key={item}
                            style={{
                                width: '100%',
                                padding: '8px',
                                marginBottom: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '4px',
                                cursor: 'grab',
                                boxSizing: 'border-box',
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
