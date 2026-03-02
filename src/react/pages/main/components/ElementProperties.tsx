import { Text } from '@gravity-ui/uikit';

interface ElementPropertiesProps {
    isCollapsed: boolean;
}

function ElementProperties({ isCollapsed }: ElementPropertiesProps) {
    return (
        <div
            style={{
                width: isCollapsed ? '0' : '20%',
                minWidth: isCollapsed ? '0' : '200px',
                borderLeft: '1px solid #ccc',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease, min-width 0.3s ease'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderBottom: '1px solid #ccc',
                    flexShrink: 0
                }}
            >
                <Text variant="subheader-2">Свойства</Text>
            </div>
            <div style={{ padding: '16px', flex: 1, overflow: 'auto' }}>
                {/* Здесь будет содержимое панели свойств */}
            </div>
        </div>
    );
}

export default ElementProperties;
