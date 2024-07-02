import { BrowserSpeechInputManager } from "../Modules/BrowserSpeechInputManager";
import { FileProcessor } from "../Modules/FileProcessor";

export class InputViewModel {

    valueChanged: EventManager<string>;
    valueInvalid: EventManager<string>;

    fileProcessor: FileProcessor;
    speechInput: ISpeechInputManager;

    constructor(
        public enableFileInput: boolean,
        public enableSpeechInput: boolean,
        public enableMultilineInput: boolean,
    ) {
        this.fileProcessor = new FileProcessor();
        this.speechInput = new BrowserSpeechInputManager();
        this.valueChanged = new EventManager<string>();
        this.valueInvalid = new EventManager<string>();
    }

    addFiles(files: File[]) {
        
    }

    onSendButton = () => {
    }

    onSpeechInput = (value: string) => {
    }

    onTextInput = (value: string) => {
        value = (value || '').trim();
        if(!value) return;
        const text = value.replace(/<(script|code|style).*?>.*?<\/\1>/gi, '').trim();
        if (value !== text) this.valueInvalid.notify('Invalid characters were removed!');
        if (text.length > 1000) {
            this.valueInvalid.notify('Message is too long! Must be less than 1000 characters.');
            return;
        }
        this.valueChanged.notify(text);
    }
}