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
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, rgba(44, 62, 80, 0.95) 0%, rgba(52, 73, 94, 0.95) 100%)',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                border: '2px solid rgba(52, 152, 219, 0.4)',
                transition: 'all 0.2s ease',
            }}>
                <Icon
                    data={ModuleIcon}
                    size={32}
                    color="link"
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
                    <Text variant="caption-2" style={{
                        color: '#bdc3c7',
                        fontSize: '10px',
                    }}>
                        Модуль
                    </Text>
                </div>
            </div>
        </GraphBlock>
    );
};
