type TextInputElement = HTMLElement & { value?: string };

interface TextInputProps extends JSX.Component<TextInputElement> {
    onValueChanged: (value: string) => void;
    fileProcessor?: IFileProcessor;
    onFilesAdded?: (files: File[]) => void;
    placeholder?: string | undefined;
    multiline?: boolean | undefined;
    max_size?: number;
}

export function TextInput(props: TextInputProps, children) {
    const { ref, onValueChanged, fileProcessor, onFilesAdded, max_size = 1024 * 1024 * 10, placeholder, multiline } = props;
    const input: any = ref ?? $reference<TextInputElement>();
    const label = $reference<HTMLElement>();
    return (
        <label ref={label} class="text">
            {children}
            <textarea ref={input} type="text" autocomplete="off" placeholder={placeholder} oninput={autoSizeTextarea} onkeypress={onTextInput} onpaste={onPaste} if={multiline} />
            <input ref={input} type="text" autocomplete="off" placeholder={placeholder} onkeypress={onTextInput} onpaste={onPaste} if={!multiline} />
        </label>
    );

    function onTextInput(event: KeyboardEvent) {
        if (!input.value) return;
        if (event.keyCode !== 13 || event.shiftKey) return;
        event.preventDefault();
        event.stopPropagation();
        onValueChanged(input.value.value);
        input.value.value = '';
        input.value.blur();
        autoSizeTextarea();
    }

    function onFileInvalid(message: string) {
        //console.log('onFileInvalid', message);
        ShowTooltip(message, label.value!.parentElement!, 5);
    }

    async function onPaste(event) {
        //console.log('onPaste', onFilesAdded, event.clipboardData?.items);
        if (!onFilesAdded || !event.clipboardData?.items) return;
        const files: File[] = [];
        for (let item of event.clipboardData.items) {
            if (item.kind !== 'file') continue;
            const file = item.getAsFile();
            if (!file) continue;
            if (fileProcessor && !fileProcessor.supportedFileTypes.includes(file.type)) {
                onFileInvalid('Unsupported file type: ' + file.name);
                continue;
            }
            if (file.size > max_size) {
                onFileInvalid('File too large: ' + file.name);
                continue;
            }
            if (file.size === 0) {
                onFileInvalid('Empty file: ' + file.name);
                continue;
            }
            if (fileProcessor) {
                const content = await fileProcessor.readFile(file);
                if (!content) {
                    onFileInvalid('File could not be read: ' + file.name);
                    continue;
                }
                if (Array.isArray(content)) {
                    const json = JSON.stringify(content);
                    files.push(new File([json], file.name, { type: 'application/json' }));
                } else if (typeof (content) === 'string') {
                    files.push(new File([content], file.name, { type: 'plain/text' }));
                } else if (typeof (content) === 'object' && content.image) {
                    files.push(new File([content.image], file.name, { type: file.type }));
                } else {
                    onFileInvalid('Unsupported file content: ' + file.name);
                }
            } else {
                files.push(file);
            }
        }
        if (files.length === 0) return;
        onFilesAdded(files);
    }

    function autoSizeTextarea() {
        if (!multiline || !input.value) return;
        const textarea = input.value;
        const lines = textarea.value.split('\n');
        textarea.style.height = 'auto';
        if (lines.length > 20) {
            textarea.classList.add('fullscreen');
            textarea.style.height = 'calc(100vh - 100px)';
        } else if (lines.length > 1) {
            textarea.classList.add('multiline');
            textarea.style.height = ((lines.length * 25) + 10) + 'px';
        } else if (textarea.scrollHeight > textarea.clientHeight) {
            textarea.classList.add('multiline');
            textarea.style.height = textarea.scrollHeight + 'px';
        } else {
            textarea.classList.remove('multiline');
            textarea.style.height = '40px';
        }
    }
}
