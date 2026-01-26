import { Text } from '@gravity-ui/uikit';
import MenuContainer from './components/MenuContainer';
import WindowButtonContainer from './components/WindowButtonContainer';

function MainPage() {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'transparent',
                borderBottom: '1px solid #666',
                height: '40px'
            }}>
                <MenuContainer />
                <WindowButtonContainer />
            </div>

            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                <Text variant="header-1">Главное окно No-Code IDE</Text>
                <Text>Здесь будет основное содержимое приложения</Text>
            </div>
        </div>
    );
}

export default MainPage;
