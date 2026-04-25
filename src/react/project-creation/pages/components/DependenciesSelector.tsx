import React, {useState} from 'react';
import {TextInput, Checkbox, Card, Button, Text, Label} from '@gravity-ui/uikit';

interface DependenciesSelectorProps {
    selectedDependencies: string[];
    onDependenciesChange: (dependencies: string[]) => void;
}

export const DependenciesSelector: React.FC<DependenciesSelectorProps> = ({
                                                                              selectedDependencies,
                                                                              onDependenciesChange,
                                                                          }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const availableDependencies = [
        {name: 'Apache Kafka', category: 'Messaging', description: 'Потоковая обработка событий'},
        {name: 'PostgreSQL Driver', category: 'SQL', description: 'Драйвер для PostgreSQL'},
        {name: 'ClickHouse JDBC', category: 'NoSQL', description: 'Колоночная база данных для аналитики'},
    ];

    const toggleDependency = (depName: string) => {
        if (selectedDependencies.includes(depName)) {
            onDependenciesChange(selectedDependencies.filter(d => d !== depName));
        } else {
            onDependenciesChange([...selectedDependencies, depName]);
        }
    };

    const filteredDependencies = availableDependencies.filter(dep =>
        dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dep.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedDependencies = filteredDependencies.reduce((acc, dep) => {
        if (!acc[dep.category]) {
            acc[dep.category] = [];
        }
        acc[dep.category].push(dep);
        return acc;
    }, {} as Record<string, typeof availableDependencies>);

    const styles = {
        container: {
            marginTop: '4px',
        },
        searchInput: {
            marginBottom: '12px',
            marginTop: '4px',
        },
        dependenciesList: {
            maxHeight: '350px',
            overflowY: 'auto' as const,
            padding: '8px',
            border: '1px solid var(--g-color-line-generic)',
            borderRadius: 'var(--g-border-radius-m)',
            background: 'var(--g-color-base-background)',
        },
        category: {
            marginBottom: '16px',
        },
        categoryTitle: {
            marginBottom: '8px',
            marginTop: '12px',
        },
        dependenciesGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '8px',
        },
        addedDepsSection: {
            marginTop: '16px',
        },
        addedDepsContainer: {
            marginTop: '8px',
            padding: '8px',
            borderRadius: 'var(--g-border-radius-m)',
            background: 'var(--g-color-base-misc-light)',
        },
        emptyMessage: {
            padding: '8px',
        },
        tagsContainer: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '8px',
        },
        tag: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: 'var(--g-border-radius-m)',
            background: 'var(--g-color-base-background)',
        },
        noResults: {
            textAlign: 'center' as const,
            padding: '16px',
        },
        tagButton: {
            marginLeft: '4px',
        },
    };

    return (
        <div style={styles.container}>
            <Label>Зависимости</Label>
            <TextInput
                placeholder="Поиск зависимостей (Kafka, PostgreSQL, ClickHouse)..."
                value={searchTerm}
                onUpdate={setSearchTerm}
                style={styles.searchInput}
                size="l"
            />

            <div style={styles.dependenciesList}>
                {Object.entries(groupedDependencies).map(([category, deps]) => (
                    <div key={category} style={styles.category}>
                        <Text variant="subheader-2" style={styles.categoryTitle}>
                            {category}
                        </Text>
                        <div style={styles.dependenciesGrid}>
                            {deps.map((dep) => (
                                <Checkbox
                                    key={dep.name}
                                    checked={selectedDependencies.includes(dep.name)}
                                    onUpdate={() => toggleDependency(dep.name)}
                                >
                                    <div>
                                        <div>{dep.name}</div>
                                        <Text variant="caption-1" color="secondary">
                                            {dep.description}
                                        </Text>
                                    </div>
                                </Checkbox>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredDependencies.length === 0 && (
                    <Text variant="body-2" color="secondary" style={styles.noResults}>
                        Зависимости не найдены
                    </Text>
                )}
            </div>

            <div style={styles.addedDepsSection}>
                <Text variant="subheader-2">Добавленные зависимости:</Text>
                <div style={styles.addedDepsContainer}>
                    {selectedDependencies.length === 0 ? (
                        <Text variant="caption-1" color="secondary" style={styles.emptyMessage}>
                            Нет добавленных зависимостей
                        </Text>
                    ) : (
                        <div style={styles.tagsContainer}>
                            {selectedDependencies.map((dep) => (
                                <Card key={dep} view="outlined" style={styles.tag}>
                                    <span>{dep}</span>
                                    <Button
                                        view="flat"
                                        size="xs"
                                        onClick={() => toggleDependency(dep)}
                                        style={styles.tagButton}
                                    >
                                        ×
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};