import Editor from '../components/Editor';
import PropertiesContainer from './PropertiesContainer';
import {SelectionProvider} from "../../context/SelectionContext.tsx";


function EditorContainer() {
    return (
        <SelectionProvider>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Editor />
                <PropertiesContainer />
            </div>
        </SelectionProvider>
    );
}

export default EditorContainer;