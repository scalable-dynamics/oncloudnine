import { UserMediaManager } from "./UserMediaManager";

export class UserMediaRecorder implements IMediaInputManager {

    video: HTMLVideoElement;
    isRecording: boolean;
    onInputReceived: IEvent<IMediaInput>;
    onStartRecording: IEvent<void>;
    onStopRecording: IEvent<void>;

    canvas: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;

    private recorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private timer: number | undefined;

    constructor(public mediaManager: UserMediaManager, private interval?: number, private width: number = 1024, private height: number = 768) {
        this.isRecording = false;
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.canvasContext = this.canvas.getContext('2d')!;
        this.onInputReceived = $event();
        this.onStartRecording = $event();
        this.onStopRecording = $event();
    }

    async startRecording() {
        const stream = await this.mediaManager.startMedia();
        this.recorder = new MediaRecorder(stream);
        if (this.mediaManager.mediaType === 'microphone') {
            this.chunks = [];
            this.recorder.ondataavailable = event => {
                this.chunks.push(event.data);
            };
        } else {
            this.video.disablePictureInPicture = true;
            this.video.playsInline = true;
            this.video.srcObject = stream;
            this.video.play();
        }
        this.recorder.start();
        this.isRecording = true;
        this.onStartRecording.notify();
        //if (this.mediaManager.mediaType === 'microphone') return;
        if (this.interval) {
            setTimeout(() => this.capture().then(() =>
                this.timer = window.setInterval(() => this.capture(), this.interval)
            ), 3000);
        } else {
            return this.capture();
        }
    }

    stopRecording() {
        if (this.recorder && this.isRecording) {
            this.isRecording = false;
            clearInterval(this.timer);
            this.onStopRecording.notify();
            this.recorder.stop();
            this.mediaManager.stopMedia();
        }
    }

    async capture() {
        if (!this.recorder || !this.isRecording) return;
        this.recorder.stop();
        let dataUrl, blob;
        if (this.mediaManager.mediaType === 'microphone') {
            const audioBlob = new Blob(this.chunks, { type: 'audio/wav' });
            dataUrl = URL.createObjectURL(audioBlob);
            blob = audioBlob;
            this.chunks = [];
        } else {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvasContext.drawImage(this.video, 0, 0, this.width, this.height);
            dataUrl = this.canvas.toDataURL('image/jpeg');
        }
        this.recorder.start();
        const result = { type: this.mediaManager.mediaType, dataUrl, blob } as IMediaInput;
        await this.onInputReceived.notify(result);
        return result;
    }
}