export class UserMediaManager {
    public audioContext: AudioContext | null = null;

    public stream: MediaStream | null = null;
    //private audioSource: MediaStreamAudioSourceNode | null = null;

    constructor(public mediaType: 'camera' | 'microphone' | 'screen', public deviceId: string | undefined = undefined) { }

    async startMedia(deviceId?: string) {
        if (!this.stream) {
            if(deviceId) this.deviceId = deviceId;
            const constraints = {
                audio: this.mediaType === 'microphone' ? { deviceId: this.deviceId ? { exact: this.deviceId } : undefined } : false,
                video: this.mediaType === 'camera' ? { deviceId: this.deviceId ? { exact: this.deviceId } : undefined } : false,
            };
            if (this.mediaType === 'screen') {
                this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            } else {
                this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            if (this.mediaType === 'microphone') {
                this.audioContext = new AudioContext();
                // this.audioSource = this.audioContext.createMediaStreamSource(this.stream);
                ////////this.audioSource.connect(this.audioContext.destination);
            }
        }
        return this.stream;
    }

    async switchDevice(newDeviceId: string) {
        const isRecording = !!this.stream;
        if (isRecording) {
            this.stopMedia();
            await this.startMedia(newDeviceId);
        } else {
            this.deviceId = newDeviceId;
        }
    }

    stopMedia() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    async getAvailableDevices() {
        if (this.mediaType === 'screen') return [];
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === (this.mediaType === 'microphone' ? 'audioinput' : 'videoinput'));
    }
}