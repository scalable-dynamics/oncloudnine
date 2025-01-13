export class SpeechListener implements ISpeechInputManager {
    isContinuous: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    onInputReceived: IEvent<ISpeechInput>;
    onInputPreview: IEvent<ISpeechInput>;
    onStartListening: IEvent<void>;
    onStopListening: IEvent<void>;
    startSpeakingEvent: IEvent<string>;
    stopSpeakingEvent: IEvent<void>;
    constructor() {
        this.isContinuous = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.onInputReceived = new EventManager<ISpeechInput>();
        this.onInputPreview = new EventManager<ISpeechInput>();
        this.onStartListening = new EventManager<void>();
        this.onStopListening = new EventManager<void>();
        this.startSpeakingEvent = new EventManager<string>();
        this.stopSpeakingEvent = new EventManager<void>();
        this.startSpeakingEvent.add(() => {
            this.isSpeaking = true;
        });
        this.stopSpeakingEvent.add(() => {
            this.isSpeaking = false;
        });
    }
    speak(text: string) {
        if (!this.isListening) return;
        //console.log('[SpeechListener] speak:', text);
        this.startSpeakingEvent.notify(text);
    }
    stopSpeaking() {
        //console.log('[SpeechListener] stopSpeaking');
        this.stopSpeakingEvent.notify();
    }
    startListening(continuous?: boolean | undefined) {
        if (this.isListening) return;
        //console.log('[SpeechListener] startListening', continuous);
        this.onStartListening.notify();
        this.isListening = true;
    }
    stopListening() {
        if (!this.isListening) return;
        //console.log('[SpeechListener] stopListening');
        this.isListening = false;
        this.onStopListening.notify();
        //this.stopSpeakingEvent.notify();
    }
}

export class SpeechQueue {
    private queue: string[];
    constructor(private speechListener: SpeechListener) {
        this.queue = [];
        speechListener.stopSpeakingEvent.add(() => {
            const next = this.queue.shift();
            if (next) {
                speechListener.speak(next);
            }
        });
    }

    speak(text: string) {
        // if (this.speechListener.isSpeaking) {
        //     console.log('[SpeechQueue] queue:', text);
        //     this.queue.push(text);
        //     // setTimeout(() => {
        //     //     this.speechListener.stopSpeaking();
        //     // }, text.length * 80);
        // } else {
        //console.log('[SpeechQueue] speak:', text);
        this.speechListener.speak(text);
        // }
    }
}