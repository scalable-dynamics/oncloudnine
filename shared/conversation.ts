
interface IConversationMessage {
    content: string;
    role: string;
    name?: string;
    file?: string;
    files?: IConversationFile[];
    imageUrl?: string;
}

interface IConversationFile {
    name: string;
    type: string;
    search(text: string): Promise<number>;
    text(): Promise<string>;
    json(): Promise<any>;
}

interface IConversationContext {
    Messages: IObservableList<IConversationMessage>;
    Files: IObservableList<IConversationFile>;
    addFiles(files: File[], addMessage?: boolean): Promise<IConversationFile[]>;
    clear(): Promise<void>;
}

interface ConversationSettings {
    enableSpeechInput: boolean;
    enableFileInput: boolean;
    enableMultilineInput: boolean;
    enableMessageRemove: boolean;
    enableMessageSend: boolean;
    enableMessageCopy: boolean;
    enableMessageSpeak: boolean;
    onSelectFile?: (file: IConversationFile) => void;
}