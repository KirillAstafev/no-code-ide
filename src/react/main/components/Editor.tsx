import {EAnchorType, Graph, GraphState, type TBlock, type TBlockId} from '@gravity-ui/graph';
import {GraphCanvas, useGraph, GraphBlock} from '@gravity-ui/graph/react';
import {useCallback, useEffect} from 'react';
import {useProject} from "../../context/ProjectContext.tsx";
import {useSelection} from "../../context/SelectionContext.tsx";
import type {SelectionEvent} from "@gravity-ui/graph/build/graphEvents";

function Editor() {
    const config = {};
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
            const block: TBlock = {
                id: node.id,
                is: `block-${node.type}`,
                x: node.x || 0,
                y: node.y || 0,
                width: 126,
                height: 126,
                name: node.label,
                anchors: []
            };

            if (node.type === 'module') {
                block.anchors = [
                    {
                        id: `${node.id}-out`,
                        blockId: node.id,
                        type: EAnchorType.OUT,
                        index: 0
                    }
                ];
            } else if (node.type === 'source' || node.type === 'destination') {
                block.anchors = [
                    {
                        id: `${node.id}-in`,
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
                sourceAnchorId: `${edge.source}-out`,
                targetBlockId: edge.target,
                targetAnchorId: `${edge.target}-in`,
            });
        });

        setEntities({blocks, connections});
    }, [setEntities, project, isLoaded]);

    const renderBlockFn = (graph: Graph, block: TBlock) => {
        return <GraphBlock graph={graph} block={block}>{block.name}</GraphBlock>;
    };

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
            renderBlock={renderBlockFn}
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
