import { Persona } from "../Components/Persona";
import { applyDefaultSettings } from "../Modules/PersonaSettings";

function renderPersonaView(element: HTMLElement) {
    let settings;
    let json = localStorage.getItem('assistant-settings');
    if (json) {
        settings = JSON.parse(json);
    }
    const startSpeaking = new EventManager<string>();
    const stopSpeaking = new EventManager<void>();
    let isSpeaking = false;
    startSpeaking.add(() => { isSpeaking = true; });
    stopSpeaking.add(() => { isSpeaking = false; });
    function onClick() {
        if (isSpeaking) {
            stopSpeaking.notify();
        } else {
            startSpeaking.notify('Hello, how can I help you?');
        }
    }
    settings = applyDefaultSettings(settings) as PersonaSettings;
    element.appendChild(<PersonaView
        settings={settings}
        startSpeaking={startSpeaking}
        stopSpeaking={stopSpeaking}
        onClick={onClick}
    />);
}

export interface PersonaViewProps {
    settings: JSX.IReference<PersonaSettings>;
    startSpeaking: IEvent<string>;
    stopSpeaking: IEvent<void>;
    onClick?: () => void;
}

export function PersonaView(props: PersonaViewProps) {
    const { settings, startSpeaking, stopSpeaking, onClick = undefined } = props;
    const container = $reference<HTMLElement>();

    container.onLoad.add((element) => {
        setTimeout(() => element.classList.add("open"), 100);
    });

    return (
        <div ref={container} when={settings}>
            {(value) =>
                <Persona
                    settings={value}
                    onStartSpeaking={startSpeaking}
                    onStopSpeaking={stopSpeaking}
                    onClick={onClick}
                />
            }
        </div>
    );
}