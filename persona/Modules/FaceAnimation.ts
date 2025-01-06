class FaceComponent {

    static EntityId = 'face';

    constructor(public element: HTMLElement, public type: 'eye' | 'eyeBrow' | 'iris' | 'mouth') { }
}

export class FaceAnimation extends ECS {

    blinkSystem: BlinkSystem;
    eyeMovementSystem: EyeMovementSystem;
    eyeBrowSystem: EyeBrowSystem;
    mouthSystem: MouthSystem;

    constructor(leftEye: HTMLElement, leftEyeBrow: HTMLElement, leftIris: HTMLElement, rightEye: HTMLElement, rightEyeBrow: HTMLElement, rightIris: HTMLElement, mouth: HTMLElement, small?: boolean) {
        super();

        this.createEntity(FaceComponent.EntityId,
            new FaceComponent(leftEye, 'eye'),
            new FaceComponent(rightEye, 'eye'),
            new FaceComponent(leftEyeBrow, 'eyeBrow'),
            new FaceComponent(rightEyeBrow, 'eyeBrow'),
            new FaceComponent(leftIris, 'iris'),
            new FaceComponent(rightIris, 'iris'),
            new FaceComponent(mouth, 'mouth')
        );

        this.blinkSystem = new BlinkSystem();
        this.createSystem('BlinkSystem', (entity) => this.blinkSystem.update(entity));

        this.eyeMovementSystem = new EyeMovementSystem(!!small);
        this.createSystem('EyeMovementSystem', (entity) => this.eyeMovementSystem.update(entity));

        this.eyeBrowSystem = new EyeBrowSystem();
        this.createSystem('EyeBrowSystem', (entity) => this.eyeBrowSystem.update(entity));

        this.mouthSystem = new MouthSystem(this);
        this.createSystem('MouthSystem', (entity) => this.mouthSystem.update(entity));
    }
}

export class BlinkSystem implements System {
    id = 'BlinkSystem';
    private lastBlinkTime = 0;
    private blinkInterval = 5000; // 5 seconds between blinks
    private blinkDuration = 150; // 150ms blink duration

    update(entity: Entity) {
        const currentTime = performance.now();
        if (currentTime - this.lastBlinkTime > this.blinkInterval) {
            this.lastBlinkTime = currentTime;
            this.blink(entity);
        }
    }

    private blink(entity: Entity) {
        const eyeComponents = entity.components.filter(c => c.type === 'eye');
        eyeComponents.forEach(component => {
            component.element.classList.add('blinking');
            setTimeout(() => {
                component.element.classList.remove('blinking');
            }, this.blinkDuration);
        });
    }
}

export class EyeMovementSystem implements System {
    id = 'EyeMovementSystem';
    private mouse = { x: 0, y: 0 };
    private targetX = 0;
    private targetY = 0;
    private currentX = 0;
    private currentY = 0;
    public isSmall: boolean;
    private lastMouseMoveTime = 0;
    private isRandomLooking = false;
    private randomLookDuration = 60; // Duration of random look in frames (2 seconds at 30 FPS)
    private randomLookPauseDuration = 90; // Pause between random looks in frames (3 seconds at 30 FPS)
    private randomLookTimer = 0;
    private randomLookState = 'paused'; // 'looking', 'paused', or 'returning'

    constructor(isSmall: boolean) {
        this.isSmall = isSmall;
        this.addMouseListeners();
    }

    private addMouseListeners() {
        document.addEventListener('mousemove', (e) => {
            this.mouse = { x: e.clientX, y: e.clientY };
            this.lastMouseMoveTime = performance.now();
            this.isRandomLooking = false;
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this.mouse = { x: touch.clientX, y: touch.clientY };
                this.lastMouseMoveTime = performance.now();
                this.isRandomLooking = false;
            }
        });
    }

    private updateRandomLook() {
        const maxRadius = this.isSmall ? 3 : 6;
        const maxVerticalOffset = this.isSmall ? 1.5 : 3;

        if (this.randomLookState === 'paused') {
            if (this.randomLookTimer >= this.randomLookPauseDuration) {
                // Start a new random look
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * maxRadius;
                this.targetX = distance * Math.cos(angle);
                this.targetY = Math.min(Math.max(distance * Math.sin(angle), -maxVerticalOffset), maxVerticalOffset);
                this.randomLookState = 'looking';
                this.randomLookTimer = 0;
            }
        } else if (this.randomLookState === 'looking') {
            if (this.randomLookTimer >= this.randomLookDuration) {
                // Return to center
                this.targetX = 0;
                this.targetY = 0;
                this.randomLookState = 'returning';
                this.randomLookTimer = 0;
            }
        } else if (this.randomLookState === 'returning') {
            if (Math.abs(this.currentX) < 0.1 && Math.abs(this.currentY) < 0.1) {
                // Close enough to center, pause
                this.randomLookState = 'paused';
                this.randomLookTimer = 0;
            }
        }

        this.randomLookTimer++;
    }

    update(entity: Entity) {
        const currentTime = performance.now();
        if (currentTime - this.lastMouseMoveTime > 2000) {
            this.isRandomLooking = true;
        }

        if (this.isRandomLooking) {
            this.updateRandomLook();
        } else {
            const rect = entity.components.find(c => c.type === 'iris')?.element.getBoundingClientRect();
            if (rect) {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const dx = this.mouse.x - centerX;
                const dy = this.mouse.y - centerY;
                const angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxRadius = this.isSmall ? 3 : 6;
                const targetDistance = Math.min(distance, maxRadius);
                this.targetX = targetDistance * Math.cos(angle);
                this.targetY = targetDistance * Math.sin(angle);

                // Limit vertical movement
                const maxVerticalOffset = this.isSmall ? 1.5 : 3;
                this.targetY = Math.max(Math.min(this.targetY, maxVerticalOffset), -maxVerticalOffset);
            }
        }

        // Smooth eye movement
        const smoothingFactor = 0.3;
        this.currentX += (this.targetX - this.currentX) * smoothingFactor;
        this.currentY += (this.targetY - this.currentY) * smoothingFactor;
        //move slightly down to account for eyelid
        this.currentY += 1.2;

        const irisComponents = entity.components.filter(c => c.type === 'iris');
        irisComponents.forEach(component => {
            component.element.style.setProperty('--iris-offset-x', `${this.currentX}px`);
            component.element.style.setProperty('--iris-offset-y', `${this.currentY}px`);
        });
    }
}

export class EyeBrowSystem implements System {
    id = 'EyeBrowSystem';
    private lastChangeTime = 0;
    private changeInterval = 3000; // 3 seconds between changes
    private currentGesture = 0;

    update(entity: Entity) {
        const currentTime = performance.now();
        if (currentTime - this.lastChangeTime > this.changeInterval) {
            this.lastChangeTime = currentTime;
            this.changeEyeBrows(entity);
        }
    }

    private changeEyeBrows(entity: Entity) {
        const eyeBrowComponents = entity.components.filter(c => c.type === 'eyeBrow');
        let targetGesture: number;

        do {
            targetGesture = Math.floor(Math.random() * 7);
        } while (targetGesture === this.currentGesture);

        this.currentGesture = targetGesture;

        const [leftRotation, rightRotation, leftTranslation, rightTranslation] = this.getEyeBrowPositions(targetGesture);

        eyeBrowComponents.forEach(component => {
            const isLeft = component.element.classList.contains('left');
            const rotation = isLeft ? leftRotation : rightRotation;
            const translation = isLeft ? leftTranslation : rightTranslation;

            component.element.style.transition = 'transform 0.5s ease-in-out';
            component.element.style.transform = `rotate(${rotation}deg) translateY(${translation}px)`;
        });
    }

    private getEyeBrowPositions(gesture: number): [number, number, number, number] {
        switch (gesture) {
            case 0: return [0, 0, 0, 0]; // neutral
            case 1: return [-10, -10, -3, -3]; // raised
            case 2: return [5, 5, 0, 0]; // furrowed
            case 3: return [0, 0, -5, -5]; // surprised
            case 4: return [0, 5, 0, -2]; // thinking
            case 5: return [-5, -5, 0, 0]; // happy
            case 6: return [-5, 5, 0, 0]; // confused
            default: return [0, 0, 0, 0];
        }
    }
}

class MouthShapeComponent {
    constructor(public shape: string) { }
}

class MouthExpressionComponent {
    constructor(public expression: string) { }
}

export class MouthSystem implements System {

    id = 'MouthSystem';

    private animationTimeout: any;

    constructor(private ecs: ECS) { }

    update(entity: Entity): void {
        const mouthShape = entity.get(MouthShapeComponent);
        const mouthExpression = entity.get(MouthExpressionComponent);

        if (mouthShape) {
            const mouth = entity.components.find(c => c.type === 'mouth')?.element;
            if (mouth && !mouth.classList.contains(mouthShape.shape)) {
                mouth.className = `mouth ${mouthShape.shape}`;
            } else {
                mouth.className = 'mouth closed';
            }
            entity.remove(mouthShape);
        }

        if (mouthExpression) {
            // Apply mouth expression logic here
            switch (mouthExpression.expression) {
                case 'smile':
                    // Apply smiling mouth expression
                    break;
                case 'puzzled':
                    // Apply puzzled mouth expression
                    break;
                // Add more cases for different expressions
                default:
                    break;
            }
        }
    }

    startSpeaking(text: string) {
        if (!text) return;

        console.log('MouthSystem.startSpeaking', text);

        const inputLetters = text.split('');
        let counter = 0;

        const updateMouth = () => {
            if (this.animationTimeout) clearTimeout(this.animationTimeout);
            const entity = this.ecs.findEntity(FaceComponent.EntityId)!;
            if (counter < inputLetters.length) {
                const letter = inputLetters[counter].toLowerCase();
                const nextLetter = inputLetters[counter + 1]?.toLowerCase();
                entity.add(new MouthShapeComponent(this.getMouthShape(letter, nextLetter)));
                counter++;

                this.animationTimeout = setTimeout(updateMouth,
                    letter === ' ' ? 100
                        : letter === '.' ? 200
                            : letter === '!' ? 200
                                : letter === '?' ? 200
                                    : letter === ',' ? 100
                                        : 50);
            } else {
                console.log('MouthSystem.doneSpeaking');
                entity.add(new MouthShapeComponent('closed'));
            }
        };

        updateMouth();
    }

    stopSpeaking() {
        console.log('MouthSystem.stopSpeaking');
        clearTimeout(this.animationTimeout);
        const entity = this.ecs.findEntity(FaceComponent.EntityId)!;
        const mouthShape = entity.get(MouthShapeComponent)!;
        if (mouthShape?.shape !== 'closed') {
            entity.add(new MouthShapeComponent('closed'));
        }
    }

    setExpression(expression: 'smile' | 'puzzled' | 'default') {
        const entity = this.ecs.findEntity(FaceComponent.EntityId)!;
        const currentExpression = entity.get(MouthExpressionComponent);
        if (currentExpression) {
            entity.remove(currentExpression);
        }
        entity.add(new MouthExpressionComponent(expression));
    }

    private getMouthShape(letter: string, nextLetter: string): string {
        return mouthMap[letter + nextLetter] || mouthMap[letter] || 'default';
    }
}

const cdgtnskxyz = 'cdgtnskxyz';
const aei = 'aei';
const bmp = 'bmp';
const jch = 'jch';
const qw = 'qw';
const fv = 'fv';
const mouthMap: { [key: string]: string } = {
    a: aei,
    e: aei,
    i: aei,
    o: 'o',
    u: 'u',
    b: bmp,
    m: bmp,
    p: bmp,
    f: fv,
    v: fv,
    c: cdgtnskxyz,
    d: cdgtnskxyz,
    g: cdgtnskxyz,
    t: cdgtnskxyz,
    n: cdgtnskxyz,
    s: cdgtnskxyz,
    k: cdgtnskxyz,
    x: cdgtnskxyz,
    y: cdgtnskxyz,
    z: cdgtnskxyz,
    j: jch,
    ch: jch,
    h: jch,
    l: 'l',
    r: 'r',
    q: qw,
    w: qw,
    closed: 'closed'
};