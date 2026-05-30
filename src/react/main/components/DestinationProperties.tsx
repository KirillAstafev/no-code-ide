import { Text, TextInput } from '@gravity-ui/uikit';

interface DestinationPropertiesProps {
    data: DataDestination;
}

export const DestinationProperties = ({ data }: DestinationPropertiesProps) => {
    return (
        <div>
            <Text variant="subheader-2" style={{ marginTop: '16px', marginBottom: '8px' }}>Настройки приёмника</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <Text variant="body-2">Имя</Text>
                <TextInput
                    value={data.name}
                    size="m"
                    style={{ width: '100%' }}
                />
                <Text variant="body-2">URL</Text>
                <TextInput
                    value={data.url}
                    size="m"
                    style={{ width: '100%' }}
                />
                <Text variant="body-2">Зависимость</Text>
                <TextInput
                    value={data.dependency?.name || ''}
                    size="m"
                    style={{ width: '100%' }}
                    disabled
                />
            </div>
        </div>
    );
};