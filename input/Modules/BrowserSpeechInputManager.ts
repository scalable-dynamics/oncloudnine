export class BrowserSpeechInputManager implements ISpeechInputManager {

    public isContinuous: boolean;
    public isListening: boolean;
    public onInputReceived: IEvent<ISpeechInput>;
    public onInputPreview: IEvent<ISpeechInput>;
    public onStopListening: IEvent<void>;

    private speechRecognizer;

    constructor(continuous?: boolean | undefined) {
        this.onInputReceived = new EventManager<ISpeechInput>();
        this.onInputPreview = new EventManager<ISpeechInput>();
        this.onStopListening = new EventManager<void>();
        const speechRecognition = window['webkitSpeechRecognition'] || window['SpeechRecognition'];
        this.speechRecognizer = new speechRecognition();
        this.speechRecognizer.continuous = continuous;
        this.speechRecognizer.interimResults = true;
        this.speechRecognizer.maxAlternatives = 1;
        this.speechRecognizer.lang = "en-US";
        this.isListening = false;
        this.isContinuous = (continuous === true);
        this.speechRecognizer.onaudioend = () => { console.log('onaudioend'); };
        this.speechRecognizer.onaudiostart = () => { console.log('onaudiostart'); };
        this.speechRecognizer.onend = () => { console.log('onend'); };
        this.speechRecognizer.onerror = (event) => { console.log('onerror:', event); };
        this.speechRecognizer.onnomatch = () => { console.log('onnomatch'); };
        this.speechRecognizer.onsoundend = () => { console.log('onsoundend'); };
        this.speechRecognizer.onsoundstart = () => { console.log('onsoundstart'); };
        this.speechRecognizer.onspeechend = () => { console.log('onspeechend'); };
        this.speechRecognizer.onspeechstart = () => { console.log('onspeechstart'); };
        this.speechRecognizer.onstart = () => { console.log('onstart'); };
        this.speechRecognizer.onresult = (event) => {
            if (!this.isListening) return;
            const result: SpeechRecognitionResult = event.results[event.results.length - 1];
            console.log('SpeechRecognitionResult:', result);
            const { transcript: text, confidence } = result.item(0);
            if (text) {
                if (result.isFinal) {
                    if (!this.isContinuous) {
                        this.isListening = false;
                        this.onStopListening.notify();
                    }
                    this.onInputPreview.notify({ text: '', confidence: 1 });
                    this.onInputReceived.notify({ text, confidence });
                }
                else {
                    this.onInputPreview.notify({ text, confidence });
                }
            }
        };
    }

    startListening(continuous?: boolean | undefined) {
        if (this.isListening) return;
        this.isContinuous = (continuous === true);
        this.speechRecognizer.continuous = this.isContinuous;
        this.isListening = true;
        this.speechRecognizer.start();
    }

    stopListening() {
        if (!this.isListening) return;
        this.isListening = false;
        this.speechRecognizer.stop();
        this.onStopListening.notify();
    }
}