import { Text } from '@gravity-ui/uikit';
import {useSelection} from "../../context/SelectionContext.tsx";
import {useProject} from "../../context/ProjectContext.tsx";
import { SourceProperties } from "./SourceProperties";
import { DestinationProperties } from "./DestinationProperties";
import { ModuleProperties } from "./ModuleProperties";
import { useEffect } from 'react';


interface ElementPropertiesProps {
    isCollapsed: boolean;
}

function ElementProperties({ isCollapsed }: ElementPropertiesProps) {
    const { selectedElement, selectElement } = useSelection();
    const { state } = useProject();
    const { isLoaded } = state;

    useEffect(() => {
        if (!isLoaded) {
            selectElement(null);
        }
    }, [isLoaded, selectElement]);

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
                        {selectedElement.type === 'source' && selectedElement.data && (
                            <SourceProperties data={selectedElement.data as DataSource} />
                        )}

                        {selectedElement.type === 'destination' && selectedElement.data && (
                            <DestinationProperties data={selectedElement.data as DataDestination} />
                        )}

                        {selectedElement.type === 'module' && selectedElement.data && (
                            <ModuleProperties data={selectedElement.data as Module} />
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
