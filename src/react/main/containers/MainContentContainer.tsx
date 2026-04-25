import SidebarContainer from "./SidebarContainer.tsx";
import EditorContainer from "./EditorContainer.tsx";

function MainContentContainer() {
    return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <SidebarContainer/>
            <EditorContainer/>
        </div>
    );
}

export default MainContentContainer;
