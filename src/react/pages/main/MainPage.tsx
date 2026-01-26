import MenuContainer from './components/MenuContainer';
import WindowButtonContainer from './components/WindowButtonContainer';
import MainContentContainer from "./components/MainContentContainer.tsx";

function MainPage() {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #666',
                height: '40px'
            }}>
                <MenuContainer/>
                <WindowButtonContainer/>
            </div>

            <MainContentContainer/>
        </div>
    );
}

export default MainPage;
