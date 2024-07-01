export class AudioInputManager implements IMediaInputManager {
    isRecording: boolean;
    onInputReceived: IEvent<IMediaInput>;
    onStartRecording: IEvent<void>;
    onStopRecording: IEvent<void>;
    stream: MediaStream | null;
    recorder: MediaRecorder | null;
    audioChunks: Blob[];
    timer: number | undefined;
    video: any = null;

    constructor(private interval?: number | undefined) {
        this.isRecording = false;
        this.stream = null;
        this.recorder = null;
        this.audioChunks = [];
        this.onInputReceived = new EventManager();
        this.onStartRecording = new EventManager();
        this.onStopRecording = new EventManager();
    }

    async startRecording() {
        if (!this.isRecording && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.recorder = new MediaRecorder(this.stream);
                this.audioChunks = [];
                this.recorder.ondataavailable = event => {
                    this.audioChunks.push(event.data);
                };
                this.recorder.start();
                this.isRecording = true;
                if (this.interval) {
                    this.onStartRecording.notify();
                    setTimeout(() => this.capture().then(media => this.onInputReceived.notify(media!)), 1500);
                    let count = 0;
                    this.timer = window.setInterval(() => {
                        if (!this.isRecording || count++ > 10) {
                            clearInterval(this.timer);
                            this.stopRecording();
                            return;
                        }
                        this.capture().then(media => this.onInputReceived.notify(media!));
                    }, this.interval);
                } else {
                    setTimeout(() => {
                        this.onStartRecording.notify();
                        this.capture().then(media => {
                            this.onInputReceived.notify(media!);
                            this.stopRecording();
                        });
                    }, 5000);
                }
            } catch (err) {
                console.error('Error starting audio stream:', err);
            }
        }
    }

    stopRecording() {
        if (this.isRecording && this.stream) {
            if (this.recorder) this.recorder.stop();
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.isRecording = false;
            this.onStopRecording.notify();
        }
    }

    async capture() {
        if (!this.isRecording || !this.recorder) return;
        this.recorder.stop();
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp4' });
        const dataUrl = URL.createObjectURL(audioBlob);
        this.audioChunks = [];
        if (this.isRecording) this.recorder.start();
        return { type: 'microphone', dataUrl } as IMediaInput;
    }
}
