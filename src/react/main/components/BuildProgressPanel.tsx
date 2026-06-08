import { useBuildProgress } from '../context/BuildProgressContext';
import { Text, Button } from '@gravity-ui/uikit';
import { useState } from 'react';

function BuildProgressPanel() {
    const { state } = useBuildProgress();
    const [isExpanded, setIsExpanded] = useState(true);

    if (!state.isOpen) {
        return null;
    }

    const getStageText = () => {
        switch (state.stage) {
            case 'downloading':
                return 'Скачивание шаблона...';
            case 'generating':
                return 'Генерация кода...';
            case 'building':
                return 'Сборка проекта...';
            default:
                return '';
        }
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--g-color-surface-generic)',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
        }}>
            <div style={{
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: '1px solid var(--g-color-line-generic)'
            }} onClick={() => setIsExpanded(!isExpanded)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Text variant="body-2" style={{ fontWeight: 500 }}>{getStageText()}</Text>
                    <Text variant="caption-1" color="secondary">{state.progress}%</Text>
                </div>
                <Button
                    view="flat-secondary"
                    size="s"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                >
                    {isExpanded ? 'Свернуть' : 'Развернуть'}
                </Button>
            </div>
        </div>
    );
}

export default BuildProgressPanel;
