import { Button, DropdownMenu } from '@gravity-ui/uikit';

function MenuContainer() {
    return (
        <div style={{ padding: '4px 8px', display: 'flex', gap: '4px' }} id="menu-container">
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

            <DropdownMenu
                switcher={
                    <Button view="flat" size="l">
                        Сборка
                    </Button>
                }
                items={[
                    {
                        text: 'Собрать проект',
                        action: () => {
                            console.log('Собрать проект');
                        }
                    },
                    {
                        text: 'Пересобрать проект',
                        action: () => {
                            console.log('Пересобрать проект');
                        }
                    }
                ]}
            />
        </div>
    );
}

export default MenuContainer;
