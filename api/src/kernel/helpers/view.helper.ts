import * as fs from 'fs';
import * as Mustache from 'mustache';

export function renderFile(
  filePath: string,
  options: Record<string, any>,
  callback: (err: Error | null, html?: string) => void
): void {
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      return callback(err);
    }
    const rendered = Mustache.render(content, options);
    callback(null, rendered);
  });
}

