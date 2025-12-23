const escapeHtml = (input = '') =>
    input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const formatListBlock = (lines) => {
    const items = lines
        .map((line) => line.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean)
        .map((line) => `<li>${escapeHtml(line)}</li>`)
        .join('');

    return `<ul>${items}</ul>`;
};

const formatCodeBlock = (block) => {
    const lines = block.split('\n');
    const firstLine = lines.shift() || '';
    const language = firstLine.replace(/^```/, '').trim();
    const closingLine = lines[lines.length - 1] || '';

    if (closingLine.trim().startsWith('```')) {
        lines.pop();
    }

    const code = lines.join('\n');
    const langAttr = language ? ` class="language-${escapeHtml(language)}"` : '';

    return `<pre><code${langAttr}>${escapeHtml(code)}</code></pre>`;
};

const formatParagraphBlock = (block) => {
    const content = block
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br />');

    return `<p>${content}</p>`;
};

export function formatAssistantMessage(content = '') {
    const trimmed = content.trim();
    if (!trimmed) {
        return '';
    }

    const blocks = trimmed.split(/\n{2,}/);

    return blocks
        .map((block) => {
            const normalized = block.trim();

            if (normalized.startsWith('```') && normalized.includes('\n')) {
                return formatCodeBlock(normalized);
            }

            const lines = normalized.split('\n').filter(Boolean);
            const isListBlock =
                lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line.trim()));

            if (isListBlock) {
                return formatListBlock(lines);
            }

            return formatParagraphBlock(normalized);
        })
        .join('');
}
