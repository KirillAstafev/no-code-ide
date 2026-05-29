import {useState} from 'react';
import {ChevronDown} from '@gravity-ui/icons';
import {Icon, Text} from '@gravity-ui/uikit';
import {useProject} from "../../context/ProjectContext.tsx";
import {AddModulePage} from "../../module-creation/pages/AddModulePage.tsx";
import {AddDestinationPage} from "../../destination-creation/pages/AddDestinationPage.tsx";

interface PanelSection {
    title: string;
    items: string[];
}

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
}

function AccordionItem({title, children}: AccordionItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div style={{borderBottom: '1px solid var(--g-color-line-generic)'}}>
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
                <div style={{padding: '8px 16px 16px'}}>
                    {children}
                </div>
            )}
        </div>
    );
}

function ElementPanel() {
    const {state, updateProject} = useProject();
    const {project, isLoaded} = state;
    const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
    const [isAddDestinationModalOpen, setIsAddDestinationModalOpen] = useState(false);

    const availableDestinations = isLoaded && project?.dependencies
        ? project.dependencies.map(dep => dep.name)
        : [];

    const staticSections: Omit<PanelSection, 'items'>[] = [
        {title: 'Общие'},
        {title: 'Источники данных'},
    ];

    const sections: PanelSection[] = staticSections.map(section => {
        switch (section.title) {
            case 'Общие':
                return {
                    title: section.title,
                    items: isLoaded
                        ? ['Модуль обработки данных']
                        : ['Нет доступных элементов'],
                };
            case 'Источники данных':
                return {
                    title: section.title,
                    items: isLoaded
                        ? ['ККТ НЕВА 03-Ф']
                        : ['Нет доступных элементов'],
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

    const handleDestinationDoubleClick = () => {
        if (isLoaded) {
            setIsAddDestinationModalOpen(true);
        }
    };

    const handleAddDestination = (name: string, dependency: ExternalDependency) => {
        if (!project) return;

        let finalName = name;
        let counter = 1;
        const baseName = name;
        while (project.destinations?.some(d => d.name === finalName)) {
            finalName = `${baseName} ${counter}`;
            counter++;
        }

        const newDestination: DataDestination = {
            name: finalName,
            connectionSettings: new Map<string, string>([
                ['host', 'localhost'],
                ['port', 'default'],
                ['database', ''],
            ]),
            dependency: dependency,
        };

        const x = -100 + Math.random() * 200;
        const y = -100 + Math.random() * 200;

        const newNode = {
            id: `destination-${Date.now()}`,
            type: 'destination' as const,
            label: newDestination.name,
            caption: dependency.name,
            x,
            y,
            data: newDestination,
        };

        updateProject({
            destinations: [...(project.destinations || []), newDestination],
            schema: {
                ...project.schema,
                nodes: [...(project.schema.nodes || []), newNode],
            },
        });
    };

    const handleAddModule = (moduleName: string) => {
        if (!project) return;

        const baseX = 600;
        const baseY = 200;
        const spacing = 80;
        const existingModuleCount = project.modules.length;

        const x = baseX + (existingModuleCount % 3) * spacing;
        const y = baseY + Math.floor(existingModuleCount / 3) * spacing;

        const newModule = {
            name: moduleName,
            location: `${project.location}/modules/${moduleName}`,
            sources: [],
            destinations: [],
        };

        const newSchemaNode = {
            id: `module-${moduleName}`,
            type: 'module' as const,
            label: moduleName,
            caption: 'Модуль',
            x,
            y,
            data: newModule,
        };

        updateProject({
            modules: [...project.modules, newModule],
            schema: {
                ...project.schema,
                nodes: [...project.schema.nodes ?? [], newSchemaNode],
            },
        });
    };

    const handleCommonDoubleClick = () => {
        if (isLoaded) {
            setIsAddModuleModalOpen(true);
        }
    };

    return (
        <div style={{flex: 2, overflow: 'auto', background: 'var(--g-color-base-background)'}}>
            {sections.map(section => (
                <AccordionItem key={section.title} title={section.title}>
                    {section.items.map(item => (
                        <div
                            key={item}
                            onDoubleClick={() => {
                                if (section.title === 'Общие') {
                                    handleCommonDoubleClick();
                                } else {
                                    handleDestinationDoubleClick();
                                }
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
                        >
                            <Text variant="body-2">{item}</Text>
                        </div>
                    ))}
                </AccordionItem>
            ))}
            <AddModulePage
                open={isAddModuleModalOpen}
                onClose={() => setIsAddModuleModalOpen(false)}
                onAdd={handleAddModule}
                existingModuleNames={project?.modules.map(m => m.name) || []}
            />
            <AddDestinationPage
                open={isAddDestinationModalOpen}
                onClose={() => setIsAddDestinationModalOpen(false)}
                onAdd={handleAddDestination}
            />
        </div>
    );
}

export default ElementPanel;