import { Text, TextInput } from '@gravity-ui/uikit';

interface ModulePropertiesProps {
    data: Module;
}

export const ModuleProperties = ({ data }: ModulePropertiesProps) => {
    return (
        <div>
            <Text variant="subheader-2" style={{ marginTop: '16px', marginBottom: '8px' }}>Настройки модуля</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                <Text variant="body-2">Имя</Text>
                <TextInput
                    value={data.name}
                    size="m"
                    style={{ width: '100%' }}
                />
                <Text variant="body-2">Расположение</Text>
                <TextInput
                    value={data.location}
                    size="m"
                    style={{ width: '100%' }}
                    disabled
                />
            </div>
        </div>
    );
};