interface PersonaSettings {
    name: string;
    description: string;
    welcome?: string;
    knowledge: string;
    image?: string;
    showOutline?: boolean;
    showHair?: boolean;
    showNose?: boolean;
    avatar: number;
    voice: string;
    eyeColor: string;
    eyeSpacing: number;
    eyeWidth: number;
    eyeBrowColor: string;
    eyeBrowSize: number;
    eyeLidColor: string;
    eyeOutlineColor: string;
    mouthSize: number;
    mouthWidth: number;
    mouthHeight: number;
    noseSize: number;
    noseWidth: number;
    noseHeight: number;
    lipColor: string;
    lipSize: number;
    skinHue: number;
    skinBrightness: number;
    skinGrayScale: number;
    speechEnabled: boolean;
    speechDetectionEnabled: boolean;
    speechDetectionThreshold: number;
}
