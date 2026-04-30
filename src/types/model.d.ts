interface Project {
    name: string;
    location: string;
    modules: Module[];
    dependencies: ExternalDependency[];
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
    connectionSettings: Map<string, string>;
}

interface ExternalDependency {
    name: string;
    category: string;
    description: string;
    dependencyCode: string;
}