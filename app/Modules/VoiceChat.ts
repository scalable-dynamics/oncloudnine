export type VoiceChatEvent = "connected" | "speaking" | "busy" | "muted" | "message" | "function" | "disconnected";

export interface VoiceChatState {
    connected: boolean;
    speaking: boolean;
    busy: boolean;
    muted: boolean;
    lastMessage: string;
}

export interface VoiceChatMessage {
    message: string;
    from: string;
    timestamp: number;
}

export interface VoiceChatFunctionCall {
    name: string;
    args: any;
}

export class VoiceChat {

    userStateChanged: IEvent<Partial<VoiceChatState>>;
    agentStateChanged: IEvent<Partial<VoiceChatState>>;

    messageReceived: IEvent<VoiceChatMessage>;
    functionCalled: IEvent<VoiceChatFunctionCall>;

    constructor() {
        this.userStateChanged = $event();
        this.agentStateChanged = $event();
        this.messageReceived = $event();
        this.functionCalled = $event();
    }

    protected onConnected() {
        this.userStateChanged.notify({ connected: true });
        this.agentStateChanged.notify({ connected: true });
    }

    protected onDisconnected() {
        this.userStateChanged.notify({ connected: false });
        this.agentStateChanged.notify({ connected: false });
    }

    protected onUserStateChanged(state: Partial<VoiceChatState>) {
        this.userStateChanged.notify(state);
    }

    protected onAgentStateChanged(state: Partial<VoiceChatState>) {
        this.agentStateChanged.notify(state);
    }
}

export class OpenAIVoiceChat extends VoiceChat {

    private audioElement: HTMLAudioElement;
    private peerConnection?: RTCPeerConnection;
    private dataChannel?: RTCDataChannel;
    private mediaStream?: MediaStream;

    constructor() {
        super();

        this.audioElement = document.createElement("audio");
        this.audioElement.autoplay = true;
    }

    async connect(args) {
        this.peerConnection = new RTCPeerConnection();
        this.dataChannel = this.peerConnection.createDataChannel("oai-events");
        this.dataChannel.addEventListener("message", (e) => {
            const realtimeEvent = JSON.parse(e.data);
            if (realtimeEvent.type === 'session.updated') {

                this.onConnected();

            } else if (realtimeEvent.type === 'input_audio_buffer.speech_started') {

                this.onUserStateChanged({ speaking: true });

            } else if (realtimeEvent.type === 'input_audio_buffer.speech_stopped') {

                this.onUserStateChanged({ speaking: false });

            } else if (realtimeEvent.type === 'response.audio_transcript.done') {

                this.onAgentStateChanged({ speaking: true, lastMessage: realtimeEvent.transcript });

            } else if (realtimeEvent.type === 'response.audio_transcript.delta') {

                this.onAgentStateChanged({ speaking: true, lastMessage: realtimeEvent.delta });

            } else if (realtimeEvent.type === 'response.function_call_arguments.done') {

                //console.log('response.function_call_arguments.done', realtimeEvent);
                if (realtimeEvent.arguments && realtimeEvent.name) {
                    try {
                        const functionArgs = JSON.parse(realtimeEvent.arguments);
                        //console.log('function', realtimeEvent.name, functionArgs);
                        this.functionCalled.notify({ name: realtimeEvent.name, args: functionArgs }).then(result => {
                            if (!this.dataChannel) return;
                            const responseCreate = {
                                type: "conversation.item.create",
                                item: {
                                    type: "function_call_output",
                                    call_id: realtimeEvent.call_id,
                                    output: JSON.stringify(result),
                                }
                            };
                            this.dataChannel.send(JSON.stringify(responseCreate));
                        });
                    } catch (e) {
                        console.error('Error parsing function arguments', e);
                    }
                }

            } else if (realtimeEvent.type === 'response.done') {

                this.onAgentStateChanged({ speaking: false });

            } else if (realtimeEvent.type === 'response.text.done') {

                this.messageReceived.notify({ message: realtimeEvent.text, from: 'agent', timestamp: Date.now() });

            } else {
                //console.log('un-processed event', realtimeEvent);
            }
        });

        const token = await getSessionToken(args);
        if (!token) {
            throw new Error('Failed to get session token');
        }

        this.peerConnection.ontrack = e => this.audioElement.srcObject = e.streams[0];

        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.peerConnection.addTrack(this.mediaStream.getTracks()[0]);

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";
        const url = `${baseUrl}?model=${model}`;
        const sdpResponse = await fetch(url, {
            method: "POST",
            body: offer.sdp,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/sdp"
            },
        });

        await this.peerConnection.setRemoteDescription({
            type: "answer",
            sdp: await sdpResponse.text(),
        });
    }

    updateVoice(voice: string) {
        if (!this.dataChannel) return;
        const sessionUpdate = {
            type: "session.update",
            session: {
                voice
            }
        };
        this.dataChannel.send(JSON.stringify(sessionUpdate));
    }

    sendMessage(message: string) {
        if (!this.dataChannel) return;
        const responseCreate = {
            type: "response.create",
            response: {
                modalities: ["text", "audio"],
                instructions: message
            },
        };
        this.dataChannel.send(JSON.stringify(responseCreate));
    }

    toggleMute(isMuted) {
        if (!this.mediaStream) return;
        this.mediaStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
        this.onUserStateChanged({ muted: isMuted, speaking: false });
    }

    stopAudioPlayback() {
        this.audioElement.srcObject = null;
        if (!this.mediaStream) return;
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.onAgentStateChanged({ speaking: false });
    }

    disconnect() {
        this.stopAudioPlayback();
        if (this.peerConnection && this.peerConnection.connectionState === 'connected') {
            this.peerConnection.close();
        }
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.close();
        }
        this.peerConnection = undefined;
        this.dataChannel = undefined;
        this.onDisconnected();
    }
}

async function getSessionToken(args) {
    const tokenResponse = await fetch("/api/getSessionToken", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(args)
    });
    return await tokenResponse.text();
}