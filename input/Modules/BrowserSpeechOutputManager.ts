export class BrowserSpeechOutputManager implements ISpeechOutputManager {

    public isSpeaking: boolean;
    public isEnabled: boolean;
    public onStartSpeaking: IEvent<string>;
    public onStopSpeaking: IEvent<void>;

    #voices: string[];

    constructor(public defaultVoice?: string | undefined) {
        this.isSpeaking = false;
        this.isEnabled = 'speechSynthesis' in window;
        this.onStartSpeaking = new EventManager<string>();
        this.onStopSpeaking = new EventManager<void>();
        this.#voices = [];
    }

    async init() {
        if (!this.isEnabled) return;
        await this.voices();
    }

    voices(): Promise<string[]> {
        return new Promise<string[]>((resolve) => {
            if (!this.#voices) {
                const voices = speechSynthesis.getVoices();
                if (voices.length > 0) {
                    this.#voices = voices.filter(({ lang, name }) => lang == 'en-US' && name.indexOf('Ana') === -1).map(({ name }) => name);
                    resolve(this.#voices);
                } else {
                    speechSynthesis.onvoiceschanged = () => {
                        this.#voices = speechSynthesis.getVoices().filter(({ lang, name }) => lang == 'en-US' && name.indexOf('Ana') === -1).map(({ name }) => name);
                        resolve(this.#voices);
                    };
                }
            } else {
                resolve(this.#voices);
            }
        });
    }

    startSpeaking(text: string, voice?: string | undefined) {
        this.stopSpeaking();
        if (!this.isEnabled) return;

        text = removeMarkdown(text).trim();
        if (!voice) voice = this.defaultVoice;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = speechSynthesis.getVoices().find(v => voice && v.name.toLowerCase().includes(voice)) || null;
        utterance.rate = 1.1;
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.onStartSpeaking.notify(text);
        };
        utterance.onend = () => {
            this.onStopSpeaking.notify();
        };
        utterance.onerror = () => {
            this.onStopSpeaking.notify();
        };
        speechSynthesis.speak(utterance);
    }

    stopSpeaking() {
        this.isSpeaking = false;
        if (!speechSynthesis.speaking) return;
        speechSynthesis.cancel();
    }
}