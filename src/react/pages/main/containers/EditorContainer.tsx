import { useState } from 'react';
import { Tab, TabList, TabProvider, Button } from '@gravity-ui/uikit';
import Editor from '../components/Editor';
import ElementProperties from '../components/ElementProperties';

function EditorContainer() {
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
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
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Editor />
                </div>
                <div style={{ position: 'absolute', right: '16px', top: '16px', zIndex: 10 }}>
                    <Button
                        view={isPropertiesOpen ? 'normal' : 'flat'}
                        onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
                    >
                        Свойства
                    </Button>
                </div>
                <ElementProperties
                    isOpen={isPropertiesOpen}
                    onClose={() => setIsPropertiesOpen(false)}
                />
            </div>
        </div>
    );
}

export default EditorContainer;
