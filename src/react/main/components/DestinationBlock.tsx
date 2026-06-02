import { Text } from '@gravity-ui/uikit';
import { GraphBlock } from '@gravity-ui/graph/react';
import { Database as DestinationIcon } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';

interface DestinationBlockProps {
    graph: any;
    block: any;
}

export const DestinationBlock = ({ graph, block }: DestinationBlockProps) => {
    return (
        <GraphBlock graph={graph} block={block}>
            <div style={{
                display: 'flex',
                flexDirection: "column",
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box'
            }}>
                <Icon
                    data={DestinationIcon}
                    size={24}
                    color="positive"
                />
                <Text variant="body-2">
                    {block.name}
                </Text>
            </div>
        </GraphBlock>
    );
};