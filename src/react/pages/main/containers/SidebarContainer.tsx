import ProjectEditor from '../components/ProjectEditor';
import ElementPanel from '../components/ElementPanel';

function SidebarContainer() {
    return (
        <div
            style={{
                width: '250px',
                borderRight: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <ProjectEditor />
            <div style={{ height: '1px', backgroundColor: '#666' }}/>
            <ElementPanel />
        </div>
    );
}

export default SidebarContainer;