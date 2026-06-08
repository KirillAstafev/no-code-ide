interface SchemaNode {
    id: string;
    type: 'module' | 'source' | 'destination';
    label: string;
    caption?: string;
    x?: number;
    y?: number;
    data: Module | DataSource | DataDestination;
}

interface SchemaEdge {
    id: string;
    sourceBlockId: string;
    targetBlockId: string;
    label?: string;
    style?: 'solid' | 'dashed';
    arrowhead?: 'none' | 'arrow' | 'dot';
}

interface Schema {
    nodes?: SchemaNode[];
    edges?: SchemaEdge[];
    metadata?: {
        zoom?: number;
        offsetX?: number;
        offsetY?: number;
        layout?: 'dagre' | 'force' | 'grid';
        [key: string]: any;
    };
}

interface Project {
    name: string;
    location: string;
    modules: Module[];
    sources: DataSource[];
    destinations: DataDestination[];
    dependencies: ExternalDependency[];
    schema: Schema;
}

interface Module {
    name: string;
    location: string;
    sources: DataSource[];
    destinations: DataDestination[];
}

interface DataSource {
    name: string;
    ipAddress: string;
    tcpPort: number;
}

interface DataDestination {
    name: string;
    url: string;
    dependency: ExternalDependency;
}

interface ExternalDependency {
    name: string;
    category: string;
    description: string;
    dependencyCode: string;
}