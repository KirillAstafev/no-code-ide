import { Text } from '@gravity-ui/uikit';

interface ElementPropertiesProps {
    isCollapsed: boolean;
}

function ElementProperties({ isCollapsed }: ElementPropertiesProps) {
    if (isCollapsed) {
        return null;
    }

    return (
        <div
            style={{
                width: '20%',
                minWidth: '200px',
                borderLeft: '1px solid #ccc',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    borderBottom: '1px solid #ccc'
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
