import { useState } from 'react';
import { ChevronLeft } from '@gravity-ui/icons';
import { Button, Icon } from '@gravity-ui/uikit';
import ElementProperties from '../components/ElementProperties';

function PropertiesContainer() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            {!isCollapsed && (
                <Button
                    view="flat"
                    size="s"
                    onClick={() => setIsCollapsed(true)}
                    style={{ borderRadius: 0 }}
                >
                    <Icon data={ChevronLeft} size={16} />
                </Button>
            )}
            {isCollapsed && (
                <Button
                    view="flat"
                    size="s"
                    onClick={() => setIsCollapsed(false)}
                    style={{ borderRadius: 0, borderLeft: '1px solid #ccc' }}
                >
                    <Icon data={ChevronLeft} size={16} style={{ transform: 'rotate(180deg)' }} />
                </Button>
            )}
            <ElementProperties isCollapsed={isCollapsed} />
        </>
    );
}

export default PropertiesContainer;
