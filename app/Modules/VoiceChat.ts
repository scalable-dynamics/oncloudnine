export class OpenAIRealtimeVoiceChat {
    //inputAudioBuffer: Int16Array<ArrayBuffer>;
    onReady: any;
    onUserSpeechStarted: any;
    onUserSpeechStopped: any;
    onAgentSpeechStarted: any;
    onAgentSpeechStopped: any;
    addMessage: any;
    onFunctionCalled: any;
    isUserSpeaking: any;
    isAgentSpeaking: any;

    constructor(onReady, onUserSpeechStarted, onUserSpeechStopped, onAgentSpeechStarted, onAgentSpeechStopped, addMessage, onFunctionCalled) {
        //this.inputAudioBuffer = new Int16Array(0);
        this.onReady = onReady;
        this.onUserSpeechStarted = onUserSpeechStarted;
        this.onUserSpeechStopped = onUserSpeechStopped;
        this.onAgentSpeechStarted = onAgentSpeechStarted;
        this.onAgentSpeechStopped = onAgentSpeechStopped;
        this.addMessage = addMessage;
        this.onFunctionCalled = onFunctionCalled;
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

        function toggleMute(isMuted) {
            ms.getAudioTracks().forEach(t => t.enabled = !isMuted);
        }

        function stopAudioPlayback() {
            audioEl.srcObject = null;
        }

        function sendMessage(message) {
            const responseCreate = {
                type: "response.create",
                response: {
                    modalities: ["text"],
                    instructions: message
                },
            };
            dc.send(JSON.stringify(responseCreate));
        }

        function functionResponse(id, result) {
            const responseCreate = {
                type: "conversation.item.create",
                item: {
                    type: "function_call_output",
                    call_id: id,
                    output: JSON.stringify(result),
                }
            };
            dc.send(JSON.stringify(responseCreate));
        }

        const dc = pc.createDataChannel("oai-events");
        dc.addEventListener("message", (e) => {
            const realtimeEvent = JSON.parse(e.data);

            if (realtimeEvent.type === 'session.updated') {
                if (this.onReady) this.onReady();
            } else if (realtimeEvent.type === 'input_audio_buffer.speech_started') {
                this.isUserSpeaking = true;
                if (this.onUserSpeechStarted) this.onUserSpeechStarted();
            } else if (realtimeEvent.type === 'input_audio_buffer.speech_stopped') {
                this.isUserSpeaking = false;
                if (this.onUserSpeechStopped) this.onUserSpeechStopped();
            } else if (realtimeEvent.type === 'response.audio_transcript.done') {
                //console.log('response.audio_transcript.delta', realtimeEvent.delta);
                if (this.onAgentSpeechStarted) this.onAgentSpeechStarted(realtimeEvent.transcript, true);
                this.isAgentSpeaking = false;
            } else if (realtimeEvent.type === 'response.audio_transcript.delta') {
                //console.log('response.audio_transcript.delta', realtimeEvent.delta);
                //if (!this.isAgentSpeaking) {
                if (this.onAgentSpeechStarted) this.onAgentSpeechStarted(realtimeEvent.delta);
                //}
                this.isAgentSpeaking = true;
            } else if (realtimeEvent.type === 'response.function_call_arguments.done') {

                console.log('response.function_call_arguments.done', realtimeEvent);
                if (realtimeEvent.arguments && realtimeEvent.name) {
                    try {
                        const functionArgs = JSON.parse(realtimeEvent.arguments);
                        console.log('function', realtimeEvent.name, functionArgs);
                        if (this.onFunctionCalled) {
                            this.onFunctionCalled(realtimeEvent.name, functionArgs).then(result => {
                                functionResponse(realtimeEvent.call_id, result);
                            });
                        } else {
                            functionResponse(realtimeEvent.call_id, { error: 'No function handler' });
                        }
                    } catch (e) {
                        console.error('Error parsing function arguments', e);
                    }
                }

            } else if (realtimeEvent.type === 'response.done') {
                //console.log('un-processed event', realtimeEvent);
                if (this.onAgentSpeechStopped) this.onAgentSpeechStopped();
            } else if (realtimeEvent.type === 'response.text.done') {
                if (this.addMessage) this.addMessage(realtimeEvent.text);
                // } else if (realtimeEvent.type === 'conversation.item.input_audio_transcription.completed') {
                //     console.log('conversation.item.input_audio_transcription.completed', realtimeEvent.transcript);
                // } else if (realtimeEvent.type === 'response.audio.delta') {
                //     const delta = new Int16Array(realtimeEvent.delta);
                //     this.inputAudioBuffer = new Int16Array([...this.inputAudioBuffer, ...delta]);
                //     console.log('response.audio.delta', this.inputAudioBuffer.length);
                // } else if (realtimeEvent.type === 'response.audio.done') {
                //     console.log('response.audio.done');
            } else {
                //console.log('un-processed event', realtimeEvent);
            }
            //console.log('all events', realtimeEvent);
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
            sendMessage,
            stopSpeaking() {
                stopAudioPlayback();
            },
            mute() {
                toggleMute(true);
            },
            unMute() {
                toggleMute(false);
            },
            stop() {
                pc.close();
                ms.getTracks().forEach(t => t.stop());
            }
        };
    }
}