import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { extname, join } from 'path';

const i18nPath = join(__dirname, 'src', 'assets', 'i18n');
const files = await readdir(i18nPath);

for (const file of files) {
  const content = await readFile(join(i18nPath, file), 'utf8');
  const json = JSON.parse(content);
  const language = file.split('.')[0]!;
  if (language === 'en' || language === 'mn') continue;

  console.log('Translating en to ' + language);
  console.time('translation_' + language);

  for (const [translationKey, translation] of Object.entries(json)) {
    if (translationKey !== translation) continue;

    const response = await fetch('http://localhost:5000/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: translation,
        source: 'en',
        target: language,
        format: 'text',
        api_key: '',
      }),
    });
    const { translatedText } = (await response.json()) as { translatedText: string };
    json[translationKey] = translatedText;
  }

  console.timeEnd('translation_' + language);

  await writeFile(join(i18nPath, file), JSON.stringify(json, null, 2));
}
