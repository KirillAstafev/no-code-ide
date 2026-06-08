import MenuContainer from '../containers/MenuContainer.tsx';
import WindowButtonContainer from '../containers/WindowButtonContainer.tsx';
import MainContentContainer from "../containers/MainContentContainer.tsx";
import BuildProgressPanel from "../components/BuildProgressPanel";

function MainPage() {
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
            <BuildProgressPanel />
        </div>
    );
}

export default MainPage;
