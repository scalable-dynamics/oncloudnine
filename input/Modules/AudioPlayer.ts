class AudioPlayer {
    private queue: (string | Blob)[] = [];
    private currentAudio: HTMLAudioElement | null = null;

    constructor(private fileStore: IFileStore, private onStop: () => void) { }

    async play(file: string | Blob) {
        this.queue.push(file);
        if (!this.currentAudio) {
            this.playNext();
        }
    }

    private async playNext() {
        if (this.queue.length === 0) {
            //console.log('AudioPlayer', 'All audio elements completed');
            this.onStop();
            return;
        }

        let file = this.queue.shift()!;
        const audio = new Audio();
        this.currentAudio = audio;

        if (typeof file === 'string') {
            const response = await this.fileStore.fetch(file);
            if (!response) {
                console.error('AudioPlayer', 'File not found:', file);
                this.playNext();
                return;
            }
            file = await response.blob();
        }

        audio.src = URL.createObjectURL(file as Blob);
        audio.onended = () => {
            this.currentAudio = null;
            this.playNext();
        };
        audio.play();
    }

    stop() {
        if (this.currentAudio) {
            //console.log('AudioPlayer', 'Stopping current audio element');
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.queue = [];
    }
}


// class AudioPlayer {
//     private queue: (string | Blob)[] = [];
//     private currentAudioSource: AudioBufferSourceNode | null = null;
//     public audioContext: AudioContext | null = null;

//     constructor(private fileStore: IFileStore, private onStop: () => void) {
//     }

//     async play(file: string | Blob) {
//         this.queue.push(file);
//         if (!this.audioContext) {
//             this.audioContext = new AudioContext();
//         }
//         if (!this.currentAudioSource) {
//             this.playNext();
//         }
//     }

//     private async playNext() {
//         if (this.queue.length === 0) {
//             this.onStop();
//             return;
//         }

//         let file = this.queue.shift()!;

//         if (typeof file === 'string') {
//             const response = await this.fileStore.fetch(file);
//             if (!response) {
//                 console.error('AudioPlayer', 'File not found:', file);
//                 this.playNext();
//                 return;
//             }
//             file = await response.blob();
//         }

//         const arrayBuffer = await file.arrayBuffer();
//         const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

//         this.currentAudioSource = this.audioContext!.createBufferSource();
//         this.currentAudioSource.buffer = audioBuffer;
//         this.currentAudioSource.connect(this.audioContext!.destination);
//         this.currentAudioSource.onended = () => {
//             this.currentAudioSource = null;
//             this.playNext();
//         };
//         this.currentAudioSource.start();
//     }

//     stop() {
//         if (this.currentAudioSource) {
//             this.currentAudioSource.stop();
//             this.currentAudioSource = null;
//         }
//         this.queue = [];
//     }
// }