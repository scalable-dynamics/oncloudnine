import { FaceAnimation, MouthSystem, EyeMovementSystem } from '../Modules/FaceAnimation';

interface PersonaProps extends JSX.Component<HTMLElement> {
    animated?: boolean;
    settings: PersonaSettings;
    onClick?: () => void;
    nose?: JSX.IReference<HTMLElement>;
    onPersonaChanged?: IEvent<void>;
    onStartSpeaking: IEvent<string>;
    onStopSpeaking: IEvent<void>;
}

export function Persona(props: PersonaProps) {

    const images = [
        "img/avatar1.png",
        "img/avatar2.png",
        "img/avatar3.png",
        "img/avatar4.png"
    ];
    const noses = [
        "img/nose1.png",
        "img/nose2.png",
        "img/nose1.png",
        "img/nose2.png"
    ];

    const { ref, nose: noseOut, if: isVisible, animated = true, settings, onClick, onPersonaChanged, onStartSpeaking, onStopSpeaking } = props;
    if (!images[settings.avatar]) return null;

    const leftEye = $reference<HTMLElement>();
    const leftEyeBrow = $reference<HTMLElement>();
    const leftIris = $reference<HTMLElement>();
    const rightEye = $reference<HTMLElement>();
    const rightEyeBrow = $reference<HTMLElement>();
    const rightIris = $reference<HTMLElement>();
    const nose = noseOut || $reference<HTMLElement>();
    const mouth = $reference<HTMLElement>();
    const person = ref || $reference<HTMLElement>();
    const skin = $reference<HTMLElement>();
    const photo = $reference<HTMLElement>();
    const mouthSystem = $reference<MouthSystem>();
    const eyeMovementSystem = $reference<EyeMovementSystem>();

    onStartSpeaking.add((text) => {
        console.log('persona->onStartSpeaking', text);
        if (!mouthSystem.value) return;
        mouthSystem.value.startSpeaking(text);
    });
    onStopSpeaking.add(() => {
        if (!mouthSystem.value) return;
        mouthSystem.value.stopSpeaking();
    });

    function loadPersona() {
        if (!person.value || !photo.value || !nose.value || !skin.value) return;
        if (mouthSystem.value) mouthSystem.value.stopSpeaking();
        const smaller = false//Boolean(container.classList.contains('small') || container.classList.contains('medium') || document.querySelector('input:focus,textArea:focus'));
        if (eyeMovementSystem.value) eyeMovementSystem.value.isSmall = smaller;
        const properties = getPersonaProperties(settings, smaller);
        for (const key in properties) {
            person.value.style.setProperty(key, properties[key]);
        }
        photo.value.style.display = settings.showHair ? 'block' : 'none';
        nose.value.style.display = settings.showNose ? 'block' : 'none';
        if (settings.image) {
            photo.value.style.backgroundImage = `url(${settings.image})`;
            photo.value.style.maskImage = `url(${images[settings.avatar]})`;
            photo.value.style.maskRepeat = 'no-repeat';
            photo.value.style.maskSize = '100% 100%';
            nose.value.style.display = 'none';
        } else {
            photo.value.style.backgroundImage = `url(${images[settings.avatar]})`;
            nose.value.style.backgroundImage = `url(${noses[settings.avatar]})`;
            nose.value.style.display = 'block';
        }
        if (settings.showOutline) {
            const outlineImage = `img/photo${settings.avatar === 0 || settings.avatar === 1 ? 1 : 2}.png`;
            const image = skin.value.querySelector('.outline');
            if (image) {
                image.setAttribute('src', outlineImage);
            } else {
                skin.value.appendChild(<img class="outline" src={outlineImage} alt="" />);
            }
            nose.value.style.display = 'none';
            if (!settings.image) {
                photo.value.style.display = 'none';
            }
        }
        //person.value.style.opacity = '0';
    }

    if (onPersonaChanged) onPersonaChanged.add(loadPersona);

    person.onLoad.add(() => {
        console.log('person.onLoad', settings);
        loadPersona();
        if (!animated) return;
        const face = new FaceAnimation(leftEye.value!, leftEyeBrow.value!, leftIris.value!, rightEye.value!, rightEyeBrow.value!, rightIris.value!, mouth.value!, false);
        mouthSystem.setReference(face.mouthSystem);
        eyeMovementSystem.setReference(face.eyeMovementSystem);
        face.runDelayed();
    });

    if (animated) window.addEventListener('resize', loadPersona);

    return (
        <div ref={person} if={isVisible !== undefined ? isVisible : true} class="persona" onclick={onClick}>

            <div ref={skin} class="skin">
                <div ref={photo} class="photo" />
                <div ref={nose} class="nose" />
            </div>

            <div class="face">
                <div ref={leftEye} class="eye left">
                    <div ref={leftEyeBrow} class="eyeBrow" />
                    <div class="eyeBall">
                        <div ref={leftIris} class="iris" />
                    </div>
                </div>

                <div ref={rightEye} class="eye right">
                    <div ref={rightEyeBrow} class="eyeBrow" />
                    <div class="eyeBall">
                        <div ref={rightIris} class="iris" />
                    </div>
                </div>

                <div ref={mouth} class="mouth closed">
                    <div class="gums upper" />
                    <div class="teeth upper" />
                    <div class="gums lower" />
                    <div class="teeth lower" />
                </div>
            </div>
        </div>
    );
}

export function getPersonaProperties(settings: PersonaSettings, small: boolean = false) {
    const properties: { [property: string]: string } = {};

    if (settings.skinHue) {
        properties['--skin-hue'] = `${settings.skinHue}deg`;
    }

    if (settings.skinBrightness) {
        properties['--skin-brightness'] = `${settings.skinBrightness}%`;
    }

    if (settings.skinGrayScale) {
        properties['--skin-grayScale'] = `${settings.skinGrayScale}%`;
    }

    if (settings.eyeColor) {
        properties['--iris-color'] = settings.eyeColor;
    }

    if (settings.eyeSpacing) {
        properties['--eye-spacing'] = settings.eyeSpacing.toString();
    }

    if (settings.eyeWidth) {
        if (small) {
            console.log('small eye width', settings.eyeWidth);
            properties['--eye-width'] = `${settings.eyeWidth / 2.5}px`;
        } else {
            properties['--eye-width'] = `${settings.eyeWidth}px`;
        }
    }

    if (settings.eyeBrowColor) {
        properties['--eyeBrow-color'] = settings.eyeBrowColor;
    }

    if (settings.eyeBrowSize) {
        if (settings.eyeBrowSize < .5) {
            properties['--eyeBrow-scale'] = "0";
        } else {
            properties['--eyeBrow-scale'] = settings.eyeBrowSize.toString();
        }
    }

    if (settings.eyeLidColor) {
        properties['--eyeLid-color'] = settings.eyeLidColor;
    }

    if (settings.eyeOutlineColor) {
        properties['--eye-outline-color'] = settings.eyeOutlineColor;
    }

    if (settings.mouthSize) {
        properties['--mouth-size'] = settings.mouthSize.toString();
    }

    if (settings.mouthWidth) {
        if (small) {
            properties['--mouth-width'] = `${settings.mouthWidth / 2}px`;
        } else {
            properties['--mouth-width'] = `${settings.mouthWidth}px`;
        }
    }

    if (settings.mouthHeight) {
        if (small) {
            properties['--mouth-height'] = `${settings.mouthHeight / 2}px`;
        } else {
            properties['--mouth-height'] = `${settings.mouthHeight}px`;
        }
    }

    if (settings.noseSize) {
        properties['--nose-size'] = settings.noseSize.toString();
    }

    if (settings.noseWidth) {
        if (small) {
            properties['--nose-width'] = `${settings.noseWidth / 2}px`;
        } else {
            properties['--nose-width'] = `${settings.noseWidth}px`;
        }
    }

    if (settings.noseHeight) {
        if (small) {
            properties['--nose-height'] = `${settings.noseHeight / 2}px`;
        } else {
            properties['--nose-height'] = `${settings.noseHeight}px`;
        }
    }

    if (settings.lipColor) {
        properties['--lip-color'] = settings.lipColor;
    }

    if (settings.lipSize) {
        properties['--lip-size'] = `${settings.lipSize}px`;
    }

    return properties;
}