declare var $Images;

interface SpeechInputProps extends JSX.Component<HTMLElement> {
    speech: ISpeechInputManager;
    onSpeechInput: (text: string) => void;
    continuous?: boolean | undefined;
}

export function SpeechInput(props: SpeechInputProps) {
    const { speech, onSpeechInput, continuous, ...rest } = props;
    const check = $reference<HTMLInputElement>();
    const preview = $reference<HTMLInputElement>();

    speech.onInputReceived.add(onInputReceived);
    speech.onInputPreview.add(onInputPreview);
    speech.onStopListening.add(onStopListening);

    return (
        <label ref={preview} class="speech">
            <input ref={check} type="checkbox" onchange={toggle} />
            {$Images.MicIcon}
        </label>
    );

    function onInputReceived(text) {
        onSpeechInput(text);
    }

    function onInputPreview(text) {
        if (!preview.value) return;
        preview.value.dataset.speech = text;
    }

    function onStopListening() {
        if (!check.value || !preview.value) return;
        check.value.checked = false;
        preview.value.dataset.speech = '';
    }

    function toggle() {
        if (!check.value) return;
        console.log('toggle', check.value.checked);
        if (check.value.checked) {
            speech.startListening(continuous);
        } else {
            speech.stopListening();
        }
    }
}