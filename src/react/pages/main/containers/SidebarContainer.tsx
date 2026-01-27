import { Text } from '@gravity-ui/uikit';

function SidebarContainer() {
    return (
        <div
            style={{
                width: '250px',
                borderRight: '1px solid #ccc',
                padding: '16px',
                overflow: 'auto'
            }}
        >
            <Text variant="subheader-2">Проекты</Text>
            <div style={{ marginTop: '16px' }}>
                <Text>Проект 1</Text><br/>
                <Text>Проект 2</Text><br/>
                <Text>Проект 3</Text>
            </div>
            
            <Text variant="subheader-2" style={{ marginTop: '16px' }}>Файлы</Text>
            <div style={{ marginTop: '16px' }}>
                <Text>index.js</Text><br/>
                <Text>style.css</Text><br/>
                <Text>config.json</Text>
            </div>
        </div>
    );
}

export default SidebarContainer;