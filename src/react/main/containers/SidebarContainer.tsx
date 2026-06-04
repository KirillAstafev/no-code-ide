import ProjectEditor from '../components/ProjectEditor';
import ElementPanel from '../components/ElementPanel';
import GitPanel from '../../git/components/GitPanel';
import { useState } from 'react';
import { Button } from '@gravity-ui/uikit';

function SidebarContainer() {
    const [activeTab, setActiveTab] = useState('project');

    return (
        <div
            style={{
                width: '300px',
                borderRight: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <div style={{
                display: 'flex',
                borderBottom: '1px solid #666',
                flexShrink: 0
            }}>
                <Button
                    size="s"
                    view={activeTab === 'project' ? 'raised' : 'flat'}
                    onClick={() => setActiveTab('project')}
                    style={{flex: 1}}
                >
                    Проект
                </Button>
                <Button
                    size="s"
                    view={activeTab === 'git' ? 'raised' : 'flat'}
                    onClick={() => setActiveTab('git')}
                    style={{flex: 1}}
                >
                    Git
                </Button>
            </div>
            <div style={{flex: 1, overflowY: 'auto'}}>
                {activeTab === 'project' && (
                    <div style={{display: 'flex', flexDirection: 'column'}}>
                        <ProjectEditor />
                        <div style={{ height: '1px', backgroundColor: '#666' }}/>
                        <ElementPanel />
                    </div>
                )}
                {activeTab === 'git' && <GitPanel />}
            </div>
        </div>
    );
}

export default SidebarContainer;
