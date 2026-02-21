import { Button, DropdownMenu } from '@gravity-ui/uikit';

function MenuContainer() {
    return (
        <div style={{ padding: '4px 8px' }} id="menu-container">
            <DropdownMenu
                switcher={
                    <Button view="flat" size="l">
                        Файл
                    </Button>
                }
                items={[
                    {
                        text: 'Создать новый проект',
                        action: () => {
                            console.log('Создать новый проект');
                        }
                    },
                    {
                        text: 'Открыть проект',
                        action: () => {
                            console.log('Открыть проект');
                        }
                    },
                    {
                        text: 'Закрыть',
                        action: () => {
                            window.electron.closeWindow();
                        }
                    }
                ]}
            />
        </div>
    );
}

export default MenuContainer;
