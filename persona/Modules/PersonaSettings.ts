export function applyDefaultSettings(settings?: Partial<PersonaSettings>) {
  const appliedSettings = {} as any;
  appliedSettings.name = settings?.name || 'Assistant';
  appliedSettings.description = settings?.description || 'I am a helpful assistant.';
  appliedSettings.memories = settings?.memories || [];
  appliedSettings.avatar = settings?.avatar || 0;
  appliedSettings.image = settings?.image;
  appliedSettings.voice = settings?.voice || 'shimmer';
  appliedSettings.showHair = (settings && settings.showHair === false ? false : true);
  appliedSettings.showNose = (settings && settings.showNose === false ? false : true);
  appliedSettings.showOutline = (settings && settings.showOutline === true);
  appliedSettings.welcome = settings?.welcome || 'Hello, how can I help you?';
  appliedSettings.eyeColor = settings?.eyeColor || '#0077b6';
  appliedSettings.eyeSpacing = settings?.eyeSpacing || 1;
  appliedSettings.eyeWidth = settings?.eyeWidth || 58.3;
  appliedSettings.eyeBrowColor = settings?.eyeBrowColor || 'rgba(53, 17, 17, 0.616)';
  appliedSettings.eyeBrowSize = settings?.eyeBrowSize || 1;
  appliedSettings.eyeLidColor = settings?.eyeLidColor || '#EAA583';
  appliedSettings.eyeOutlineColor = settings?.eyeOutlineColor || 'rgba(0, 0, 0, 0.616)';
  appliedSettings.mouthSize = settings?.mouthSize || 1;
  appliedSettings.mouthWidth = settings?.mouthWidth || 80;
  appliedSettings.mouthHeight = settings?.mouthHeight || 58;
  appliedSettings.noseSize = settings?.noseSize || 1;
  appliedSettings.noseWidth = settings?.noseWidth || 64;
  appliedSettings.noseHeight = settings?.noseHeight || 82;
  appliedSettings.lipColor = settings?.lipColor || '#d35b53e0';
  appliedSettings.lipSize = settings?.lipSize || 8;
  appliedSettings.skinHue = settings?.skinHue || 0;
  appliedSettings.skinBrightness = settings?.skinBrightness || 100;
  appliedSettings.skinGrayScale = settings?.skinGrayScale || 0;
  appliedSettings.knowledge = settings?.knowledge || '';
  appliedSettings.speechEnabled = (settings && settings.speechEnabled === false ? false : true);
  appliedSettings.speechDetectionEnabled = (settings && settings.speechDetectionEnabled === false ? false : !isMobileDevice());
  appliedSettings.speechDetectionThreshold = (settings && settings.speechDetectionThreshold && settings.speechDetectionThreshold > 0 ? settings.speechDetectionThreshold : 100)
  return appliedSettings;

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
}