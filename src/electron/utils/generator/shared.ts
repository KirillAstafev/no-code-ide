export function generateJavaClassNameFromId(id: string): string {
    return normalizeIdentifier(id.charAt(0).toUpperCase() + id.slice(1));
}

export function generateId(prefix: string, index: number): string {
    return `${prefix}${index}`;
}

export function normalizeIdentifier(str: string): string {
    return str.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]+/, '');
}

export function normalizePropertyName(str: string): string {
    const normalized = str.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]+/, '');
    return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}