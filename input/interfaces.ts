type FileContent = (string | any[] | { image: string });

interface IFileProcessor {
    supportedFileTypes: string[];
    readFile(file: Blob): Promise<FileContent>;
}

interface ISpeechInput {
    text: string;
    confidence: number;
}

interface ISpeechInputManager {
    isContinuous: boolean;
    isListening: boolean;
    onInputReceived: IEvent<ISpeechInput>;
    onInputPreview: IEvent<ISpeechInput>;
    onStopListening: IEvent<void>;
    startListening(continuous?: boolean | undefined);
    stopListening();
}

interface ISpeechOutputManager {
    isSpeaking: boolean;
    isEnabled: boolean;
    onStartSpeaking: IEvent<string>;
    onStopSpeaking: IEvent<void>;
    defaultVoice?: string | undefined;
    voices(): Promise<string[]>;
    startSpeaking(text: string, voice?: string | undefined);
    stopSpeaking();
    init(): Promise<void>;
}

interface IMediaInput {
    type: 'camera' | 'microphone' | 'screen';
    dataUrl: string;
    blob?: Blob;
}

interface IMediaInputManager {
    video: HTMLVideoElement;
    isRecording: boolean;
    onInputReceived: IEvent<IMediaInput>;
    onStartRecording: IEvent<void>;
    onStopRecording: IEvent<void>;
    startRecording();
    stopRecording();
    capture(): Promise<IMediaInput | undefined>;
}