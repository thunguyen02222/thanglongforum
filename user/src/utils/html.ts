export function getSnippet(html: string | undefined | null, maxLen: number = 150): string {
  if (!html) return '';
  // 1. Convert <br> and block-level tags to space so words don't merge (e.g. <p>Hello</p><p>World</p> -> Hello World)
  let text = html.replace(/<br\s*\/?>/gi, ' ');
  text = text.replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote)>/gi, ' ');
  
  // 2. Remove all remaining HTML tags
  text = text.replace(/<[^>]*>?/gm, '');
  
  // 3. Decode common HTML entities (RichEditor often produces &nbsp;)
  text = text.replace(/&nbsp;/gi, ' ')
             .replace(/&amp;/gi, '&')
             .replace(/&lt;/gi, '<')
             .replace(/&gt;/gi, '>')
             .replace(/&quot;/gi, '"')
             .replace(/&#39;/gi, "'");
  
  // 4. Remove any remaining HTML entities
  text = text.replace(/&[a-zA-Z#0-9]+;/g, ' ');

  // 5. Normalize spacing
  text = text.replace(/\s+/g, ' ').trim();
  
  return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}
