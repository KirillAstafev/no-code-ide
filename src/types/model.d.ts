export interface ProjectData {
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