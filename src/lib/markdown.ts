/**
 * Utility to parse basic Markdown text into HTML with premium Tailwind styling
 * tailored for the Äkta Restaurant design system.
 */
export function parseMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  // 1. Escape basic HTML tags to prevent arbitrary code injection (XSS protection)
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Headings with gold styling
  html = html.replace(/^# (.*?)$/gm, '<h1 class="font-serif text-4xl md:text-5xl text-[var(--akta-gold-light)] text-center tracking-wide my-8 font-light">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="font-serif text-2xl md:text-3xl text-[var(--akta-gold)] text-center tracking-wider my-6 font-light uppercase">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="font-sans text-xs uppercase tracking-[0.25em] text-[var(--akta-gold)]/60 text-center my-5 font-light border-b border-[var(--akta-gold)]/10 pb-2 max-w-[250px] mx-auto">$1</h3>');
  html = html.replace(/^#### (.*?)$/gm, '<h4 class="font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--akta-beige)]/70 text-center my-4 font-semibold">$1</h4>');

  // 3. Bold and Italic formatting
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--akta-gold-light)]">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-[var(--akta-beige-dark)] font-light">$1</em>');
  html = html.replace(/_(.*?)_/g, '<em class="italic text-[var(--akta-beige-dark)] font-light">$1</em>');

  // 4. Horizontal Rules
  html = html.replace(/^---$/gm, '<div class="w-16 h-[1px] bg-[var(--akta-gold)]/20 mx-auto my-12"></div>');

  // 5. Unordered lists
  // Render list items with customized gold bullet points
  html = html.replace(/^\- (.*?)$/gm, '<li class="text-sm md:text-base text-[var(--akta-beige)] my-3 max-w-xl mx-auto list-none flex items-start gap-3"><span class="text-[var(--akta-gold)] mt-0.5">•</span><span class="flex-1">$1</span></li>');

  // 6. Paragraphs and line breaks
  // Double newlines break into block sections
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // If block starts with a parsed HTML structural tag, don't wrap in <p>
    if (
      trimmed.startsWith('<h') || 
      trimmed.startsWith('<div') || 
      trimmed.startsWith('<li')
    ) {
      return trimmed;
    }
    // Otherwise, wrap in styled paragraph tag and parse single newlines as line breaks
    return `<p class="text-sm md:text-base text-[var(--akta-beige-dark)] font-light leading-relaxed tracking-wide my-4 max-w-xl mx-auto text-center">${trimmed.replace(/\n/g, '<br />')}</p>`;
  }).join('\n');

  return html;
}
