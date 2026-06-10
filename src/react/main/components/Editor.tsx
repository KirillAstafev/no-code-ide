import {useCallback, useEffect, useState} from 'react';
import {ECanChangeBlockGeometry, GraphState, type TBlock, type TConnection, type TGraphConfig} from '@gravity-ui/graph';
import {GraphCanvas, useGraph} from '@gravity-ui/graph/react';
import {useProject} from "../../context/ProjectContext.tsx";
import {useSelection} from "../../context/SelectionContext.tsx";
import {SOURCE_BLOCK, SourceBlock} from "./SourceBlock.ts";
import {DESTINATION_BLOCK, DestinationBlock} from "./DestinationBlock.ts";
import {MODULE_BLOCK, ModuleBlock} from "./ModuleBlock.ts";
import {ModuleConnectionsModal} from "./ModuleConnectionsModal.tsx";
import {DATA_SOURCE_COMMANDS} from "./constants/dataSourceCommands";

interface SchemaEdge {
    id: string;
    sourceBlockId: string;
    targetBlockId: string;
    label?: string;
    style?: 'solid' | 'dashed';
    arrowhead?: 'none' | 'arrow' | 'dot';
}

function Editor() {
    const config: TGraphConfig = {
        settings: {
            blockComponents: {
                [SOURCE_BLOCK]: SourceBlock,
                [DESTINATION_BLOCK]: DestinationBlock,
                [MODULE_BLOCK]: ModuleBlock,
            },
            canCreateNewConnections: true,
            canChangeBlockGeometry: ECanChangeBlockGeometry.ALL,
            useBlocksAnchors: false,
            showConnectionLabels: true
        }
    };
    const {graph, setEntities, start} = useGraph(config);
    const {state, updateProject} = useProject();
    const {project, isLoaded} = state;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModule, setCurrentModule] = useState<Module | null>(null);

    useEffect(() => {
        if (!isLoaded || !project || !project.schema) {
            return;
        }

        const schema = project.schema;
        const blocks: TBlock[] = [];
        const connections: TConnection[] = [];

        schema.nodes?.forEach(node => {
            const block: TBlock = {
                id: node.id,
                is: `${node.type}`,
                x: node.x || 0,
                y: node.y || 0,
                width: 140,
                height: 90,
                name: node.label,
                anchors: [],
                meta: {
                    ...node.data
                }
            };

            blocks.push(block);
        });

        schema.edges?.forEach(edge => {
            const connection: TConnection = {
                id: edge.id,
                sourceBlockId: `${edge.sourceBlockId}`,
                targetBlockId: `${edge.targetBlockId}`,
                label: edge.label ?? "",
            };

            connections.push(connection);
        });

        setEntities({blocks, connections});
    }, [setEntities, project, isLoaded]);

    const {selectElement} = useSelection();

    const onBlockSelectionChange = useCallback(
        (detail: any) => {
            const blockId = detail.list[0];
            const node = project?.schema.nodes?.find(n => n.id === blockId);

            selectElement(node || null);
        },
        [project?.schema.nodes, selectElement]
    );

    const onBlockDragEnd = useCallback(
        (data: any) => {
            const currentNode = project?.schema.nodes?.find(node => node.id === data.block.id);
            if (currentNode) {
                currentNode.x = data.block.x;
                currentNode.y = data.block.y;
            }

            updateProject({...project});
        },
        [project, updateProject]
    );

    const onBlockDblClick = useCallback(
        (data: any) => {
            const blockId = data.target?.state.id;
            const node = project?.schema.nodes?.find(n => n.id === blockId);

            if (node?.type === 'module' && node.data) {
                setCurrentModule(node.data as Module);
                setIsModalOpen(true);
            }
        },
        [project?.schema.nodes]
    );

    const handleModalConfirm = useCallback(
        (sourceConnections: { sourceName: string; commandName: string; commandParams: Record<string, string | number | boolean> }[], destinationIds: string[]) => {
            if (!currentModule || !project) return;

            const moduleIndex = project.modules.findIndex(m => m.name === currentModule.name);
            if (moduleIndex === -1) return;

            // Фильтруем только новые источники и приёмники
            // const currentSourceNames = currentModule.sources?.map(s => s.name) || [];
            const currentDestinationNames = currentModule.destinations?.map(d => d.name) || [];
            
            // const newSourceConnections = sourceConnections.filter(sc => !currentSourceNames.includes(sc.sourceName));
            const newDestinationIds = destinationIds.filter(id => !currentDestinationNames.includes(id));

            // const newSourceNames = sourceConnections.map(sc => sc.sourceName);
            const newModule = {
                ...currentModule,
                sources: sourceConnections.map(sc => {
                    const source = project.sources?.find(s => s.name === sc.sourceName);
                    if (source) {
                        const command = DATA_SOURCE_COMMANDS.find(c => c.name === sc.commandName) || DATA_SOURCE_COMMANDS[0];
                        const updatedSource: DataSource = {
                            ...source,
                            command: command,
                            commandParams: sc.commandParams
                        };
                        return updatedSource;
                    }
                    return null as any;
                }).filter((source): source is DataSource => source !== null),
                destinations: destinationIds.map(destinationName =>
                    project.destinations?.find(d => d.name === destinationName)
                ).filter((destination): destination is DataDestination => !!destination),
            };

            const newModules = [...project.modules];
            newModules[moduleIndex] = newModule;

            const newConnections: SchemaEdge[] = [];
            const moduleBlockId = `module-${currentModule.name}`;

            // Создаем карту соединений для быстрого поиска
            // const sourceConnMap = new Map(sourceConnections.map(sc => [sc.sourceName, sc]));
            
            // Добавляем новые связи и обновляем существующие
            sourceConnections.forEach(sc => {
                const sourceNode = project.schema.nodes?.find(n => n.data.name === sc.sourceName);
                if (sourceNode) {
                    const connectionId = `${sourceNode.id}_${moduleBlockId}`;
                    
                    // Проверяем, существует ли уже соединение
                    const existingEdge = project.schema.edges?.find(e => e.id === connectionId);
                    
                    newConnections.push({
                        id: connectionId,
                        sourceBlockId: sourceNode.id,
                        targetBlockId: moduleBlockId,
                        label: sc.commandName,
                        style: existingEdge?.style,
                        arrowhead: existingEdge?.arrowhead || 'arrow',
                    });
                }
            });

            newDestinationIds.forEach(destinationName => {
                const destinationNode = project.schema.nodes?.find(n => n.data.name === destinationName);
                if (destinationNode) {
                    const connectionId = `${moduleBlockId}_${destinationNode.id}`;
                    newConnections.push({
                        id: connectionId,
                        sourceBlockId: moduleBlockId,
                        targetBlockId: destinationNode.id,
                    });
                }
            });

            const existingEdges = project.schema.edges || [];
            const existingNodes = project.schema.nodes || [];
            
            updateProject({
                modules: newModules,
                schema: {
                    ...project.schema,
                    nodes: existingNodes.map(node =>
                        node.id === `module-${currentModule.name}`
                            ? { ...node, data: newModule }
                            : node
                    ),
                    edges: [...existingEdges, ...newConnections],
                },
            });

            setIsModalOpen(false);
            setCurrentModule(null);
        },
        [currentModule, graph, project, updateProject]
    );

    return (
        <>
            <GraphCanvas
                graph={graph}
                renderBlock={() => {
                    return (
                        <div>
                        </div>
                    )
                }}
                onStateChanged={({state}) => {
                    if (state === GraphState.ATTACHED) {
                        start();
                        graph.zoomTo("center");
                    }
                }}
                onBlockSelectionChange={onBlockSelectionChange}
                onBlockDragEnd={onBlockDragEnd}
                dblclick={onBlockDblClick}
            />
            {currentModule && isLoaded && project && (
                <ModuleConnectionsModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleModalConfirm}
                    module={currentModule}
                    availableSources={project.sources || []}
                    availableDestinations={project.destinations || []}
                />
            )}
        </>
    );
}

export default Editor;
