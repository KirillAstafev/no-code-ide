import {useEffect, useState} from 'react';
import {useProject} from "../../context/ProjectContext.tsx";
import {useGit} from "../../context/GitContext.tsx";
import {Button, Loader} from "@gravity-ui/uikit";

function GitPanel() {
    const {state} = useProject();
    const {isInitialized, status, initRepository, addFiles, commit, push, refreshStatus} = useGit();
    const [isInitializing, setIsInitializing] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const projectPath = state.project?.location;

    useEffect(() => {
        const checkGitRepository = async () => {
            if (projectPath) {
                const isGitRepo = await window.electron.isGitRepository(projectPath);
                if (isGitRepo) {
                    await refreshStatus(projectPath);
                }
            }
        };

        if (projectPath) {
            checkGitRepository();
        }
    }, [projectPath, refreshStatus]);

    const handleInitRepository = async () => {
        if (!projectPath) return;
        setIsInitializing(true);
        try {
            await initRepository(projectPath);
            alert('Git-репозиторий инициализирован');
        } catch (err) {
            alert(`Ошибка инициализации: ${(err as Error).message}`);
        } finally {
            setIsInitializing(false);
        }
    };

    const handleAddFiles = async () => {
        if (!projectPath) return;
        try {
            await addFiles(projectPath, ['.']);
            alert('Файлы добавлены в индекс');
        } catch (err) {
            alert(`Ошибка добавления файлов: ${(err as Error).message}`);
        }
    };

    const handleCommit = async () => {
        if (!projectPath || !commitMessage.trim()) return;
        setIsCommitting(true);
        try {
            await commit(projectPath, commitMessage);
            setCommitMessage('');
            alert('Коммит успешно создан');
        } catch (err) {
            alert(`Ошибка коммита: ${(err as Error).message}`);
        } finally {
            setIsCommitting(false);
        }
    };

    const handlePush = async () => {
        if (!projectPath) return;
        setIsPushing(true);
        try {
            await push(projectPath, 'origin', 'main');
            alert('Изменения отправлены в репозиторий');
        } catch (err) {
            alert(`Ошибка пуша: ${(err as Error).message}`);
        } finally {
            setIsPushing(false);
        }
    };

    if (!projectPath) return null;

    return (
        <div style={{
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '100%',
            overflowY: 'auto',
            boxSizing: 'border-box'
        }}>
            <div>
                {!isInitialized ? (
                    <div style={{marginTop: '8px'}}>
                        <Button
                            size="m"
                            view="action"
                            onClick={handleInitRepository}
                            disabled={isInitializing}
                        >
                            {isInitializing ? <Loader size="s"/> : 'Инициализировать Git'}
                        </Button>
                    </div>
                ) : (
                    <div>
                        <div style={{marginTop: '8px'}}>
                            <div>
                                <div style={{fontSize: '14px', marginBottom: '4px'}}>Изменённые файлы:</div>
                                {status.modified.length === 0 ? (
                                    <div style={{fontSize: '13px', color: 'var(--g-color-text-secondary)'}}>Нет</div>
                                ) : (
                                    <ul style={{margin: '4px 0', paddingLeft: '20px'}}>
                                        {status.modified.map((file: string) => (
                                            <li key={file}><div style={{fontSize: '13px'}}>{file}</div></li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div style={{marginTop: '8px'}}>
                                <div style={{fontSize: '14px', marginBottom: '4px'}}>Новые файлы:</div>
                                {status.untracked.length === 0 ? (
                                    <div style={{fontSize: '13px', color: 'var(--g-color-text-secondary)'}}>Нет</div>
                                ) : (
                                    <ul style={{margin: '4px 0', paddingLeft: '20px'}}>
                                        {status.untracked.map((file: string) => (
                                            <li key={file}><div style={{fontSize: '13px'}}>{file}</div></li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isInitialized && (
                <>
                    <div>
                        <Button
                            size="m"
                            view="flat"
                            onClick={handleAddFiles}
                            disabled={status.modified.length === 0 && status.untracked.length === 0}
                        >
                            Добавить все изменения
                        </Button>
                    </div>

                    <div>
                        <textarea
                            style={{
                                width: '95%',
                                minHeight: '60px',
                                padding: '8px',
                                border: '1px solid var(--g-color-border-default)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--g-color-bg-default)',
                                color: 'var(--g-color-text-primary)',
                                resize: 'vertical'
                            }}
                            placeholder="Введите сообщение коммита..."
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            disabled={isCommitting}
                        />
                    </div>

                    <div style={{display: 'flex'}}>
                        <Button
                            size="m"
                            view="action"
                            onClick={handleCommit}
                            disabled={isCommitting || !commitMessage.trim()}
                            style={{flex: 1}}
                        >
                            {isCommitting ? <Loader size="s"/> : 'Создать коммит'}
                        </Button>
                        <Button
                            size="m"
                            view="flat"
                            onClick={handlePush}
                            disabled={isPushing}
                            style={{flex: 1}}
                        >
                            {isPushing ? <Loader size="s"/> : 'Отправить'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

export default GitPanel;
