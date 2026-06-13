import React, {useState, useEffect, useRef} from 'react';
import {Button, Modal, Text} from '@gravity-ui/uikit';
import {useProject} from "../context/ProjectContext.tsx";

interface TestRunPageProps {
    open: boolean;
    onClose: () => void;
}

const TestRunPage: React.FC<TestRunPageProps> = ({open, onClose}) => {
    const {state} = useProject();
    const {project} = state;

    const [testOutput, setTestOutput] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [testOutput]);
    
    useEffect(() => {
        if (open && project) {
            const startTest = async () => {
                if (!project) return;

                try {
                    const result = await window.electron.runTest(project);

                    if (!result.success) {
                        setTestOutput(prev => prev + `Ошибка запуска теста: ${result.error}\n`);
                    }
                } catch (err) {
                    setTestOutput(prev => prev + `Ошибка запуска теста: ${(err as Error).message}\n`);
                }
            };
            
            startTest();
        }
    }, [open, project]);

    const handleStopTest = async () => {
        if (!isRunning) return;
        
        setTestOutput(prev => prev + 'Остановка теста...\n');
        setIsRunning(false);
        
        try {
            await window.electron.stopTest();
            setTestOutput(prev => prev + 'Тест успешно остановлен\n');
        } catch (err) {
            setTestOutput(prev => prev + `Ошибка остановки теста: ${(err as Error).message}\n`);
        }
    };

    const handleClearOutput = () => {
        setTestOutput('');
    };

    useEffect(() => {
        const handleRunTestProgress = (_event: any, { type, payload }: any) => {
            switch (type) {
                case 'stage':
                    console.log(`Тест: ${payload.stage}`);
                    if (payload.stage === 'running') {
                        setIsRunning(true);
                    } else if (payload.stage === 'configuring') {
                        setIsRunning(false);
                    }
                    break;
                case 'output':
                    if (payload.output && payload.output.trim()) {
                        const outputElem = document.getElementById('test-output');
                        if (outputElem) {
                            const timestamp = new Date().toLocaleTimeString();
                            outputElem.innerHTML += `<div><span style="color: #888;">[${timestamp}]</span> ${payload.output}</div>`;
                            outputElem.scrollTop = outputElem.scrollHeight;
                        }
                    }
                    break;
                case 'process-info':
                    if (payload.pid) {
                        console.log(`PID процесса теста: ${payload.pid}`);
                    }
                    break;
                case 'finish':
                    console.log(`Тест завершен: ${payload.success}`);
                    setIsRunning(false);
                    break;
                case 'error':
                    console.error(`Ошибка теста: ${payload.message}`);
                    setIsRunning(false);
                    break;
            }
        };

        window.electron.on('run-test-progress', handleRunTestProgress);

        return () => {
            window.electron.off('run-test-progress', handleRunTestProgress);
        };
    }, []);

    const styles = {
        modalContent: {
            width: '1000px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column' as const,
        },
        header: {
            padding: '16px',
            borderBottom: '1px solid var(--g-color-line-generic)',
        },
        body: {
            padding: '16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px',
        },
        outputContainer: {
            height: '650px',
            backgroundColor: '#f5f5f5',
            color: '#333',
            border: '1px solid var(--g-color-line-generic)',
            borderRadius: '4px',
            padding: '12px',
            overflowY: 'auto' as const,
            fontFamily: 'monospace',
            fontSize: '13px',
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-all' as const,
        },
        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px',
            borderTop: '1px solid var(--g-color-line-generic)',
            gap: '8px',
        },
    };

    return (
        <Modal open={open} onClose={onClose}>
            <div style={styles.modalContent}>
                <div style={styles.header}>
                    <Text variant="header-2">Запуск теста</Text>
                </div>

                <div style={styles.body}>
                    <div id="test-output" style={styles.outputContainer} ref={outputRef}>
                        {testOutput || 'Ожидание запуска теста...'}
                    </div>
                </div>

                <div style={styles.footer}>
                    <Button view="flat" onClick={handleClearOutput}>
                        Очистить
                    </Button>
                    <Button view="flat" onClick={handleStopTest} disabled={!isRunning}>
                        {isRunning ? 'Остановить' : 'Остановить'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TestRunPage;
