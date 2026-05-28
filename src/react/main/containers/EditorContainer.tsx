import Editor from '../components/Editor';
import PropertiesContainer from './PropertiesContainer';

function EditorContainer() {
    return (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <Editor />
            <PropertiesContainer />
        </div>
    );
}

export default EditorContainer;