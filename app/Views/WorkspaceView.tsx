import { OpenAIVoiceChat } from "../Modules/VoiceChat";

interface PendingAction {
    type: 'create_application' | 'update_persona' | 'generate_image';
    label: string;
    abort(): void;
    pending: boolean;
}

function renderWorkspaceView(element: HTMLElement) {
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
    element.appendChild(WorkspaceView(settings));
}

function WorkspaceView(defaultSettings: PersonaSettings) {
    const connectButton = $reference<HTMLButtonElement>();
    const saveButton = $reference<HTMLButtonElement>();
    const assistant = $reference<HTMLDivElement>();
    const fileProcessor = new FileProcessor();
    const inputChanged = new EventManager<string>();
    const assistantTapped = new EventManager<void>();
    const messages = $reference<HTMLDivElement>();
    const settings = $reference<PersonaSettings>();
    const cameraInputToggle = $event<MediaInputToggle>();
    const microphoneInputToggle = $event<MediaInputToggle>();
    const screenInputToggle = $event<MediaInputToggle>();
    const startSpeakingEvent = $event<string>();
    const stopSpeakingEvent = $event<void>();
    const sidebar = $reference<HTMLElement>();
    const tray = $reference<HTMLElement>();
    const files = new ObservableList<File>([]);
    let fileNames: string[] = [];
    const memories = new ObservableList<string>([]);
    const pending = new ObservableList<PendingAction>([]);
    let cameraInput: MediaInputToggle, microphoneInput: MediaInputToggle, screenInput: MediaInputToggle;
    let currentFrame, currentHtml = '', currentTitle = '', generatingApplication = false;
    let connected = false, voiceChat: OpenAIVoiceChat;
    let scrollTimer;

    files.onItemAdded(async (file) => {
        const folder = await caches.open('assistant-files');
        folder.put(file.name, new Response(file));
        fileNames = files.array.map(f => f.name);
    });

    files.onItemRemoved(async (file) => {
        const folder = await caches.open('assistant-files');
        folder.delete(file.name);
        fileNames = files.array.map(f => f.name);
    });

    caches.open('assistant-files').then(async (folder) => {
        const keys = await folder.keys();
        for (const key of keys) {
            files.add(await folder.match(key).then((response) => response?.blob()).then((blob) => new File([blob!], key.url.replace(location.origin + '/', ''), { type: blob!.type })));
        }
        fileNames = files.array.map(f => f.name);
    });

    cameraInputToggle.add((toggle) => {
        cameraInput = toggle;
        cameraInput.onInput(appendImage.bind(null, 'Camera image'));
        cameraInput.onStart(() => {
            console.log('Camera started');
            setTimeout(() => {
                if (!cameraInput.active) return;
                cameraInput.stop();
                ShowTooltip('Camera stopped after 10 seconds to conserve AI energy.', assistant.value!);
            }, 10000);
        });
    });

    microphoneInput = new MediaInputToggle();
    // microphoneInputToggle.add((toggle) => {
    //     microphoneInput = toggle;
    microphoneInput.onStart(() => {
        console.log('Microphone started');
        if (voiceChat) {
            voiceChat.toggleMute(true);
        } else {
            startVoiceChat();
        }
    });
    microphoneInput.onStop(() => {
        console.log('Microphone stopped');
        if (voiceChat) {
            voiceChat.toggleMute(false);
        } else {
            stopVoiceChat();
        }
    });
    // });

    screenInputToggle.add((toggle) => {
        screenInput = toggle;
        screenInput.onInput(appendImage.bind(null, 'Screen image'));
        screenInput.onStart(() => {
            console.log('Camera started');
            setTimeout(() => {
                if (!screenInput.active) return;
                screenInput.stop();
                ShowTooltip('Screen Sharing stopped after 10 seconds to conserve AI energy.', assistant.value!);
            }, 10000);
        });
    });

    if (defaultSettings) {
        settings.setReference(defaultSettings);
        if (defaultSettings.memories) {
            for (const memory of defaultSettings.memories) {
                memories.add(memory);
            }
        }
    }

    document.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            assistant.value!.classList.toggle('scrolled', window.scrollY > 0);
            assistant.value!.classList.remove('tapped', 'pinned');
            pinAssistantToToolbar();
        }, 100);
    });

    messages.onLoad.add(() => {
        pinAssistantToToolbar();
        appendMessage(`Welcome to Cloud Nine AI. I'm your assistant. How can I help you today?\n\nYou can ask me about any subject and I can generate images, applications, games, documents or presentations about anything you have on your mind!`);
    });

    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data.type === 'error') {
            console.error('An error occurred:', data.message);
        } else if (data.type === 'loaded') {
            console.log('Frame loaded:', data.title, data.height);
            if (!currentFrame) return;
            currentFrame.style.height = data.height + 20 + 'px';
            currentTitle = data.title || currentTitle;
        }
    });

    function pinAssistant(pinned) {
        assistant.value!.classList.toggle('pinned', pinned);
        pinAssistantToToolbar();
    }

    function pinAssistantToToolbar() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar) return;
        assistant.value!.style.bottom = toolbar.clientHeight + 'px';
    }

    return (
        <div class="main">
            <div class="header">
                <button onclick={toggleSidebar}>
                    {$Images.MenuIcon}
                </button>
                <button ref={saveButton} onclick={() => window.print()} style="display:none">🖨️ Save</button>
                <h1>Cloud Nine AI</h1>
                <button ref={connectButton} onclick={toggleVoiceChat}>🔵 Connect</button>
            </div>

            <div ref={sidebar} class="sidebar screen-position top">
                <button class="toggle" onclick={toggleSidebar} />
                <Tabs selected="Files">
                    <div data-tab="Files">
                        <List items={files}>
                            {(file: File, remove) =>
                                <a class="list-item" onclick={() => {
                                    previewFile(file);
                                }}>
                                    <button class="remove" onclick={remove}>
                                        &#10006;
                                    </button>
                                    <h5>{file.name}</h5>
                                </a>
                            }
                        </List>
                    </div>
                    <div data-tab="Memories">
                        <List items={memories}>
                            {(memory: string, remove) =>
                                <a class="list-item" onclick={() => {

                                }}>
                                    <button class="remove" onclick={remove}>
                                        &#10006;
                                    </button>
                                    <h5>{memory}</h5>
                                </a>
                            }
                        </List>
                    </div>
                    <div data-tab="Settings">
                        <h2>Settings</h2>
                        <input type="text" name="name" data-label="Name" placeholder="Your name" />
                        <input type="text" name="description" data-label="Description" placeholder="Description" />
                    </div>
                </Tabs>
            </div>

            <div ref={assistant} class="assistant screen-position bottom-center">
                <PersonaView
                    settings={settings}
                    startSpeaking={startSpeakingEvent}
                    stopSpeaking={stopSpeakingEvent}
                    onClick={async () => {
                        assistantTapped.notify();
                        if (assistant.value!.classList.contains('pinned')) {
                            assistant.value!.classList.remove('tapped', 'pinned');
                        } else {
                            assistant.value!.classList.toggle('tapped');
                            if (!assistant.value!.classList.contains('tapped')) {
                                assistant.value!.classList.remove('pinned');
                            }
                        }
                    }}
                />
            </div>

            <div class="conversation" ref={messages}></div>

            <div ref={tray} class="tray">
                <button class="toggle" onclick={toggleTray} />
                <h4>Pending</h4>
                <List items={pending}>
                    {(item: PendingAction, remove) =>
                        <a class="list-item" onclick={() => {
                            ShowTooltip(item.label, tray.value!, 5);
                        }}>
                            <button class="remove" onclick={remove}>
                                &#10006;
                            </button>
                            <h5>{item.label}</h5>
                        </a>
                    }
                </List>
            </div>

            <div class="toolbar">
                <div class="section" style="width:var(--max-width)">
                    <MediaInput
                        type="camera"
                        position="top-right"
                        input={cameraInputToggle}
                    />
                    {/* <MediaInput
                        type="microphone"
                        position="bottom-center"
                        input={microphoneInputToggle}
                        preview={false}
                    /> */}
                    <div style="padding-top: .4rem;">
                        <IconButton
                            icon={$Images.MicIcon}
                            label="Talk"
                            onToggle={(active) => {
                                if (microphoneInput) {
                                    if (active) {
                                        startVoiceChat();
                                    } else {
                                        stopVoiceChat(false);
                                    }
                                }
                                return {
                                    label: active ? 'Mute' : 'Talk'
                                };
                            }}
                        />
                    </div>
                    <MediaInput
                        type="screen"
                        position="top-left"
                        input={screenInputToggle}
                    />
                    <div class="section grow">
                        <InputControl
                            enableFileInput={false}
                            enableSpeechInput={false}
                            fileProcessor={fileProcessor}
                            onInputInvalid={onInputInvalid}
                            onInputChanged={onInputChanged}
                        />
                    </div>
                    {/* <button onclick={testImage}>
                        {$Images.ImageIcon}
                        <h5>Image</h5>
                    </button>
                    <button onclick={testDocument}>
                        {$Images.DocumentIcon}
                        <h5>Doc</h5>
                    </button>
                    <button onclick={testApplication}>
                        {$Images.AppIcon}
                        <h5>App</h5>
                    </button>
                    <button onclick={testPreview}>
                        {$Images.ComputerIcon}
                        <h5>HTML</h5>
                    </button> */}
                    <IconButton
                        icon={$Images.MagicIcon}
                        label=". . ."
                        onClick={toggleTray}
                    />
                </div>
            </div>
        </div>
    );

    async function previewFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            const content = reader.result as string;
            const fileName = decodeURIComponent(file.name);
            if (file.type === 'text/html') {
                showHTML(fileName, content);
            } else if (file.type === 'text/markdown') {
                showDocument(fileName, content);
            } else if (file.type.startsWith('image/')) {
                showHTML(fileName, `<img src="${content}" alt="${fileName}" />`);
            } else {
                appendMessage(`File preview not supported for ${fileName}`);
            }
        };
        reader.readAsText(file);
    }

    function toggleSidebar() {
        sidebar.value!.classList.toggle('open');
    }

    function toggleTray() {
        tray.value!.classList.toggle('open');
    }

    function testPreview() {
        showHTML('Preview', `<h1>Hello World!</h1><div style="height:1000px;background-color:yellow;"></div>`);
    }

    function testImage() {
        onFunctionCalled('generate_image', { description: 'A beautiful sunset', size: '1024x1024' }, (voice) => voiceChat.updateVoice(voice));
    }

    function testDocument() {
        onFunctionCalled('create_document', { title: 'Test Document', markdown: '# Hello World!' }, (voice) => voiceChat.updateVoice(voice));
    }

    function testApplication() {
        onFunctionCalled('create_application', { name: 'Hello Worldly', specs: 'The grooviest Hello World!' }, (voice) => voiceChat.updateVoice(voice));
    }

    function toggleVoiceChat() {
        if (connected) {
            stopVoiceChat();
        } else {
            startVoiceChat();
        }
    }

    function stopVoiceChat(reload = true) {
        if (voiceChat) voiceChat.disconnect();
        pinAssistant(false);
        connectButton.value!.classList.remove('recording');
        connectButton.value!.innerText = '🔵 Connect';
        connected = false;
        //hideContent();
        //if (reload) document.location.reload();
    }

    async function tryConnect() {
        if (!voiceChat) {
            return await startVoiceChat();
        }
    }

    async function startVoiceChat() {
        connectButton.value!.classList.add('connecting');
        if (voiceChat) {
            voiceChat.disconnect();
        }
        voiceChat = new OpenAIVoiceChat();
        voiceChat.userStateChanged.add((state) => {

            if (state.speaking === true) {
                onUserSpeechStarted();
            } else if (state.speaking === false) {
                onUserSpeechStopped();
            }

        });
        voiceChat.agentStateChanged.add((state) => {

            if (state.connected) {
                console.log('Voice chat ready');
                connectButton.value!.classList.remove('connecting');
                connectButton.value!.classList.add('recording');
                connectButton.value!.innerText = '🔴 Connected';
                saveButton.value!.style.display = 'inline-block';
                connected = true;
                if (fileNames.length > 0) {
                    voiceChat.sendMessage(`Files available (for creating applications; previously generated by you):\n${fileNames.join('\n')}`);
                }
                if (memories.array.length > 0) {
                    voiceChat.sendMessage(`Memories available:\n${memories.array.join('\n')}`);
                }
            } else if (state.speaking === false) {
                onAgentSpeechStopped();
            } else if (state.speaking === true) {
                if (!state.lastMessage) return;
                onAgentSpeechStarted(state.lastMessage!, false);
            } else {
                console.log('agent state changed', state);
            }

        });
        voiceChat.messageReceived.add((message) => {
            appendMessage(`${message.from}: ${message.message}`);
        });
        voiceChat.functionCalled.add((func) => {
            return onFunctionCalled(func.name, func.args, (voice) => voiceChat.updateVoice(voice));
        });
        inputChanged.add(async (input) => {
            await tryConnect();
            voiceChat.sendMessage(input);
        });
        assistantTapped.add(() => {
            console.log('Assistant tapped');
            stopSpeakingEvent.notify();
            if (!voiceChat) return;
            voiceChat.stopAudioPlayback();
            //voiceChat.sendMessage('The user tapped your avatar, possibly to interrupt you. Please stop speaking.');
        });
        return voiceChat.connect(settings.value!);
    }

    function onUserSpeechStarted() {
        console.log('User speech started');
    }

    function onUserSpeechStopped() {
        console.log('User speech stopped');
    }

    function onAgentSpeechStarted(text: string, isFinal: boolean) {
        startSpeakingEvent.notify(text);
        if (isFinal) {
            console.log('Agent speech started');
            appendMessage(text);
        }
    }

    function onAgentSpeechStopped() {
        console.log('Agent speech stopped');
    }

    function hideContent() {
        pinAssistant(false);
    }

    function showDocument(title, markdown) {
        pinAssistant(true);
        const doc = (
            <DocumentPanel
                title={title}
                content={markdown}
                enableDownload={true}
                enablePrint={true}
                mode="Markdown"
                close={() => doc.remove()}
            />
        );
        messages.value!.appendChild(doc);
        messages.value!.scrollTo(0, messages.value!.scrollHeight);
    }

    // function showHTML(title, html) {
    //     pinAssistant(true);
    //     messages.value!.appendChild(
    //         <DocumentPanel
    //             title={title}
    //             content={html}
    //             enableDownload={true}
    //             enablePrint={true}
    //             mode="HTML"
    //         />
    //     );
    //     messages.value!.scrollTo(0, messages.value!.scrollHeight);
    // }

    function showHTML(title, html) {
        pinAssistant(true);
        const frame = previewHTML(html);
        const container = (
            <div class="document application">
                <h1>{title}</h1>
                <div class="content">
                    {frame}
                </div>
                <div class="actions">
                    <button title="Download" onclick={() => {
                        const blob = new Blob([html], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = title + '.html';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}>⏬</button>
                    <button title="Close" onclick={() => container.remove()}>&#10005;</button>
                </div>
            </div>
        );
        messages.value!.appendChild(container);
        container.scrollIntoView();
        currentFrame = frame;
        currentHtml = html;
        currentTitle = frame.contentWindow.document.title || title || currentTitle;
    }

    async function onFunctionCalled(name, args, updateVoice): Promise<any> {
        console.log('Function called:', name, args);
        tray.value!.classList.add('loading');
        const controller = new AbortController();
        const item: PendingAction = {
            type: name,
            label: `Creating ${args.name || args.description}...`,
            pending: true,
            abort() {
                if (!item.pending) return;
                item.pending = false;
                controller.abort();
            }
        };
        return new Promise(async (resolve) => {
            if (name === 'create_application') {
                if (generatingApplication) {
                    console.log('Application is being generated, please wait...');
                    resolve({ error: 'Application is being generated, please wait...' });
                    return;
                }
                try {
                    if (!args.name || !args.specs) {
                        console.error('Missing required parameters:', args);
                        resolve({ error: 'Missing required parameters' });
                        return;
                    }
                    pending.add(item);
                    ShowTooltip(`Creating Application: ${args.name}`, assistant.value!);
                    generatingApplication = true;
                    const application = await createApplication(args.name, args.specs, currentHtml, controller.signal);
                    console.log('Application created:', application);
                    generatingApplication = false;
                    if (!application) {
                        hideContent();
                    } else {
                        currentTitle = args.name;
                        currentHtml = application;
                        files.add(new File([application], `${encodeURIComponent(args.name)}.html`, { type: 'text/html' }));
                        showHTML(args.name, application);
                    }
                    item.pending = false;
                    pending.remove(item);
                    resolve({ html: application });
                } catch (e: any) {
                    console.error(e);
                    resolve({ error: e.toString() });
                }
            } else if (name === 'create_document') {

                if (!args.title || !args.markdown) {
                    console.error('Missing required parameters:', args);
                    resolve({ error: 'Missing required parameters' });
                    return;
                }

                files.add(new File([args.markdown], `${encodeURIComponent(args.title)}.md`, { type: 'text/markdown' }));
                showDocument(args.title, args.markdown);
                resolve({ document_created: args.title });

            } else if (name === 'add_memory') {

                if (!args.description) {
                    console.error('Missing required parameters:', args);
                    resolve({ error: 'Missing required parameters' });
                    return;
                }

                addMemory(args.description);
                resolve({ memory_added: args.description });

            } else if (name === 'generate_image') {

                if (!args.description || !args.size) {
                    console.error('Missing required parameters:', args);
                    resolve({ error: 'Missing required parameters' });
                    return;
                }

                pending.add(item);
                ShowTooltip(`Generating Image: ${args.description}`, assistant.value!);
                const image = await generateImage(args.description, args.size, 1, controller.signal);
                console.log('Image generated:', image);
                item.pending = false;
                pending.remove(item);
                if (image.error) {
                    resolve({ error: image.error });
                } else {
                    const imageName = image.alt || args.description;
                    const fileName = `${encodeURIComponent(imageName)}.jpg`;
                    files.add(new File([image.url], fileName, { type: 'image/jpeg' }));
                    showHTML(imageName, `<img src="${image.url}" alt="${imageName}" />`);
                    resolve({ image_url: fileName, image_description: imageName });
                }

            } else if (name === 'update_persona') {
                try {
                    if (!args.name || !args.appearance) {
                        console.error('Missing required parameters:', args);
                        resolve({ error: 'Missing required parameters' });
                        return;
                    }
                    console.log('Update persona:', args);
                    const newSettings = applyDefaultSettings({
                        ...settings.value!,
                        ...args.appearance
                    });
                    if (args.avatar === 'feminine') newSettings.avatar = 2;
                    if (args.name) newSettings.name = args.name;
                    if (args.description) newSettings.description = args.description;
                    if (args.voice) {
                        newSettings.voice = args.voice;
                        updateVoice(args.voice);
                    }
                    localStorage.setItem('assistant-settings', JSON.stringify(newSettings));
                    settings.setReference(newSettings);
                    resolve({ name: args.name, appearance: args.appearance });
                } catch (e: any) {
                    console.error(e);
                    resolve({ error: e.toString() });
                }
            } else {
                console.log('Function not found:', name);
                resolve({ error: 'Function not found' });
            }
        }).finally(() => {
            tray.value!.classList.remove('loading');
        });
    }

    async function appendImage(text, image: IMediaInput) {
        const description = text + ': ' + await describeImage(text, image.dataUrl);
        console.log(description);
        appendMessage(description);
        await tryConnect();
        voiceChat.sendMessage(description);
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
            await startVoiceChat();
        }
        inputChanged.notify(input);
    }

    function addMemory(memory) {
        console.log('Memory added:', memory);
        const settingsValue = settings.value!;
        if (!settingsValue.memories) settingsValue.memories = [];
        settingsValue.memories.push(memory);
        settings.setReference(settingsValue);
        localStorage.setItem('assistant-settings', JSON.stringify(settingsValue));
        memories.add(memory);
    }
}

function injectScriptTag(html, script) {
    const index = html.indexOf('<body');
    const scriptTag = "<script>" + script + "</" + "script>";
    if (index !== -1) {
        html = html.slice(0, index) + scriptTag + html.slice(index);
    } else {
        html = scriptTag + html;
    }
    return html;
}

function previewHTML(htmlContent) {
    const iframe = document.createElement<any>('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.minHeight = '100vh';
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
console.log('Document loaded',height,document.title);
    parent.postMessage({ type: 'loaded', title: document.title, height }, '*');
});`) + `<style>body>* { width: 100%; object-fit: contain; }</style>`);
        iframeDoc.close();
    });
    document.body.appendChild(iframe);
    return iframe;
}

async function createApplication(name, specs, html, signal?) {
    const response = await fetch('/api/createApplication', {
        method: 'POST',
        body: JSON.stringify({ name, specs, html }),
        signal
    });
    return await response.text();
}

async function generateImage(prompt, size = "1024x1024", count = 1, signal?) {
    const response = await fetch('/api/generateImage', {
        method: 'POST',
        body: JSON.stringify({ prompt, size, count }),
        signal
    });
    return await response.json();
}

async function describeImage(text, image_url, signal?) {
    const response = await fetch('/api/describeImage', {
        method: 'POST',
        body: JSON.stringify({ text, image_url }),
        signal
    });
    return await response.text();
}
