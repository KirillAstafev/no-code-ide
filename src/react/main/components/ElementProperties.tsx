import { Text } from '@gravity-ui/uikit';
import {useSelection} from "../../context/SelectionContext.tsx";


interface ElementPropertiesProps {
    isCollapsed: boolean;
}

function ElementProperties({ isCollapsed }: ElementPropertiesProps) {
    const { selectedElement } = useSelection();
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
                {selectedElement ? (
                    <div>
                        <div style={{ marginBottom: '12px' }}>
                            <Text variant="subheader-2">{selectedElement.label}</Text>
                            <Text variant="caption-1" color="secondary">{selectedElement.type}</Text>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <Text variant="body-2" style={{ marginBottom: '4px' }}>ID</Text>
                            <Text variant="caption-1">{selectedElement.id}</Text>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <Text variant="body-2" style={{ marginBottom: '4px' }}>Тип</Text>
                            <Text variant="caption-1">{selectedElement.type}</Text>
                        </div>
                        {selectedElement.data && (
                            <div>
                                <Text variant="subheader-2" style={{ marginTop: '16px', marginBottom: '8px' }}>Данные</Text>
                                {Object.entries(selectedElement.data).map(([key, value]) => (
                                    <div key={key} style={{ marginBottom: '8px' }}>
                                        <Text variant="body-2" style={{ marginBottom: '4px' }}>{key}</Text>
                                        <Text variant="caption-1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <Text variant="body-2" color="secondary">Выберите элемент на холсте</Text>
                )}
            </div>
        </div>
    );
}

export default ElementProperties;
