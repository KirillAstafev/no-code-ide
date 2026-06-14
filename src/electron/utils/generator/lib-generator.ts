import path from "path";
import fs from "fs/promises";
import {app} from "electron";
import {isDev} from "../environment.js";

export async function copyDriverLibraries(
    outputDir: string,
): Promise<void> {
    const libsDir = path.join(outputDir, 'libs');
    const nativeDir = path.join(libsDir, 'native');

    await fs.mkdir(libsDir, {recursive: true});
    await fs.mkdir(nativeDir, {recursive: true});

    const sourceLibsDir = path.join(app.getAppPath(), isDev() ? '' : '..', '/libs');

    try {
        const jarFiles = await fs.readdir(sourceLibsDir);
        for (const file of jarFiles) {
            if (file.endsWith('.jar')) {
                const sourcePath = path.join(sourceLibsDir, file);
                const destPath = path.join(libsDir, file);
                await fs.copyFile(sourcePath, destPath);
                console.log(`Copied: ${file}`);
            }
        }

        const sourceNativeDir = path.join(sourceLibsDir, 'native');
        try {
            const nativeFiles = await fs.readdir(sourceNativeDir);
            for (const file of nativeFiles) {
                if (file.endsWith('.dll') || file.endsWith('.so')) {
                    const sourcePath = path.join(sourceNativeDir, file);
                    const destPath = path.join(nativeDir, file);
                    await fs.copyFile(sourcePath, destPath);
                    console.log(`Copied native: ${file}`);
                }
            }
        } catch (error) {
            console.log('No native libraries found in source, skipping');
        }

        const infoContent = {
            source: "Copied from No-Code IDE",
            copyDate: new Date().toISOString(),
            jarFiles: jarFiles.filter(f => f.endsWith('.jar')),
            nativeFiles: await getNativeFilesList(sourceNativeDir)
        };

        await fs.writeFile(
            path.join(libsDir, 'driver_info.json'),
            JSON.stringify(infoContent, null, 2),
            'utf-8'
        );

        console.log('Driver libraries copied successfully');

    } catch (error) {
        console.error('Failed to copy driver libraries:', error);

        // Создаём README с инструкцией
        const readmeContent = `# Установка драйвера ККТ

## Автоматическое копирование не удалось

Пожалуйста, скопируйте файлы драйвера вручную:

1. Скопируйте \`fiscal_core_driver.jar\` в папку \`libs/\`
2. Скопируйте нативные библиотеки:
   - \`fiscal_core_driver.dll\` для Windows в \`libs/native/\`
   - \`libfiscal_core_driver.so\` для Linux в \`libs/native/\`

## Где взять драйвер
Драйвер поставляется вместе с приложением No-Code IDE.
Найдите его в папке установки приложения.
`;

        await fs.writeFile(path.join(libsDir, 'README.md'), readmeContent, 'utf-8');
    }
}

async function getNativeFilesList(nativeDir: string): Promise<string[]> {
    try {
        const files = await fs.readdir(nativeDir);
        return files.filter(f => f.endsWith('.dll') || f.endsWith('.so'));
    } catch {
        return [];
    }
}