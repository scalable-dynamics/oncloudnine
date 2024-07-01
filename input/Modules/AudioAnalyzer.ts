import { UserMediaRecorder } from "./UserMediaRecorder";

export class AudioAnalyzer {
    public dataArray: Uint8Array;

    private analyser: AnalyserNode | null = null;
    private speechDetected = false;
    private speechEndTimeout: number | null = null;
    private speechEndDelay = 1800;
    public threshold = 100;
    public onSpeechDetected: IEvent<void>;
    public onSpeechNotDetected: IEvent<void>;

    constructor(private mediaRecorder: UserMediaRecorder) {
        this.onSpeechDetected = $event();
        this.onSpeechNotDetected = $event();
        mediaRecorder.onStartRecording.add(() => this.startAnalysis());
        mediaRecorder.onStopRecording.add(() => this.stopAnalysis());
        this.dataArray = new Uint8Array(0);
    }

    async startAnalysis() {
        const audioContext = this.mediaRecorder.mediaManager.audioContext!;
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        const stream = await this.mediaRecorder.mediaManager.startMedia();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(this.analyser);
        this.analyze();
    }

    stopAnalysis() {
        this.mediaRecorder.stopRecording();
        this.analyser?.disconnect();
        this.analyser = null;
    }

    private analyze() {
        if (!this.analyser) return;
        requestAnimationFrame(() => this.analyze());
        this.analyser.getByteFrequencyData(this.dataArray);
        this.dataArray.fill(0, 0, 50); // Clear low frequencies
        this.detectSpeech();
    }

    private detectSpeech() {
        const maxAmplitude = Math.max(...this.dataArray);

        if (maxAmplitude > this.threshold) {
            if (!this.speechDetected) {
                this.speechDetected = true;
                this.onSpeechDetected.notify();
            }
            if (this.speechEndTimeout !== null) {
                clearTimeout(this.speechEndTimeout);
                this.speechEndTimeout = null;
            }
        } else {
            if (this.speechDetected) {
                if (this.speechEndTimeout === null) {
                    this.speechEndTimeout = window.setTimeout(() => {
                        this.speechDetected = false;
                        this.onSpeechNotDetected.notify();
                        this.speechEndTimeout = null;
                    }, this.speechEndDelay);
                }
            }
        }
    }
}