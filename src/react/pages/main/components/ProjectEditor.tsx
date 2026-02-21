import { Text } from '@gravity-ui/uikit';

function ProjectEditor() {
    return (
        <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
            <Text variant="subheader-2">Проекты</Text>
            <div style={{ marginTop: '16px' }}>
                <Text>Проект 1</Text><br/>
                <Text>Проект 2</Text><br/>
                <Text>Проект 3</Text>
            </div>
        </div>
    );
}

export default ProjectEditor;
