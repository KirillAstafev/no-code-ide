import { Text } from '@gravity-ui/uikit';
import { GraphBlock } from '@gravity-ui/graph/react';
import { Cpu as ModuleIcon } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';

interface ModuleBlockProps {
    graph: any;
    block: any;
}

export const ModuleBlock = ({ graph, block }: ModuleBlockProps) => {
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
                boxSizing: 'border-box',
                background: 'rgba(0, 0, 0, 0.8)',
                borderRadius: 'var(--g-border-radius-m)',
            }}>
                <Icon
                    data={ModuleIcon}
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