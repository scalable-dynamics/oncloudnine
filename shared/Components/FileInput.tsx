import { ShowTooltip } from "./Tooltip.js";

declare var $Images: any;

interface FileInputProps extends JSX.Component<HTMLElement> {
    fileProcessor?: IFileProcessor | undefined;
    onFilesAdded: (files: File[]) => void;
    dropTarget?: JSX.IReference<HTMLElement> | undefined;
    max_size?: number;
}

export function FileInput(props: FileInputProps) {
    const { fileProcessor, onFilesAdded, dropTarget, max_size = 1024 * 1024 * 10, ...rest } = props;
    const label = $reference<HTMLElement>();
    const input = $reference<HTMLInputElement>();
    const target = (dropTarget && dropTarget.value) || document.body;

    window.addEventListener('dragenter', showFileDrop);
    window.addEventListener('dragleave', hideFileDrop);

    return (
        <label ref={label} class="file" ondragover={setDropEffect} ondragleave={removeDropEffect} ondrop={onBeforeFilesAdded}>
            {$Images.UploadIcon}
            <span>Add</span>
            <input ref={input} type="file" multiple onchange={onBeforeFilesAdded} />
        </label>
    );

    function showFileDrop(event) {
        cancelEvent(event);
        if (event.dataTransfer && event.dataTransfer.effectAllowed !== 'move') {
            event.dataTransfer.effectAllowed = 'move';
            target.classList.add('file-drop');
        }
    }

    function hideFileDrop(event) {
        cancelEvent(event);
        if (event.clientX > 0 || event.clientY > 0) return;
        target.classList.remove('file-drop');
    }

    function setDropEffect(event) {
        if (!label.value) return;
        cancelEvent(event);
        if (event.dataTransfer && event.dataTransfer.dropEffect !== 'move') {
            event.dataTransfer.dropEffect = 'move';
            label.value.classList.add('drop');
        }
    }

    function removeDropEffect(event) {
        if (!label.value) return;
        cancelEvent(event);
        if (event.dataTransfer && event.dataTransfer.dropEffect !== 'move') {
            event.dataTransfer.dropEffect = '';
            label.value.classList.remove('drop');
        }
    }

    function onFileInvalid(message: string) {
        ShowTooltip(message, label.value!.parentElement!, 5);
    }

    async function onBeforeFilesAdded(event) {
        cancelEvent(event);
        if (!input.value || !label.value) return;
        target.classList.remove('file-drop');
        label.value.classList.remove('drop');
        let filesAdded = event.target.files || event.dataTransfer.files;
        if (!filesAdded || filesAdded.length === 0) return;
        const files: File[] = [];
        for (let file of filesAdded) {
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
        if (event.target.files) event.target.value = null;
        if (files.length === 0) return;
        onFilesAdded(files);
    }
}

function cancelEvent(event: Event) {
    event.preventDefault();
    event.stopPropagation();
}