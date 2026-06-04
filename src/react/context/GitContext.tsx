import {createContext, useContext, useState, useCallback} from 'react';

export interface GitStatus {
    modified: string[];
    added: string[];
    deleted: string[];
    untracked: string[];
}

export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: string;
}

interface GitContextType {
    isInitialized: boolean;
    status: GitStatus;
    log: GitCommit[];
    initRepository: (path: string) => Promise<void>;
    addFiles: (path: string, files?: string[]) => Promise<void>;
    commit: (path: string, message: string) => Promise<void>;
    push: (path: string, remote?: string, branch?: string) => Promise<void>;
    refreshStatus: (path: string) => Promise<void>;
    refreshLog: (path: string, limit?: number) => Promise<void>;
}

const GitContext = createContext<GitContextType | undefined>(undefined);

export function GitProvider({children}: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [status, setStatus] = useState<GitStatus>({
        modified: [],
        added: [],
        deleted: [],
        untracked: []
    });
    const [log, setLog] = useState<GitCommit[]>([]);

    const initRepository = useCallback(async (path: string) => {
        await window.electron.initGitRepository(path);
        setIsInitialized(true);
        await refreshStatus(path);
    }, []);

    const addFiles = useCallback(async (path: string, files: string[] = ['.']) => {
        await window.electron.addGitFiles(path, files);
        await refreshStatus(path);
    }, []);

    const commit = useCallback(async (path: string, message: string) => {
        await window.electron.commitGit(path, message);
        await refreshStatus(path);
        await refreshLog(path);
    }, []);

    const push = useCallback(async (path: string, remote: string = 'origin', branch: string = 'main') => {
        await window.electron.pushGit(path, remote, branch);
    }, []);

    const refreshStatus = useCallback(async (path: string) => {
        const result = await window.electron.getGitStatus(path);
        setStatus(result);
        const isGitRepo = await window.electron.isGitRepository(path);
        setIsInitialized(isGitRepo);
    }, []);

    const refreshLog = useCallback(async (path: string, limit: number = 10) => {
        const result = await window.electron.getGitLog(path, limit);
        setLog(result);
    }, []);

    return (
        <GitContext.Provider value={{
            isInitialized,
            status,
            log,
            initRepository,
            addFiles,
            commit,
            push,
            refreshStatus,
            refreshLog
        }}>
            {children}
        </GitContext.Provider>
    );
}

export function useGit() {
    const context = useContext(GitContext);
    if (!context) {
        throw new Error('useGit must be used within a GitProvider');
    }
    return context;
}
