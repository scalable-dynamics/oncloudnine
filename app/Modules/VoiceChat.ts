export class OpenAIRealtimeVoiceChat {
    inputAudioBuffer: Int16Array<ArrayBuffer>;
    onReady: any;
    onUserSpeechStarted: any;
    onUserSpeechStopped: any;
    onAgentSpeechStarted: any;
    onAgentSpeechStopped: any;
    addMessage: any;

    constructor(onReady, onUserSpeechStarted, onUserSpeechStopped, onAgentSpeechStarted, onAgentSpeechStopped, addMessage) {
        this.inputAudioBuffer = new Int16Array(0);
        this.onReady = onReady;
        this.onUserSpeechStarted = onUserSpeechStarted;
        this.onUserSpeechStopped = onUserSpeechStopped;
        this.onAgentSpeechStarted = onAgentSpeechStarted;
        this.onAgentSpeechStopped = onAgentSpeechStopped;
        this.addMessage = addMessage;
    }

    async init(EPHEMERAL_KEY?: string) {
        if (!EPHEMERAL_KEY) {
            const tokenResponse = await fetch("/api/getSessionToken");
            EPHEMERAL_KEY = await tokenResponse.text();
            if (!EPHEMERAL_KEY) {
                console.error('Failed to get session token');
                return;
            }
        }

        const pc = new RTCPeerConnection();

        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        pc.ontrack = e => audioEl.srcObject = e.streams[0];

        const ms = await navigator.mediaDevices.getUserMedia({
            audio: true
        });
        pc.addTrack(ms.getTracks()[0]);

        const dc = pc.createDataChannel("oai-events");
        dc.addEventListener("message", (e) => {
            const realtimeEvent = JSON.parse(e.data);

            if (realtimeEvent.type === 'session.updated') {
                if (this.onReady) this.onReady();
            } else if (realtimeEvent.type === 'input_audio_buffer.speech_started') {
                if (this.onUserSpeechStarted) this.onUserSpeechStarted();
            } else if (realtimeEvent.type === 'input_audio_buffer.speech_stopped') {
                if (this.onUserSpeechStopped) this.onUserSpeechStopped();
            } else if (realtimeEvent.type === 'response.audio_transcript.done') {
                //console.log('response.audio_transcript.delta', realtimeEvent.delta);
                if (this.onAgentSpeechStarted) this.onAgentSpeechStarted(realtimeEvent.transcript);
            } else if (realtimeEvent.type === 'response.audio_transcript.delta') {
                console.log('response.audio_transcript.delta', realtimeEvent.delta);
                //if (this.onAgentSpeechStarted) this.onAgentSpeechStarted(realtimeEvent.delta);
            } else if (realtimeEvent.type === 'response.done') {
                if (this.onAgentSpeechStopped) this.onAgentSpeechStopped();
            } else if (realtimeEvent.type === 'response.text.done') {
                if (this.addMessage) this.addMessage(realtimeEvent.text);
            } else if (realtimeEvent.type === 'conversation.item.input_audio_transcription.completed') {
                console.log('conversation.item.input_audio_transcription.completed', realtimeEvent.transcript);
            } else if (realtimeEvent.type === 'response.audio.delta') {
                const delta = new Int16Array(realtimeEvent.delta);
                this.inputAudioBuffer = new Int16Array([...this.inputAudioBuffer, ...delta]);
                console.log('response.audio.delta', this.inputAudioBuffer.length);
            } else if (realtimeEvent.type === 'response.audio.done') {
                console.log('response.audio.done');
            } else {
                console.log('Unknown event', realtimeEvent);
            }
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: "POST",
            body: offer.sdp,
            headers: {
                Authorization: `Bearer ${EPHEMERAL_KEY}`,
                "Content-Type": "application/sdp"
            },
        });

        await pc.setRemoteDescription({
            type: "answer",
            sdp: await sdpResponse.text(),
        });

        return {
            sendMessage(instructions) {
                const responseCreate = {
                    type: "response.create",
                    response: {
                        modalities: ["text"],
                        instructions
                    },
                };
                dc.send(JSON.stringify(responseCreate));
            },
            stop() {
                pc.close();
                ms.getTracks().forEach(t => t.stop());
            }
        };
    }
}