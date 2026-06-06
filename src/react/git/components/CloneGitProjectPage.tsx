import React from 'react';
import { Modal, Text, TextInput, Button, Alert } from '@gravity-ui/uikit';

interface CloneGitProjectPageProps {
    open: boolean;
    onClose: () => void;
    onClone: (url: string, path: string) => void;
}

export const CloneGitProjectPage: React.FC<CloneGitProjectPageProps> = ({
    open,
    onClose,
    onClone,
}) => {
    const [url, setUrl] = React.useState('');
    const [path, setPath] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);

    const handleSelectFolder = async () => {
        const folder = await window.electron.selectFolder();
        if (folder) {
            setPath(folder);
        }
    };

    const validate = (): string | null => {
        if (!url.trim()) {
            return 'Введите URL репозитория';
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'URL должен начинаться с http:// или https://';
        }
        if (!path.trim()) {
            return 'Выберите папку для клонирования';
        }
        return null;
    };

    const handleClone = () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        onClone(url.trim(), path.trim());
        setUrl('');
        setPath('');
        setError(null);
        onClose();
    };

    const handleChangeUrl = (value: string) => {
        setUrl(value);
        if (error) {
            setError(null);
        }
    };

    const handleChangePath = (value: string) => {
        setPath(value);
        if (error) {
            setError(null);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Text variant="header-2">Открыть проект из Git</Text>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <Text variant="body-1" style={{ marginBottom: '12px' }}>
                        URL репозитория
                    </Text>
                    <TextInput
                        value={url}
                        onUpdate={handleChangeUrl}
                        hasClear
                        style={{ width: '100%', marginTop: '12px' }}
                        autoFocus
                        size="l"
                        placeholder="https://github.com/user/repo.git"
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Text variant="body-1" style={{ marginBottom: '12px' }}>
                        Папка для клонирования
                    </Text>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <TextInput
                            value={path}
                            onUpdate={handleChangePath}
                            hasClear
                            style={{ width: '100%' }}
                            size="l"
                            placeholder="C:/Users/.../project"
                        />
                        <Button onClick={handleSelectFolder} size="l">
                            Обзор
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert
                        theme="danger"
                        message={error}
                        style={{ marginBottom: '16px' }}
                    />
                )}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        borderTop: '1px solid var(--g-color-line-generic)',
                        paddingTop: '16px',
                    }}
                >
                    <Button view="flat" size="m" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        view="action"
                        size="m"
                        onClick={handleClone}
                        disabled={!url.trim() || !path.trim()}
                    >
                        Клонировать
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
