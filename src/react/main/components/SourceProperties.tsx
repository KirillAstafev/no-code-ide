import { Text, TextInput } from '@gravity-ui/uikit';

interface SourcePropertiesProps {
    data: DataSource;
}

export const SourceProperties = ({ data }: SourcePropertiesProps) => {
    return (
        <div>
            <Text variant="subheader-2" style={{ marginTop: '16px', marginBottom: '8px' }}>Настройки источника</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <Text variant="body-2">Имя</Text>
                <TextInput
                    value={data.name}
                    size="m"
                    style={{ width: '100%' }}
                />
                <Text variant="body-2">IP-адрес</Text>
                <TextInput
                    value={data.ipAddress}
                    size="m"
                    style={{ width: '100%' }}
                />
                <Text variant="body-2">TCP-порт</Text>
                <TextInput
                    value={String(data.tcpPort)}
                    size="m"
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
};