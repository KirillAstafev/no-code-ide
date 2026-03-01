import { Drawer } from '@gravity-ui/uikit';

interface ElementPropertiesProps {
    isOpen: boolean;
    onClose: () => void;
}

function ElementProperties({ isOpen, onClose }: ElementPropertiesProps) {
    return (
        <Drawer
            open={isOpen}
            onOpenChange={onClose}
            placement="right"
            resizable
            size={300}
            hideVeil={true}
        >
            <Drawer.Header title="Свойства" />
            <Drawer.Content>
                {/* Здесь будет содержимое панели свойств */}
            </Drawer.Content>
        </Drawer>
    );
}

export default ElementProperties;
