import { Tab, TabList, TabProvider } from '@gravity-ui/uikit';
import Editor from '../components/Editor';

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
            <Editor />
        </div>
    );
}

export default EditorContainer;