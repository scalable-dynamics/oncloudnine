declare var DOCX;
declare namespace PDF {
    type PDFDocument = { data: Uint8Array };
    export function getDocument(pdf: PDFDocument);
}

export class FileProcessor implements IFileProcessor {

    supportedFileTypes = [

        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        //'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        //'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/pdf',
        'application/json',
        //'application/xml',
        //'application/zip',
        'image/jpeg',
        'image/png',
        'image/gif',
        //'image/bmp',
        'image/webp',
        //'image/svg+xml',
        'text/plain',
        //'text/html',
        //'text/css',
        //'text/javascript',
        'text/markdown',
        'text/csv',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/webm',
        //'video/mp4',
    ];

    async readFile(file: Blob, max_count = 100): Promise<FileContent> {
        if (file.type.indexOf('image') === 0) {
            return await read_image(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const container = document.createElement('div');
            return await read_docx(file, container);
        }
        else if (file.type === 'text/csv') {
            return await read_csv(file, max_count);
        }
        else if (file.type === 'application/json') {
            return await read_json(file, max_count);
        }
        else if (file.type === 'application/pdf') {
            return await read_pdf(file);
        } else {
            return await read_file(file);
        }

        function read_file(file): Promise<string> {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    resolve(reader.result as string);
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }
        
        async function read_docx(file, container) {
            const docxOptions = Object.assign(DOCX.defaultOptions, {
                debug: true,
                experimental: true
            });
            await DOCX.renderAsync(file, container, null, docxOptions);
            const docxContainer = container.querySelector('.docx');
            if (!docxContainer) throw new Error(file.name + ' could not be read.');
            return docxContainer.innerText;
        }
        
        async function read_json(file, max_count = 100) {
            const fileText = await read_file(file);
            let data = JSON.parse(fileText);
            if (Array.isArray(data)) {
                if (data.length > max_count) {
                    console.log(`Only the first ${max_count} rows of the file ${file.name} were imported.`);
                    data = data.slice(0, max_count);
                }
                return data;
            } else {
                return [data];
            }
        }
        
        async function read_csv(file, max_count = 100) {
            const fileText = await read_file(file);
            const csvData = parseCSV(fileText);
            const data: any[] = [];
            let columns, count = 0;
            for (const rowData of csvData) {
                if (count++ > max_count) {
                    console.log(`Only the first ${max_count} rows of the file ${file.name} were imported.`);
                    break;
                }
                if (!columns) {
                    columns = rowData;
                    continue;
                }
                const row = {};
                let hasData = false;
                for (var i = 0; i < rowData.length; i++) {
                    const header = columns[i];
                    const value = rowData[i];
                    if (header && value.trim()) {
                        row[header] = value;
                        hasData = true;
                    }
                }
                if (hasData) {
                    data.push(row);
                }
            }
            return data;
        }
        
        function read_image(file): Promise<FileContent> {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = function () {
                    const image = reader.result as string;
                    resolve({ image });
                }
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        
        function read_pdf(file): Promise<string> {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const pdfData = new Uint8Array(reader.result as ArrayBuffer);
                        const pdfDoc = await PDF.getDocument({ data: pdfData }).promise;
                        let content = "";
                        for (let i = 1; i <= pdfDoc.numPages; i++) {
                            const page = await pdfDoc.getPage(i);
                            const textContent = await page.getTextContent();
                            content += textContent.items.map(item => item.str).join(" ");
                        }
                        resolve(content);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        }
        
        function parseCSV(csvText) {
            const lines = csvText.split(/\r\n|\n|\r/);
            const data = lines.map(line => {
                const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
                let m;
                const row: string[] = [];
                while ((m = regex.exec(line)) !== null) {
                    let field: string = m[1].trim();
                    if (field.startsWith('"') && field.endsWith('"')) {
                        field = field.substring(1, field.length - 1);
                    }
                    row.push(field);
                }
                return row;
            });
            return data;
        }
    }
}