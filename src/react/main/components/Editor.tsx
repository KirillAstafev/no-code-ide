import {EAnchorType, GraphState, type TBlock, type TBlockId, type TGraphConfig} from '@gravity-ui/graph';
import {GraphCanvas, useGraph} from '@gravity-ui/graph/react';
import {useCallback, useEffect} from 'react';
import {useProject} from "../../context/ProjectContext.tsx";
import {useSelection} from "../../context/SelectionContext.tsx";
// @ts-expect-error
import type {SelectionEvent} from "@gravity-ui/graph/build/graphEvents";
import {SOURCE_BLOCK, SourceBlock} from "./SourceBlock.ts";
import {DESTINATION_BLOCK, DestinationBlock} from "./DestinationBlock.ts";
import {MODULE_BLOCK, ModuleBlock} from "./ModuleBlock.ts";

function Editor() {
    const config: TGraphConfig = {
        settings: {
            blockComponents: {
                [SOURCE_BLOCK]: SourceBlock,
                [DESTINATION_BLOCK]: DestinationBlock,
                [MODULE_BLOCK]: ModuleBlock,
            }
        }
    };
    const {graph, setEntities, start} = useGraph(config);
    const {state} = useProject();
    const {project, isLoaded} = state;

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
                width: 120,
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
                        id: `input`,
                        blockId: node.id,
                        type: EAnchorType.IN,
                        index: 0
                    },
                    {
                        id: `output`,
                        blockId: node.id,
                        type: EAnchorType.OUT,
                        index: 1
                    }
                ];
            } else if (node.type === 'source') {
                block.anchors = [
                    {
                        id: `output`,
                        blockId: node.id,
                        type: EAnchorType.OUT,
                        index: 0
                    }
                ];
            } else if (node.type === 'destination') {
                block.anchors = [
                    {
                        id: `input`,
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
                sourceAnchorId: `output`,
                targetBlockId: edge.target,
                targetAnchorId: `input`,
            });
        });

        setEntities({blocks, connections});
    }, [setEntities, project, isLoaded]);

    const {selectElement} = useSelection();

    const onBlockSelectionChange = useCallback(
        (detail: SelectionEvent<TBlockId>) => {
            const blockId = detail.list[0];
            const node = project?.schema.nodes?.find(n => n.id === blockId);

            selectElement(node || null);
        },
        [project?.schema.nodes, selectElement]
    );

    return (
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
        />
    );
}

export default Editor;
