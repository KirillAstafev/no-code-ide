import {useCallback, useEffect, useState} from 'react';
import {ECanChangeBlockGeometry, GraphState, type TBlock, type TConnection, type TGraphConfig} from '@gravity-ui/graph';
import {GraphCanvas, useGraph} from '@gravity-ui/graph/react';
import {useProject} from "../../context/ProjectContext.tsx";
import {useSelection} from "../../context/SelectionContext.tsx";
import {SOURCE_BLOCK, SourceBlock} from "./SourceBlock.ts";
import {DESTINATION_BLOCK, DestinationBlock} from "./DestinationBlock.ts";
import {MODULE_BLOCK, ModuleBlock} from "./ModuleBlock.ts";
import {ModuleConnectionsModal, type DestinationSettings} from "./ModuleConnectionsModal.tsx";
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
    const {selectElement} = useSelection();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModule, setCurrentModule] = useState<Module | null>(null);

    useEffect(() => {
        if (!isLoaded || !project || !project.schema) {
            setEntities({blocks: [], connections: []});
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

    useEffect(() => {
        if (!isLoaded) {
            setIsModalOpen(false);
            setCurrentModule(null);
            setEntities({blocks: [], connections: []});
        }
    }, [isLoaded, setEntities]);

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
        (sourceConnections: {
            sourceName: string;
            commandName: string;
            commandParams: Record<string, string | number | boolean>
        }[], destinationConnections: { destinationName: string; settings: DestinationSettings }[]) => {
            if (!currentModule || !project) return;

            const moduleIndex = project.modules.findIndex(m => m.name === currentModule.name);
            if (moduleIndex === -1) return;

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
                destinations: project.destinations?.map(d => {
                    const newDestination = destinationConnections.find(dc => dc.destinationName === d.name);
                    if (newDestination && newDestination.settings) {
                        return {
                            ...d,
                            targetType: newDestination.settings.targetType,
                            postgresql: newDestination.settings.postgresql || {},
                            kafka: newDestination.settings.kafka || {},
                            rabbitmq: newDestination.settings.rabbitmq || {},
                            redis: newDestination.settings.redis || {},
                            cassandra: newDestination.settings.cassandra || {},
                        };
                    }
                    return d;
                }),
            };

            const newModules = [...project.modules];
            newModules[moduleIndex] = newModule;

            const newSources = project.sources?.map(source => {
                const updatedSource = newModule.sources.find(ms => ms.name === source.name);
                if (updatedSource) {
                    return updatedSource;
                }
                return source;
            });

            const newDestinations = project.destinations?.map(d => {
                const updatedDestination = newModule.destinations.find(md => md.name === d.name);
                if (updatedDestination) {
                    return updatedDestination;
                }
                return d;
            });

            const existingEdges = project.schema.edges || [];
            const newConnections: SchemaEdge[] = [];
            const moduleBlockId = `module-${currentModule.name}`;

            // Удаляем старые связи для модуля
            const filteredEdges = existingEdges.filter((edge: SchemaEdge) =>
                edge.sourceBlockId !== moduleBlockId && edge.targetBlockId !== moduleBlockId
            );

            // Создаем новые связи для источников
            sourceConnections.forEach(sc => {
                const sourceNode = project.schema.nodes?.find(n => n.data.name === sc.sourceName);
                if (sourceNode) {
                    const connectionId = `${sourceNode.id}_${moduleBlockId}`;
                    newConnections.push({
                        id: connectionId,
                        sourceBlockId: sourceNode.id,
                        targetBlockId: moduleBlockId,
                        label: sc.commandName,
                        arrowhead: 'arrow',
                    });
                }
            });

            // Создаем новые связи для приёмников
            destinationConnections.forEach(dc => {
                const destinationNode = project.schema.nodes?.find(n => n.data.name === dc.destinationName);
                if (destinationNode) {
                    const connectionId = `${moduleBlockId}_${destinationNode.id}`;
                    const settings = dc.settings || {};
                    let label = 'output';
                    if (settings.targetType === 'POSTGRESQL' && settings.postgresql?.tableName) {
                        label = settings.postgresql.tableName;
                    } else if (settings.targetType === 'KAFKA' && settings.kafka?.topic) {
                        label = settings.kafka.topic;
                    } else if (settings.targetType === 'RABBITMQ' && settings.rabbitmq?.queueName) {
                        label = settings.rabbitmq.queueName;
                    } else if (settings.targetType === 'REDIS' && settings.redis?.key) {
                        label = settings.redis.key;
                    } else if (settings.targetType === 'CASSANDRA' && settings.cassandra?.table) {
                        label = settings.cassandra.table;
                    }
                    newConnections.push({
                        id: connectionId,
                        sourceBlockId: moduleBlockId,
                        targetBlockId: destinationNode.id,
                        label: label,
                        arrowhead: 'arrow',
                    });
                }
            });

            const existingNodes = project.schema.nodes || [];

            updateProject({
                modules: newModules,
                sources: newSources,
                destinations: newDestinations,
                schema: {
                    ...project.schema,
                    nodes: existingNodes.map(node => {
                        if (node.id === `module-${currentModule.name}`) {
                            return {...node, data: newModule};
                        }
                        // Обновляем узлы приёмников
                        if (node.type === 'destination' && newDestinations) {
                            const updatedDestination = newDestinations.find(d => d.name === node.data.name);
                            if (updatedDestination) {
                                return {...node, data: updatedDestination};
                            }
                        }
                        return node;
                    }),
                    edges: [...filteredEdges, ...newConnections],
                },
            });

            setIsModalOpen(false);
            setCurrentModule(null);
        },
        [currentModule, project, updateProject]
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
