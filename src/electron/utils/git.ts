import {SimpleGit, simpleGit} from 'simple-git';

export function getGitInstance(path: string): SimpleGit {
    return simpleGit(path);
}

export async function initGitRepository(path: string): Promise<void> {
    const git = getGitInstance(path);
    await git.init();
}

export async function addGitFiles(path: string, files: string[] = ['.']): Promise<void> {
    const git = getGitInstance(path);
    await git.add(files);
}

export async function commitGit(path: string, message: string): Promise<void> {
    const git = getGitInstance(path);
    await git.commit(message);
}

export async function pushGit(path: string, remote: string = 'origin', branch: string = 'main'): Promise<void> {
    const git = getGitInstance(path);
    await git.push(remote, branch);
}

export async function cloneGitRepository(url: string, path: string): Promise<void> {
    const git = simpleGit();
    await git.clone(url, path);
}

export async function getGitStatus(path: string): Promise<{ modified: string[], added: string[], deleted: string[], untracked: string[] }> {
    const git = getGitInstance(path);
    const status = await git.status();
    
    const extractPaths = (items: any[]): string[] => {
        return items.map(item => typeof item === 'string' ? item : (item as {path?: string}).path || String(item));
    };
    
    return {
        modified: extractPaths(status.modified),
        added: extractPaths(status.staged),
        deleted: extractPaths(status.deleted),
        untracked: extractPaths(status.not_added)
    };
}

export async function getGitLog(path: string, limit: number = 10): Promise<{ hash: string, message: string, author: string, date: string }[]> {
    const git = getGitInstance(path);
    const log = await git.log({maxCount: limit});
    
    return log.all.map(commit => ({
        hash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        date: commit.date
    }));
}

export async function isGitRepository(path: string): Promise<boolean> {
    const git = getGitInstance(path);
    try {
        await git.revparse('--show-toplevel');
        return true;
    } catch {
        return false;
    }
}
