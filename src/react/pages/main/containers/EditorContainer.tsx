import { Tab, TabList, TabProvider } from '@gravity-ui/uikit';
import Editor from '../components/Editor';
import PropertiesContainer from './PropertiesContainer';

function EditorContainer() {
    const tabs = [
        { id: 'tab1', title: 'Модуль обработки НЕВА 03-Ф (Postgresql)' },
        { id: 'tab2', title: 'Модуль обработки в Kafka' },
        { id: 'tab3', title: 'Модуль обработки в Prometheus' },
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
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Editor />
                <PropertiesContainer />
            </div>
        </div>
    );
}

export default EditorContainer;
