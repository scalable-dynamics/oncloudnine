export type ScreenPosition = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-right';

export abstract class MediaInputHandler {

    get active() { return this.input.active; }

    constructor(private input: MediaInputToggle) {
        input.onStart(this.onStart.bind(this));
        input.onStop(this.onStop.bind(this));
    }

    abstract onStart();

    abstract onStop();

    abstract get preview(): HTMLElement;

    start() {
        this.input.start();
    }

    stop() {
        this.input.stop();
    }

    protected onInput(media: IMediaInput) {
        this.input.input(media);
    }

    protected onChange(media: IMediaInput) {
        this.input.change(media);
    }
}

export class MediaInputToggle {

    active: boolean;

    private startEvent: IEvent<void>;
    private stopEvent: IEvent<void>;
    private inputEvent: IEvent<IMediaInput>;
    private changeEvent: IEvent<IMediaInput>;

    constructor() {
        this.active = false;
        this.startEvent = $event();
        this.stopEvent = $event();
        this.inputEvent = $event();
        this.changeEvent = $event();
    }

    onStart(callback: () => void) {
        this.startEvent.add(callback);
    }

    onStop(callback: () => void) {
        this.stopEvent.add(callback);
    }

    onInput(callback: (text: IMediaInput) => void) {
        this.inputEvent.add(callback);
    }

    onChange(callback: (text: IMediaInput) => void) {
        this.changeEvent.add(callback);
    }

    start() {
        if (this.active) return;
        this.active = true;
        this.startEvent.notify();
    }

    stop() {
        if (!this.active) return;
        this.active = false;
        this.stopEvent.notify();
    }

    input(text: IMediaInput) {
        if (!this.active) return;
        this.inputEvent.notify(text);
    }

    change(text: IMediaInput) {
        if (!this.active) return;
        this.changeEvent.notify(text);
    }
}

export class UserVideoInputHandler extends MediaInputHandler {

    stream: MediaStream | null;
    video: HTMLVideoElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    timer: number | undefined;

    get preview() { return this.video; }

    constructor(input: MediaInputToggle, private mode: 'camera' | 'screen', private interval?: number | undefined, private width: number = 1024, private height: number = 768) {
        super(input);
        this.stream = null;
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
    }

    async onStart() {
        if (navigator.mediaDevices) {
            try {
                console.log('stream');
                this.stream = this.mode === 'screen'
                    ? await navigator.mediaDevices.getDisplayMedia({ video: true })
                    : await navigator.mediaDevices.getUserMedia({ video: true });
                this.stream.addEventListener('inactive', () => this.stop());
                this.video.srcObject = this.stream;
                this.video.play();
                console.log('play');
                setTimeout(() => {
                    this.capture().then(media => {
                        if (!this.active) return;
                        this.onInput(media!);
                        if (this.interval) {
                            this.timer = window.setInterval(() => this.capture().then(media => {
                                if (!media || !this.active) return;
                                this.onInput(media!);
                            }), this.interval);
                        } else {
                            this.stop();
                        }
                    });
                }, 1500); // initial delay
            } catch (err) {
                console.error(`Error starting ${this.mode} input stream:`, err);
            }
        }
    }

    onStop() {
        if (this.stream) {
            window.clearInterval(this.timer);
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
            this.video.srcObject = null;
        }
    }

    async capture() {
        if (!this.active) return;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context.drawImage(this.video, 0, 0, this.width, this.height);
        const dataUrl = this.canvas.toDataURL('image/jpeg');
        return { type: this.mode, dataUrl } as IMediaInput;
    }
}

export class UserAudioInputHandler extends MediaInputHandler {

    stream: MediaStream | null;
    recorder: MediaRecorder | null;
    audioChunks: Blob[];
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    timer: number | undefined;

    get preview() { return this.canvas; }

    constructor(input: MediaInputToggle, private interval?: number | undefined, private width: number = 1024, private height: number = 768) {
        super(input);
        this.stream = null;
        this.recorder = null;
        this.audioChunks = [];
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d')!;
    }

    async onStart() {
        if (navigator.mediaDevices) {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.recorder = new MediaRecorder(this.stream);
                this.audioChunks = [];
                this.recorder.ondataavailable = event => {
                    this.audioChunks.push(event.data);
                };
                this.recorder.start();
                setTimeout(() => {
                    this.capture().then(media => {
                        if (!this.active) return;
                        this.onInput(media!);
                        if (this.interval) {
                            this.timer = window.setInterval(() => this.capture().then(media => {
                                if (!media || !this.active) return;
                                this.onInput(media!);
                            }), this.interval);
                        } else {
                            this.stop();
                        }
                    });
                }, 1500); // initial delay
            } catch (err) {
                console.error(`Error starting microphone input stream:`, err);
            }
        }
    }

    onStop() {
        if (this.stream) {
            window.clearInterval(this.timer);
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    async capture() {
        if (!this.recorder) return;
        this.recorder.stop();
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp4' });
        const dataUrl = URL.createObjectURL(audioBlob);
        this.audioChunks = [];
        if (this.active) this.recorder.start();
        return { type: 'microphone', dataUrl } as IMediaInput;
    }
}