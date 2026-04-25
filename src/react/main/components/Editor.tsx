import { EAnchorType, Graph, GraphState, type TBlock } from '@gravity-ui/graph';
import { GraphCanvas, useGraph, GraphBlock } from '@gravity-ui/graph/react';
import { useEffect } from 'react';

function Editor() {
  const config = {};
  const { graph, setEntities, start } = useGraph(config);

  useEffect(() => {
    setEntities({
      blocks: [
        {
          is: "block-action",
          id: "action_1",
          x: -100,
          y: -450,
          width: 126,
          height: 126,
          selected: true,
          name: "Block #1",
          anchors: [
            {
              id: "out1",
              blockId: "action_1",
              type: EAnchorType.OUT,
              index: 0
            }
          ],
        },
        {
          id: "action_2",
          is: "block-action",
          x: 253,
          y: 176,
          width: 126,
          height: 126,
          selected: false,
          name: "Block #2",
          anchors: [
            {
              id: "in1",
              blockId: "action_2",
              type: EAnchorType.IN,
              index: 0
            }
          ],
        }
      ],
      connections: [
        {
          sourceBlockId: "action_1",
          sourceAnchorId: "out1",
          targetBlockId: "action_2",
          targetAnchorId: "in1",
        }
      ]
    });
  }, [setEntities]);

  const renderBlockFn = (graph: Graph, block: TBlock) => {
    return <GraphBlock graph={graph} block={block}>{block.id}</GraphBlock>;
  };

  return (
      <GraphCanvas
          graph={graph}
          renderBlock={renderBlockFn}
          onStateChanged={({ state }) => {
            if (state === GraphState.ATTACHED) {
              start();
              graph.zoomTo("center");
            }
          }}
      />
  );
}

export default Editor;
