import { Button, Icon } from '@gravity-ui/uikit';
import { Xmark, MinusShapeFill, Minus } from '@gravity-ui/icons';

function WindowButtonContainer() {
    return (
        <div style={{ display: 'flex', gap: '4px' }} id="window-button-container">
            <Button view="flat" size="xl">
                <Icon data={Minus} size={16} />
            </Button>
            <Button view="flat" size="xl">
                <Icon data={MinusShapeFill} size={16} />
            </Button>
            <Button view="flat" size="xl">
                <Icon data={Xmark} size={16} />
            </Button>
        </div>
    );
}

export default WindowButtonContainer;