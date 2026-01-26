import { Tab, TabList, TabProvider, Text } from '@gravity-ui/uikit';

function EditorContainer() {
    // Пример данных для вкладок
    const tabs = [
        { id: 'tab1', title: 'Новый файл 1' },
        { id: 'tab2', title: 'Новый файл 2' },
        { id: 'tab3', title: 'Новый файл 3' },
    ];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <TabProvider>
                <TabList style={{ padding: '0 16px' }}>
                    {tabs.map((tab, index) => (
                        <Tab key={tab.id} id={tab.id} value={String(index)}>
                            {tab.title}
                        </Tab>
                    ))}
                </TabList>
            </TabProvider>
            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
                <Text variant="body-1">Редактор кода</Text>
                <div style={{ marginTop: '16px', height: '100%', border: '1px solid #ccc', borderRadius: '4px', padding: '8px' }}>
                </div>
            </div>
        </div>
    );
}

export default EditorContainer;