import {useCallback, useEffect, useState} from 'react';
import {EAnchorType, ECanChangeBlockGeometry, GraphState, type TBlock, type TGraphConfig} from '@gravity-ui/graph';
import {GraphCanvas, useGraph} from '@gravity-ui/graph/react';
import {useProject} from "../../context/ProjectContext.tsx";
import {useSelection} from "../../context/SelectionContext.tsx";
import {SOURCE_BLOCK, SourceBlock} from "./SourceBlock.ts";
import {DESTINATION_BLOCK, DestinationBlock} from "./DestinationBlock.ts";
import {MODULE_BLOCK, ModuleBlock} from "./ModuleBlock.ts";
import {ModuleConnectionsModal} from "./ModuleConnectionsModal.tsx";

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
            useBlocksAnchors: false
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
        const connections: any[] = [];

        schema.nodes?.forEach(node => {
            const block: TBlock<any> = {
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

            if (node.type === 'module') {
                block.anchors = [
                    {
                        id: `${node.id}-input`,
                        blockId: node.id,
                        type: EAnchorType.IN,
                        index: 0
                    },
                    {
                        id: `${node.id}-output`,
                        blockId: node.id,
                        type: EAnchorType.OUT,
                        index: 1
                    }
                ];
            } else if (node.type === 'source') {
                block.anchors = [
                    {
                        id: `${node.id}-output`,
                        blockId: node.id,
                        type: EAnchorType.OUT,
                        index: 0
                    }
                ];
            } else if (node.type === 'destination') {
                block.anchors = [
                    {
                        id: `${node.id}-input`,
                        blockId: node.id,
                        type: EAnchorType.IN,
                        index: 0
                    }
                ];
            }

            blocks.push(block);
        });

        schema.edges?.forEach(edge => {
            connections.push({
                sourceBlockId: edge.source,
                sourceAnchorId: `${edge.source}-output`,
                targetBlockId: edge.target,
                targetAnchorId: `${edge.target}-input`,
            });
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
        (sourceIds: string[], destinationIds: string[]) => {
            if (!currentModule || !project) return;

            const moduleIndex = project.modules.findIndex(m => m.name === currentModule.name);
            if (moduleIndex === -1) return;

            const newModule = {
                ...currentModule,
                sources: sourceIds.map(sourceName => 
                    project.sources?.find(s => s.name === sourceName)
                ).filter((source): source is DataSource => !!source),
                destinations: destinationIds.map(destinationName => 
                    project.destinations?.find(d => d.name === destinationName)
                ).filter((destination): destination is DataDestination => !!destination),
            };

            const newModules = [...project.modules];
            newModules[moduleIndex] = newModule;

            updateProject({
                modules: newModules,
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
                renderBlock={(_graphObject, _block) => {
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
