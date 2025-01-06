import { OpenAIRealtimeVoiceChat } from "../Modules/VoiceChat";

function renderMainView(element: HTMLElement) {
    let settings;
    let json = localStorage.getItem('assistant-settings');
    if (json) {
        settings = JSON.parse(json);
    } else {
        settings = {
            avatar: 2
        };
    }
    settings = applyDefaultSettings(settings);
    element.appendChild(MainView(settings));
}

function MainView(settings: PersonaSettings) {
    const header = $reference<HTMLHeadingElement>();
    const speechListener = new SpeechListener();
    const speechQueue = new SpeechQueue(speechListener);
    const fileProcessor = new FileProcessor();
    const inputChanged = new EventManager<string>();
    const messages = $reference<HTMLDivElement>();
    let connected = false;
    let voiceChat: any;

    speechListener.onStartListening.add(start);

    return (
        <div class="main">
            <div class="header">
                <h1 ref={header}>On Cloud Nine AI</h1>
            </div>
            <div class="content">
                <PersonaView
                    settings={settings}
                    startSpeaking={speechListener.startSpeakingEvent}
                    stopSpeaking={speechListener.stopSpeakingEvent}
                    onClick={() => {
                        if (speechListener.isListening) {
                            speechListener.stopListening();
                        } else {
                            speechListener.startListening();
                        }
                    }}
                />
                <InputControl
                    enableFileInput={true}
                    enableSpeechInput={true}
                    fileProcessor={fileProcessor}
                    onInputInvalid={onInputInvalid}
                    onInputChanged={onInputChanged}
                    speechInput={speechListener}
                />
                <div class="conversation" ref={messages}></div>
            </div>
        </div>
    );

    async function start() {
        console.log('Start', connected);
        if (connected) {
            speechListener.stopListening();
            header.value!.innerText = "On Cloud Nine AI";
            connected = false;
            if (voiceChat) {
                voiceChat.stop();
                voiceChat = null;
            }
        } else {
            header.value!.innerText = "Starting (please wait)";
            voiceChat = await new OpenAIRealtimeVoiceChat(
                () => {
                    console.log('Voice chat ready');
                    header.value!.innerText = "On Cloud Nine AI (listening)";
                    connected = true;
                    setTimeout(() => {
                        if(!voiceChat) return;
                        voiceChat.sendMessage("Introduce yourself and provide some conversation starters.");
                    }, 1000);
                },
                onUserSpeechStarted,
                onUserSpeechStopped,
                onAgentSpeechStarted,
                onAgentSpeechStopped,
                appendMessage
            ).init();
            speechListener.onStopListening.add(() => {
                if (!voiceChat) return;
                voiceChat.stop();
                voiceChat = null;
                header.value!.innerText = "On Cloud Nine AI";
                connected = false;
            });
            inputChanged.add((input) => {
                if (!voiceChat) return;
                voiceChat.sendMessage(input);
            });
        }
    }

    function onUserSpeechStarted() {
        console.log('User speech started');
    }

    function onUserSpeechStopped() {
        console.log('User speech stopped');
    }

    function onAgentSpeechStarted(text: string) {
        console.log('Agent speech started:', text);
        speechQueue.speak(text);
    }

    function onAgentSpeechStopped() {
        console.log('Agent speech stopped');
    }

    function appendMessage(message: string) {
        console.log(message);
        const div = document.createElement('div');
        div.classList.add('message');
        div.innerText = message;
        messages.value!.appendChild(div);
    }

    function onInputInvalid(message: string) {
        console.log('Input invalid', message);
    }

    function onInputChanged(input: string) {
        console.log('Input changed:', input);
        inputChanged.notify(input);
    }
}

class SpeechListener implements ISpeechInputManager {
    isContinuous: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    onInputReceived: IEvent<ISpeechInput>;
    onInputPreview: IEvent<ISpeechInput>;
    onStartListening: IEvent<void>;
    onStopListening: IEvent<void>;
    startSpeakingEvent: IEvent<string>;
    stopSpeakingEvent: IEvent<void>;
    constructor() {
        this.isContinuous = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.onInputReceived = new EventManager<ISpeechInput>();
        this.onInputPreview = new EventManager<ISpeechInput>();
        this.onStartListening = new EventManager<void>();
        this.onStopListening = new EventManager<void>();
        this.startSpeakingEvent = new EventManager<string>();
        this.stopSpeakingEvent = new EventManager<void>();
        this.startSpeakingEvent.add(() => {
            this.isSpeaking = true;
        });
        this.stopSpeakingEvent.add(() => {
            this.isSpeaking = false;
        });
    }
    speak(text: string) {
        console.log('[SpeechListener] speak:', text);
        this.startSpeakingEvent.notify(text);
    }
    stopSpeaking() {
        console.log('[SpeechListener] stopSpeaking');
        //this.stopSpeakingEvent.notify();
    }
    startListening(continuous?: boolean | undefined) {
        console.log('[SpeechListener] startListening', continuous);
        this.onStartListening.notify();
        this.isListening = true;
    }
    stopListening() {
        console.log('[SpeechListener] stopListening');
        this.isListening = false;
        this.onStopListening.notify();
        //this.stopSpeakingEvent.notify();
    }
}

class SpeechQueue {
    private queue: string[];
    constructor(private speechListener: SpeechListener) {
        this.queue = [];
        speechListener.stopSpeakingEvent.add(() => {
            const next = this.queue.shift();
            if (next) {
                speechListener.speak(next);
            }
        });
    }

    speak(text: string) {
        if (this.speechListener.isSpeaking) {
            this.queue.push(text);
        } else {
            this.speechListener.speak(text);
        }
    }
}