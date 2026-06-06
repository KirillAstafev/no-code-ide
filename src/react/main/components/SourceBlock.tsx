import { Text } from '@gravity-ui/uikit';
import { GraphBlock } from '@gravity-ui/graph/react';
import { Calculator as SourceIcon } from '@gravity-ui/icons';
import { Icon } from '@gravity-ui/uikit';

interface SourceBlockProps {
    graph: any;
    block: any;
}

export const SourceBlock = ({ graph, block }: SourceBlockProps) => {
    return (
        <GraphBlock graph={graph} block={block}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.95) 0%, rgba(46, 204, 113, 0.95) 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(46, 204, 113, 0.5)',
                transition: 'all 0.2s ease',
            }}>
                <Icon
                    data={SourceIcon}
                    size={32}
                    color="positive"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                />
                <div style={{
                    width: '100%',
                    textAlign: 'center',
                }}>
                    <Text variant="body-2" style={{
                        fontWeight: '600',
                        color: '#ecf0f1',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    }}>
                        {block.name}
                    </Text>
                </div>
            </div>
        </GraphBlock>
    );
};
