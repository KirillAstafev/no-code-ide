import { Button, Modal, TextInput } from '@gravity-ui/uikit';
import { useState } from 'react';

interface CreateProjectPageProps {
    open: boolean;
    onClose: () => void;
    onCreate: (projectName: string) => void;
}

function CreateProjectPage({ open, onClose, onCreate }: CreateProjectPageProps) {
    const [projectName, setProjectName] = useState('');

    const handleCreateProject = () => {
        if (projectName.trim()) {
            onCreate(projectName.trim());
            setProjectName('');
        }
    };

    const handleClose = () => {
        setProjectName('');
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                    Создание нового проекта
                </h2>
                <TextInput
                    label="Название проекта"
                    placeholder="Введите название проекта"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && projectName.trim()) {
                            handleCreateProject();
                        }
                    }}
                    autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    <Button onClick={handleClose}>
                        Отмена
                    </Button>
                    <Button
                        view="action"
                        onClick={handleCreateProject}
                        disabled={!projectName.trim()}
                    >
                        Создать
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default CreateProjectPage;
