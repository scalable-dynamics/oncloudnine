//const copyIcon = $Images.CopyIcon;

interface MarkdownProps {
    text: string;
    allowExternalLinks?: boolean;
    sendMessage: (input: string) => void;
}

export function Markdown({ text, allowExternalLinks = false, sendMessage }: MarkdownProps) {
    const html = renderMarkdown(text, allowExternalLinks, sendMessage);
    const element = document.createElement('div');
    element.innerHTML = html;
    return element;
}

export function renderMarkdown(text: string, allowExternalLinks = false, sendMessage: (input: string) => void) {
    if (!text) return '';
    if (typeof text !== 'string') {
        console.error('Invalid markdown input:', text);
        return '';
    }

    text = text.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const headersRegex = /^#{1,6} (.+)$/gm;
    text = text.replace(headersRegex, (match, content) => {
        const level = match.split(' ')[0].length;
        return `<h${level}>${content}</h${level}>`;
    });

    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/```(\w*?)\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<details open><summary>Code (${lang})</summary><button onclick="navigator.clipboard.writeText(this.parentNode.querySelector('code').innerText)">Copy</button><pre><code data-lang="${lang}">${code}</code></pre></details>`;
        })
        .replace(/`(.*?)`/g, '<code>$1</code>');

    // Rendering images
    text = text.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
        if (!url.startsWith("/")) return match;
        return `<img src="${url}" alt="${alt}" />`;
    });

    // Rendering links
    text = text.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, href) => {
        if (href.startsWith("aido:")) {
            const [, input] = href.split(':');
            return `<a href="javascript:void(0)" onclick={() => sendMessage('${input}')}>${text}</a>`;
        }
        if (!allowExternalLinks && !href.startsWith("/")) return match;
        return `<a href="${href}" target="_new">${text}</a>`;
    });

    // Rendering tables
    let inTable = false;
    const lines = text.split('\n');
    let result = '';

    lines.forEach(line => {
        if (line.startsWith("|") && line.endsWith("|")) {
            if (!inTable) {
                result += "<br/><table>";
                inTable = true;
            }
            const cellLine = line.replace('|', '');
            if (cellLine.replace(/\|/g, '').replace(/-/g, '').trim().length === 0) return;
            const cells = cellLine.split('|').map(cell => `<td>${cell.trim()}</td>`).join('');
            result += `<tr>${cells}</tr>`;
        } else {
            if (inTable) {
                result += "</table><br/>";
                inTable = false;
            }
            result += `${line}<br/>`;
        }
    });

    if (inTable) {
        result += "</table><br/>";
    }

    // Transform unordered lists
    result = result.replace(/^(\s*)\* (.+)$/gm, '<ul><li>$2</li></ul>')
        .replace(/^(\s*)\+ (.+)$/gm, '<ul><li>$2</li></ul>')
        .replace(/^(\s*)- (.+)$/gm, '<ul><li>$2</li></ul>');

    // Transform ordered lists
    result = result.replace(/^(\s*)\d+\. (.+)$/gm, '<ol><li>$2</li></ol>');

    // Combine consecutive list items into a single list
    result = result.replace(/<\/ul>\s*<ul>/g, '')
        .replace(/<\/ol>\s*<ol>/g, '')
        .replace(/<\/li>\s*<li>/g, '');

    // Add <br/> around lists
    result = result.replace(/(<ul>|<ol>)/g, '<br/>$1')
        .replace(/(<\/ul>|<\/ol>)/g, '$1<br/>');

    return result.trim();
}

export function removeMarkdown(markdown: string) {
    const element = document.createElement('div');
    let html = renderMarkdown(markdown, false, () => { });
    html = html.replace(/<details(.*?)<\/details>/g, '');
    element.innerHTML = html;
    const text = element.innerText;
    return text;
}