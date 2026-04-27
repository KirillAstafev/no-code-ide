interface ProjectData {
    serverURL: string;
    name: string;
    location: string;
    createGitRepo: boolean;
    language: 'Java' | 'Kotlin' | 'Groovy';
    buildSystem: 'Gradle-Groovy' | 'Gradle-Kotlin' | 'Maven';
    groupId: string;
    artifactId: string;
    packageName: string;
    jdkVersion: string;
    javaVersion: string;
    packaging: 'Jar' | 'War';
    configFormat: 'Properties' | 'YAML';
    springBootVersion: string;
    dependencies: string[];
}

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
    connectionSettings: string[];
}

interface ExternalDependency {
    name: string;
    category: string;
    description: string;
    dependencyCode: string;
}