import { MediaInputHandler, MediaInputToggle, ScreenPosition, UserAudioInputHandler, UserVideoInputHandler } from "../Modules/UserMediaInputHandler";

export interface MediaInputProps extends JSX.Component<HTMLElement> {
    input: IEvent<MediaInputToggle>;
    type: MediaInputType;
    interval?: number | undefined;
    preview?: boolean | undefined;
    position?: ScreenPosition;
}

export function MediaInput(props: MediaInputProps) {
    const { input, type, interval = 5000, preview = true, position = 'top-right' } = props;
    const label = $reference<HTMLLabelElement>();
    const check = $reference<HTMLInputElement>();
    const previewElement = $reference<HTMLDivElement>();

    const mediaInput = new MediaInputToggle();
    const userMediaInput: MediaInputHandler = type === 'microphone'
        ? new UserAudioInputHandler(mediaInput, interval)
        : new UserVideoInputHandler(mediaInput, type, interval);
    mediaInput.onStart(onMediaInputStarted);
    mediaInput.onStop(onMediaInputStopped);
    mediaInput.onInput(onMediaInputPreview);
    mediaInput.onChange(onMediaInputChange);
    input.notify(mediaInput);

    if (preview) {
        label.onLoad.add((element) => {
            element.parentElement!.parentElement!.appendChild(
                <div ref={previewElement} class={`media-preview screen-position ${position}`}>
                    {userMediaInput.preview}
                </div>
            );
        });
    }
    return (
        <label ref={label} class="media" title={type === 'camera'
            ? 'Enable Camera'
            : type === 'microphone'
                ? 'Enable Microphone'
                : type === 'screen'
                    ? 'Share Screen'
                    : ''}>
            <input ref={check} type="checkbox" onchange={toggle} />
            {type === 'camera'
                ? $Images.CameraIcon
                : type === 'microphone'
                    ? $Images.MicIcon
                    : type === 'screen'
                        ? $Images.ComputerIcon
                        : $Images.AboutIcon}
            <h5>{type === 'camera'
                ? 'Show'
                : type === 'microphone'
                    ? 'Talk'
                    : type === 'screen'
                        ? 'Share'
                        : ''}</h5>
        </label>
    );

    function toggle() {
        if (check.value!.checked) {
            console.log('start');
            mediaInput.start();
        } else {
            console.log('stop');
            mediaInput.stop();
        }
    }

    function onMediaInputStarted() {
        label.value!.classList.add('active');
        if (!previewElement.value) return;
        previewElement.value.classList.add('active');
    }

    function onMediaInputStopped() {
        label.value!.classList.remove('active');
        if (!previewElement.value) return;
        previewElement.value.classList.remove('active');
    }

    function onMediaInputPreview(media: IMediaInput) {
        console.log('onMediaInputPreview', media);
    }

    function onMediaInputChange(media: IMediaInput) {
        console.log('onMediaInputChange', media);
    }
}