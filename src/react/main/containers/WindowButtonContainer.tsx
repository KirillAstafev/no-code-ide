import { Button, Icon } from '@gravity-ui/uikit';
import { Xmark, MinusShapeFill, Minus } from '@gravity-ui/icons';
import {useWindow} from "../../context/WindowContext.tsx";

function WindowButtonContainer() {
    const { state: windowState } = useWindow();
    const { windowId } = windowState;

    return (
        <div style={{ display: 'flex', gap: '4px' }} id="window-button-container">
            <Button view="flat" size="xl"
                    onClick={() => window.electron.minimizeWindow(windowId!)
                    }
            >
                <Icon data={Minus} size={16} />
            </Button>
            <Button view="flat" size="xl"
                    onClick={() => window.electron.maximizeWindow(windowId!)}
            >
                <Icon data={MinusShapeFill} size={16} />
            </Button>
            <Button view="flat" size="xl"
                    onClick={() => window.electron.closeWindow(windowId!)
                    }
            >
                <Icon data={Xmark} size={16} />
            </Button>
        </div>
    );
}

export default WindowButtonContainer;
