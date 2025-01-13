import { SpeechListener, SpeechQueue } from "../Modules/SpeechListener";
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
    const connectButton = $reference<HTMLButtonElement>();
    const saveButton = $reference<HTMLButtonElement>();
    const assistant = $reference<HTMLDivElement>();
    const speechListener = new SpeechListener();
    const speechQueue = new SpeechQueue(speechListener);
    const fileProcessor = new FileProcessor();
    const inputChanged = new EventManager<string>();
    const assistantTapped = new EventManager<void>();
    const messages = $reference<HTMLDivElement>();
    const preview = $reference<HTMLDivElement>();
    let connected = false;
    let currentHtml = '', currentTitle = '', generatingApplication = false;

    speechListener.onStartListening.add(() => {
        if (!connected) start();
    });

    let scrollTimer;
    document.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            assistant.value!.classList.toggle('scrolled', window.scrollY > 0);
        }, 100);
    });

    messages.onLoad.add(() => {
        appendMessage(`Welcome to Cloud Nine AI. I'm your assistant. How can I help you today?\n\nYou can ask me about any subject and I can generate applications, games, documents or presentations about anything you have on your mind!`);
    });

    return (
        <div class="main">
            <div class="header">
                <button ref={saveButton} onclick={save} style="display:none">🖨️ Save</button>
                <h1>Cloud Nine AI</h1>
                <button ref={connectButton} onclick={toggle}>🔵 Connect</button>
            </div>
            <div class="content">
                <div ref={assistant} class="assistant">
                    <PersonaView
                        settings={settings}
                        startSpeaking={speechListener.startSpeakingEvent}
                        stopSpeaking={speechListener.stopSpeakingEvent}
                        onClick={() => {
                            hideContent();
                            assistantTapped.notify();
                        }}
                    />
                    <InputControl
                        enableFileInput={false}
                        enableSpeechInput={true}
                        fileProcessor={fileProcessor}
                        onInputInvalid={onInputInvalid}
                        onInputChanged={onInputChanged}
                        speechInput={speechListener}
                    />
                </div>
                <div class="conversation" ref={messages}></div>
                <div class="preview" ref={preview}></div>
            </div>
        </div>
    );

    function save() {
        if (currentHtml && preview.value!.style.display === 'block') {
            stopVoiceChat(false);
            const blob = new Blob([currentHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentTitle + '.html';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            stopVoiceChat(false);
            window.print();
        }
    }

    function toggle() {
        if (connected || speechListener.isListening) {
            stopVoiceChat();
        } else {
            /////////////////////speechListener.startListening();
            const input = document.querySelector<HTMLInputElement>('.speech input[type="checkbox"]');
            if (input && !input.checked) {
                input.click();
            }
        }
    }

    function stopVoiceChat(reload = true) {
        speechListener.stopListening();
        assistant.value!.classList.remove('pinned');
        connectButton.value!.classList.remove('recording');
        connectButton.value!.innerText = '🔵 Connect';
        connected = false;
        speechListener.isListening = false;
        //hideContent();
        if (reload) document.location.reload();
    }

    async function start() {
        console.log('Start', connected);
        if (connected) {
            stopVoiceChat();
        } else {
            connectButton.value!.classList.add('connecting');
            let voiceChat: any = await new OpenAIRealtimeVoiceChat(
                () => {
                    console.log('Voice chat ready');
                    connectButton.value!.classList.remove('connecting');
                    connectButton.value!.classList.add('recording');
                    connectButton.value!.innerText = '🔴 Connected';
                    saveButton.value!.style.display = 'inline-block';
                    connected = true;
                    speechListener.isListening = true;
                    setTimeout(() => {
                        if (!voiceChat) return;
                        //voiceChat.sendMessage("Introduce yourself and provide some conversation starters.");
                    }, 1000);
                },
                onUserSpeechStarted,
                onUserSpeechStopped,
                onAgentSpeechStarted,
                onAgentSpeechStopped,
                appendMessage,
                onFunctionCalled
            ).init();
            speechListener.onStartListening.add(() => {
                if (!voiceChat) return;
                voiceChat.unMute();
            });
            speechListener.onStopListening.add(() => {
                if (!voiceChat) return;
                voiceChat.mute();
            });
            inputChanged.add((input) => {
                if (!voiceChat) return;
                voiceChat.sendMessage(input);
            });
            assistantTapped.add(() => {
                console.log('Assistant tapped');
                if (!voiceChat) return;
                voiceChat.stopSpeaking();
                //voiceChat.sendMessage('The user tapped your avatar, possibly to interrupt you. Please stop speaking.');
            });
        }
    }

    function onUserSpeechStarted() {
        console.log('User speech started');
    }

    function onUserSpeechStopped() {
        console.log('User speech stopped');
    }

    function onAgentSpeechStarted(text: string, isFinal: boolean) {
        //if (!isFinal) return;
        //console.log('Agent speech started:', isFinal, text);
        speechQueue.speak(text);
        if (isFinal) {
            appendMessage(text);
        }
    }

    function onAgentSpeechStopped() {
        //console.log('Agent speech stopped');
    }

    function hideContent() {
        preview.value!.innerHTML = '';
        preview.value!.style.display = 'none';
        assistant.value!.classList.remove('pinned');
    }

    function showHTML(html) {
        const frame = previewHTML(html);
        assistant.value!.classList.add('pinned');
        preview.value!.style.display = 'block';
        preview.value!.innerHTML = '';
        preview.value!.appendChild(frame);
        currentHtml = html;
        currentTitle = frame.contentWindow.document.title;
    }

    async function onFunctionCalled(name, args) {
        console.log('Function called:', name, args);
        return new Promise(async (resolve) => {
            if (generatingApplication) {
                console.log('Application is being generated, please wait...');
                resolve({ error: 'Application is being generated, please wait...' });
            } else if (name === 'create_application') {
                try {
                    if (!args.name || !args.specs) {
                        console.error('Missing required parameters:', args);
                        return;
                    }
                    if (preview.value!.style.display === 'block') {
                        preview.value!.classList.add('loading');
                    } else {
                        assistant.value!.classList.add('loading');
                    }
                    generatingApplication = true;
                    const application = await createApplication(args.name, args.specs, currentHtml);
                    console.log('Application created:', application);
                    preview.value!.classList.remove('loading');
                    assistant.value!.classList.remove('loading');
                    generatingApplication = false;
                    if (!application) {
                        hideContent();
                    } else {
                        showHTML(application);
                    }
                    resolve({ html: application });
                } catch (e: any) {
                    console.error(e);
                    resolve({ error: e.toString() });
                }
            } else {
                console.log('Function not found:', name);
                resolve({ error: 'Function not found' });
            }
        });
    }

    function appendMessage(message: string) {
        console.log('appendMessage', message);
        const div = document.createElement('div');
        div.classList.add('message');
        div.innerText = message;
        messages.value!.appendChild(div);
    }

    function onInputInvalid(message: string) {
        console.log('Input invalid', message);
    }

    async function onInputChanged(input: string) {
        console.log('Input changed:', input);
        if (!connected) {
            await start();
        }
        inputChanged.notify(input);
    }
}

function injectScriptTag(html, script) {
    const index = html.indexOf('<body');
    if (index !== -1) {
        html = html.slice(0, index) + "<script>" + script + "</" + "script>" + html.slice(index);
    }
    return html;
}

function previewHTML(htmlContent) {
    const iframe = document.createElement<any>('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    //iframe.style.minHeight = '100vh';
    iframe.style.border = 'none';
    iframe.addEventListener('load', () => {
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(injectScriptTag(htmlContent, `window.onerror = (message, source, lineno, colno, error) => {
    console.error('An error occurred:', message, source, lineno, colno, error);
    parent.postMessage({ type: 'error', message }, '*');
    return true;
};
document.addEventListener('DOMContentLoaded', () => {
    const height = document.documentElement.scrollHeight || document.body.scrollHeight;
    parent.postMessage({ type: 'loaded', title: document.title, height }, '*');
});`) + `<style>canvas { width: 100%; min-height: ${document.body.scrollHeight - 20}px; }</style>`);
        iframeDoc.close();
    });
    document.body.appendChild(iframe);
    return iframe;
}

async function createApplication(name, specs, html) {
    const response = await fetch('/api/createApplication', {
        method: 'POST',
        body: JSON.stringify({ name, specs, html })
    });
    return await response.text();
}