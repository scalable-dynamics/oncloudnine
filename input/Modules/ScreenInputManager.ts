export class ScreenInputManager implements IMediaInputManager {
    isRecording: boolean;
    onInputReceived: IEvent<IMediaInput>;
    onStartRecording: IEvent<void>;
    onStopRecording: IEvent<void>;
    stream: MediaStream | null;
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    timer: number | undefined;

    constructor(private interval?: number | undefined, private width: number = 1024, private height: number = 768) {
        this.isRecording = false;
        this.stream = null;
        this.onInputReceived = new EventManager();
        this.onStartRecording = new EventManager();
        this.onStopRecording = new EventManager();
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
    }

    async startRecording() {
        if (!this.isRecording && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            try {
                this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                this.stream.addEventListener('inactive', () => this.stopRecording());
                this.video.srcObject = this.stream;
                this.video.play();
                this.isRecording = true;
                if (this.interval) {
                    this.onStartRecording.notify();
                    setTimeout(() => this.capture().then(media => this.onInputReceived.notify(media!)), 1500);
                    this.timer = window.setInterval(() => this.isRecording && this.capture().then(media => this.onInputReceived.notify(media!)), this.interval);
                } else {
                    setTimeout(() => {
                        this.onStartRecording.notify();
                        this.capture().then(media => {
                            this.onInputReceived.notify(media!);
                            this.stopRecording();
                        });
                    }, 1500);
                }
            } catch (err) {
                console.error('Error starting screen input stream:', err);
            }
        }
    }

    stopRecording() {
        if (this.isRecording && this.stream) {
            window.clearInterval(this.timer);
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
            this.isRecording = false;
            this.onStopRecording.notify();
        }
    }

    async capture() {
        if (!this.isRecording) return;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context.drawImage(this.video, 0, 0, this.width, this.height);
        const dataUrl = this.canvas.toDataURL('image/jpeg');
        return { type: 'screen', dataUrl } as IMediaInput;
    }
}
