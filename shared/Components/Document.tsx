import { Markdown } from "./Markdown";

declare var DOCX: any, docx: any;

interface DocumentProps {
    title: string;
    content: any;
    downloadContent?: any;
    mode?: 'HTML' | 'Markdown' | 'DOCX';
    enablePrint: boolean;
    enableDownload: boolean;
    close?: () => void;
}

export function DocumentPanel(props: DocumentProps) {
    const { title, content, downloadContent, mode, enablePrint, enableDownload, close } = props;
    const container = $reference<HTMLElement>();
    const wordDocument = $reference<Blob>();

    scrollToTop();

    return (
        <div class="document">
            <h1 if={mode !== 'DOCX'}>{title}</h1>
            <div ref={container} class="content">
                {
                    mode === 'Markdown' ?
                        <Markdown
                            text={content}
                            allowExternalLinks={false}
                            sendMessage={(message) => { }}
                        />
                        :
                        mode === 'DOCX' ? <WordDocument title={title} text={content} ref={wordDocument} />
                            : content
                }
            </div>
            <div class="actions">
                {enablePrint && <button title="Print" onclick={printDocument}>🖨️ Print</button>}
                {enableDownload && <button title="Download" onclick={downloadDocument}>📄 Download</button>}
                {close && <button class="close" title="Close" onclick={close}>&#10005;</button>}
            </div>
        </div>
    );

    function scrollToTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    function printDocument() {
        if (!container.value) return;
        if (mode === 'HTML') {
            window.print();
            return;
        }
        const htmlString = `${container.value.innerHTML}
<style>
@media print {
    .assistant,
    .action-container,
    .loader-container,
    .buttons,
    button,
    label,
    .toolbar,
    .header,
    .input {
        display: none !important;
    }
}
</style>
<script>window.print();</script>
`;
        const blob = new Blob([htmlString], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        window.setTimeout(() => {
            //console.log('document window closing');
            URL.revokeObjectURL(url);
            win?.close();
        }, 1000);
    }

    function downloadDocument() {
        if (!container.value) return;
        const blob = (
            mode === 'DOCX' ? wordDocument.value!
                : mode === 'Markdown' || downloadContent ? new Blob([downloadContent || content], { type: 'text/markdown' })
                    : new Blob([container.value.innerHTML], { type: 'text/html' })
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getFileName();
        a.click();
        URL.revokeObjectURL(url);
    }

    function getFileName() {
        let ext = mode === 'DOCX' ? 'docx' : mode === 'Markdown' || downloadContent ? 'md' : 'html';
        if (title.indexOf(ext) > -1) return title;
        return `${title}${ext}`;
    }
}

function WordDocument({ title, text, ref }) {
    const document = $reference<HTMLDivElement>();
    const docxOptions = Object.assign(DOCX.defaultOptions, {
        debug: true,
        experimental: true
    });
    document.onLoad.add(async (element) => {
        const wrapper = element.querySelector<HTMLElement>('.docx-wrapper');
        if (!wrapper) return;
        wrapper.style.backgroundColor = 'var(--panel-color)';
    });
    document.onLoad.add(async (element) => {
        const doc = new docx.Document({
            sections: [
                {
                    properties: {
                    },
                    children: [
                        new docx.Paragraph({
                            text: title,
                            heading: docx.HeadingLevel.HEADING_1,
                        }),
                        ...generateDynamicContentFromMarkdown(text)
                    ],
                },
            ],
        });
        const blob = await docx.Packer.toBlob(doc);
        await DOCX.renderAsync(blob, element, null, docxOptions);
        ref.setReference(blob);
    });

    return <div ref={document} />;

    function generateDynamicContentFromMarkdown(markdown: string) {
        const children: any[] = [];
        const lines = markdown.split('\n');
        let currentHeading = 0;
        let inTable = false;
        let tableRows: any[] = [];
        let tableHeaders: any[] = [];

        for (let line of lines) {
            const trimmedLine = line.trim();
            const indentLevel = line.length - trimmedLine.length;

            if (trimmedLine.startsWith('#')) {
                const heading = trimmedLine.match(/#+/);
                if (heading) {
                    currentHeading = Math.min(heading[0].length, 9); // Limit the heading level to a maximum of 9
                    children.push(new docx.Paragraph({
                        text: trimmedLine.substring(heading[0].length).trim().replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'),
                        heading: docx.HeadingLevel[`HEADING_${currentHeading}`],
                    }));
                }
            } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                children.push(new docx.Paragraph({
                    text: trimmedLine.substring(2).trim().replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'),
                    bullet: {
                        level: indentLevel / 2,
                    },
                }));
            } else if (/^\d+\./.test(trimmedLine)) {
                children.push(new docx.Paragraph({
                    text: trimmedLine.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'),
                    numbering: {
                        reference: 'numbering',
                        level: indentLevel / 2,
                    },
                }));
            } else if (trimmedLine.startsWith('```')) {
                const codeLines: string[] = [];
                line = lines.shift() || '';
                while (line && !line.startsWith('```')) {
                    codeLines.push(line);
                    line = lines.shift() || '';
                }
                const code = codeLines.join('\n');
                children.push(new docx.Paragraph({
                    text: code,
                    style: "Code",
                }));
            } else if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableHeaders = trimmedLine.split('|').map(header => header.trim()).filter(header => header);
                } else {
                    const rowCells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell);
                    tableRows.push(rowCells);
                }
            } else if (inTable) {
                const table = new docx.Table({
                    rows: [
                        new docx.TableRow({
                            children: tableHeaders.map(header => new docx.TableCell({
                                children: [new docx.Paragraph({ text: header.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1') })],
                            })),
                        }),
                        ...tableRows.map(row => new docx.TableRow({
                            children: row.map(cell => new docx.TableCell({
                                children: [new docx.Paragraph({ text: cell.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1') })],
                            })),
                        })),
                    ],
                });
                children.push(table);
                inTable = false;
                tableRows = [];
                tableHeaders = [];
            } else if (trimmedLine.match(/!\[.*?\]\(.*?\)/)) {
                const match = trimmedLine.match(/!\[(.*?)\]\((.*?)\)/);
                if (match) {
                    const alt = match[1];
                    const url = match[2];
                    // TODO: Handle images by downloading and embedding them
                    children.push(new docx.Paragraph({
                        text: `[Image: ${alt}]`,
                    }));
                }
            } else if (trimmedLine.match(/\[(.*?)\]\((.*?)\)/)) {
                const match = trimmedLine.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                    const text = match[1];
                    const url = match[2];
                    children.push(new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: text,
                                style: "Hyperlink",
                            }),
                        ],
                    }));
                }
            } else {
                children.push(new docx.Paragraph({
                    text: trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1'),
                }));
            }
        }

        return children;
    }
}