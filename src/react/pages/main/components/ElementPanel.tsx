import { Text } from '@gravity-ui/uikit';

function ElementPanel() {
    return (
        <div style={{ flex: 2, padding: '16px', overflow: 'auto', borderTop: '1px solid #ccc' }}>
            <Text variant="subheader-2">Файлы</Text>
            <div style={{ marginTop: '16px' }}>
                <Text>index.js</Text><br/>
                <Text>style.css</Text><br/>
                <Text>config.json</Text>
            </div>
        </div>
    );
}

export default ElementPanel;
