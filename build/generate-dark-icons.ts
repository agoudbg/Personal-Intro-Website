import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { convertDarkIcon } from 'dark-icon-generator';

const darkIconAssets = [
  {
    source: 'assets/icons/caland-favicon.png',
    output: 'caland-favicon-dark.png',
  },
  {
    source: 'assets/icons/nmteam-logo.png',
    output: 'nmteam-logo-dark.png',
  },
] as const;

export async function generateDarkIcons(rootDirectory: string, outputDirectory: string): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });

  await Promise.all(darkIconAssets.map(async ({ source, output }) => {
    const sourcePath = join(rootDirectory, source);
    const outputPath = join(outputDirectory, output);

    try {
      const sourceIcon = await readFile(sourcePath);
      const darkIcon = await convertDarkIcon(sourceIcon);
      await writeFile(outputPath, darkIcon);
    } catch (error: unknown) {
      throw new Error(`Failed to generate dark icon from ${source}.`, { cause: error });
    }
  }));
}
