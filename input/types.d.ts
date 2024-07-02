interface PersonaProps extends JSX.Component<HTMLElement> {
    settings: AssistantSettings;
    onClick?: () => void;
    nose?: JSX.IReference<HTMLElement>;
    onPersonaChanged?: IEvent<void>;
    onStartSpeaking: IEvent<string>;
    onStopSpeaking: IEvent<void>;
}
function Persona(props: PersonaProps): any;
function getPersonaProperties(settings: AssistantSettings, small?: boolean): {
    [property: string]: string;
};
{};

interface AssistantSettings {
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
    connection: ConnectorType;
    theme: 'dark' | undefined;
    selectedInputType: AssistantActivityType;
    speechEnabled: boolean;
    speechDetectionEnabled: boolean;
    speechDetectionThreshold: number;
}
interface IAssistant {
    id: string;
    name: string;
    description: string;
    knowledge: string;
    instructions: string;
    data?: IAssistantFile[];
    images?: IAssistantFile[];
    context?: string[];
    model?: string;
    settings?: AssistantSettings;
    prompt?: string;
}
interface IAssistantFile {
    name: string;
    type: string;
    location: string;
    locationType: 'cache' | 'store';
}
type AssistantActivityType = 'screen' | 'question' | 'file' | 'meeting' | 'problem' | 'document' | 'entertainment' | 'learning' | 'search' | 'image' | 'diagram' | 'chart' | 'photo' | 'audio';
interface IAssistantActivity {
    id: string;
    name: string;
    description: string;
    type: AssistantActivityType;
    settings: AssistantSettings;
}

class AudioPlayer {
    private fileStore;
    private onStop;
    private queue;
    private currentAudio;
    constructor(fileStore: IFileStore, onStop: () => void);
    play(file: string | Blob): Promise<void>;
    private playNext;
    stop(): void;
}

class BrowserSpeechOutputManager implements ISpeechOutputManager {
    #private;
    defaultVoice?: string | undefined;
    isSpeaking: boolean;
    isEnabled: boolean;
    onStartSpeaking: IEvent<string>;
    onStopSpeaking: IEvent<void>;
    constructor(defaultVoice?: string | undefined);
    init(): Promise<void>;
    voices(): Promise<string[]>;
    startSpeaking(text: string, voice?: string | undefined): void;
    stopSpeaking(): void;
}

class FaceComponent {
    element: HTMLElement;
    type: 'eye' | 'eyeBrow' | 'iris' | 'mouth';
    static EntityId: string;
    constructor(element: HTMLElement, type: 'eye' | 'eyeBrow' | 'iris' | 'mouth');
}
class FaceAnimation extends ECS {
    blinkSystem: BlinkSystem;
    eyeMovementSystem: EyeMovementSystem;
    eyeBrowSystem: EyeBrowSystem;
    mouthSystem: MouthSystem;
    constructor(leftEye: HTMLElement, leftEyeBrow: HTMLElement, leftIris: HTMLElement, rightEye: HTMLElement, rightEyeBrow: HTMLElement, rightIris: HTMLElement, mouth: HTMLElement, small?: boolean);
}
class BlinkSystem implements System {
    id: string;
    private blinkTimer;
    update(entity: Entity): void;
}
class EyeMovementSystem implements System {
    id: string;
    private mouseTimer;
    private mouse;
    private mouseMoving;
    private lookTimer;
    private randomLookTimer;
    private targetX;
    private targetY;
    small: boolean;
    constructor(small: boolean);
    private handleMouseMove;
    private ease;
    update(entity: Entity): void;
}
class EyeBrowSystem implements System {
    id: string;
    private browTimer;
    private previousGesture;
    update(entity: Entity): void;
}
class MouthShapeComponent {
    shape: string;
    constructor(shape: string);
}
class MouthExpressionComponent {
    expression: string;
    constructor(expression: string);
}
class MouthSystem implements System {
    private ecs;
    id: string;
    private animationTimeout;
    constructor(ecs: ECS);
    update(entity: Entity): void;
    startSpeaking(text: string): void;
    stopSpeaking(): void;
    setExpression(expression: 'smile' | 'puzzled' | 'default'): void;
    private getMouthShape;
}

class SpeechOutputManager implements ISpeechOutputManager {
    defaultVoice: string;
    cache?: IFileStore | undefined;
    isSpeaking: boolean;
    isEnabled: boolean;
    onStartSpeaking: IEvent<string>;
    onStopSpeaking: IEvent<void>;
    private audioPlayer;
    private wordsAndPhrases;
    private cancelCurrentSpeech?;
    constructor(defaultVoice?: string, cache?: IFileStore | undefined);
    init(): Promise<void>;
    protected downloadAudio(text: string, voice: string, speed?: number): Promise<Blob>;
    voices(): Promise<string[]>;
    startSpeaking(input: string, voice?: string | undefined): Promise<void>;
    stopSpeaking(): void;
    private playAudio;
    private getCacheKey;
    getWordsAndPhrases(): Promise<[string, string][]>;
    private getEnhancedSentence;
}
function getRandomPhrase(): string;
function getRandomGreeting(): string;
function getRandomClosing(): string;

class AssistantViewModel implements IConversationResponseHandler {
    onAssistantWorking: IEvent<boolean>;
    onShowAssistant: IEvent<boolean>;
    onCustomizationToggle: IEvent<void>;
    onPersonaChanged: IEvent<void>;
    onFileSelected: IEvent<IConversationFile>;
    speechInput: ISpeechInputManager;
    speechOutput: ISpeechOutputManager;
    visionInput: IImageDescriptionService;
    textInput: TextCompletionService;
    private knowledgeUpdate;
    private storage;
    private webSearch;
    private context;
    private currentSpeechText;
    private onUpdatesReceived;
    readonly settings: AssistantSettings;
    constructor(settings?: Partial<AssistantSettings>, speechOutput?: ISpeechOutputManager);
    clearContext(): void;
    stopSpeaking(): void;
    onInputReceived(type: AssistantActivityType, input: any, conversation: IConversationContext, existingType?: AssistantActivityType): Promise<void>;
    applySettings(settings?: Partial<AssistantSettings>): void;
    static applyDefaults(settings?: Partial<AssistantSettings>): any;
    static getAssistantSettings(): Promise<any>;
    init(): Promise<void>;
    resetSettings: () => void;
    open: () => void;
    save: () => Promise<void>;
    ask(question: string, context?: string[], max_tokens?: number, history?: IConversationMessage[]): Promise<string>;
    speak(text: string): Promise<void>;
    update(history: IConversationMessage[], context?: string[], max_tokens?: number): Promise<void>;
    private getConversationMessages;
    private createAIWorkspace;
    private extractCodeFromMarkdown;
    private static isMobileDevice;
}

interface AssistantViewProps {
    ref?: JSX.IReference<Assistant>;
    onClick?: () => void;
    small?: boolean;
    medium?: boolean;
    open?: boolean;
    customize?: boolean;
    settings?: Partial<AssistantSettings>;
}
interface Assistant {
    model: AssistantViewModel;
    container: HTMLElement;
    element: HTMLElement;
}
function AssistantView(props?: AssistantViewProps): any;
{};

interface CustomizationViewProps extends JSX.Component<HTMLElement> {
    assistant: Assistant;
}
function CustomizationView(props: CustomizationViewProps): any;
{};

namespace $Images {
    export const AboutIcon: JSX.SvgImage;
    export const AddIcon: JSX.SvgImage;
    export const AgentIcon: JSX.SvgImage;
    export const AppIcon: JSX.SvgImage;
    export const AttendeeIcon: JSX.SvgImage;
    export const AudioIcon: JSX.SvgImage;
    export const BackIcon: JSX.SvgImage;
    export const BingIcon: JSX.SvgImage;
    export const CalendarIcon: JSX.SvgImage;
    export const CameraIcon: JSX.SvgImage;
    export const ChatIcon: JSX.SvgImage;
    export const CloudIcon: JSX.SvgImage;
    export const ColorIcon: JSX.SvgImage;
    export const CompassIcon: JSX.SvgImage;
    export const ComputerIcon: JSX.SvgImage;
    export const ConfigIcon: JSX.SvgImage;
    export const ConfirmIcon: JSX.SvgImage;
    export const ContactIcon: JSX.SvgImage;
    export const ConversationIcon: JSX.SvgImage;
    export const CopyIcon: JSX.SvgImage;
    export const CS: JSX.SvgImage;
    export const CSV: JSX.SvgImage;
    export const DeviceIcon: JSX.SvgImage;
    export const DislikeIcon: JSX.SvgImage;
    export const DocumentIcon: JSX.SvgImage;
    export const DOCX: JSX.SvgImage;
    export const DownloadIcon: JSX.SvgImage;
    export const EmailIcon: JSX.SvgImage;
    export const FeedbackIcon: JSX.SvgImage;
    export const FileIcon: JSX.SvgImage;
    export const FolderIcon: JSX.SvgImage;
    export const ImageIcon: JSX.SvgImage;
    export const IndexIcon: JSX.SvgImage;
    export const InputIcon: JSX.SvgImage;
    export const JS: JSX.SvgImage;
    export const JSON: JSX.SvgImage;
    export const LikeIcon: JSX.SvgImage;
    export const LinkIcon: JSX.SvgImage;
    export const ListenIcon: JSX.SvgImage;
    export const LocationIcon: JSX.SvgImage;
    export const MagicIcon: JSX.SvgImage;
    export const MapIcon: JSX.SvgImage;
    export const MarkdownIcon: JSX.SvgImage;
    export const MeetingIcon: JSX.SvgImage;
    export const MemoryIcon: JSX.SvgImage;
    export const MenuIcon: JSX.SvgImage;
    export const MicIcon: JSX.SvgImage;
    export const MuteIcon: JSX.SvgImage;
    export const NewsIcon: JSX.SvgImage;
    export const PDF: JSX.SvgImage;
    export const PrintIcon: JSX.SvgImage;
    export const PublishIcon: JSX.SvgImage;
    export const QuestionIcon: JSX.SvgImage;
    export const ReminderIcon: JSX.SvgImage;
    export const SaveIcon: JSX.SvgImage;
    export const ScreenIcon: JSX.SvgImage;
    export const SearchIcon: JSX.SvgImage;
    export const SendIcon: JSX.SvgImage;
    export const ShareIcon: JSX.SvgImage;
    export const SoundIcon: JSX.SvgImage;
    export const SQL: JSX.SvgImage;
    export const SwitchIcon: JSX.SvgImage;
    export const TaskIcon: JSX.SvgImage;
    export const TextIcon: JSX.SvgImage;
    export const ThemeIcon: JSX.SvgImage;
    export const TXT: JSX.SvgImage;
    export const UploadIcon: JSX.SvgImage;
    export const VectorIcon: JSX.SvgImage;
    export const VisionIcon: JSX.SvgImage;
    export const WeatherIcon: JSX.SvgImage;
    export const XLSX: JSX.SvgImage;
    export const XML: JSX.SvgImage;
    export const ZipIcon: JSX.SvgImage;
}
function createImage(name: string): HTMLImageElement;
interface CardProps {
    data: any;
    title?: string;
    properties?: string[];
}
function Card(props: CardProps): any;
{};

interface DocumentProps {
    title: string;
    content: any;
    downloadContent?: any;
    mode?: 'HTML' | 'Markdown' | 'DOCX';
    enablePrint: boolean;
    enableDownload: boolean;
    close?: () => void;
}
function DocumentPanel(props: DocumentProps): any;
{};

interface FormProps extends JSX.Component<HTMLElement> {
    data: any;
    title?: string;
}
function Form(props: FormProps, children: HTMLElement | HTMLElement[] | (() => HTMLElement[])): any;
{};

type GraphData = {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    data?: any;
};
interface GraphNode {
    id: string;
    label?: string;
    color?: string;
    shape?: 'rect' | 'circle';
    items?: GraphNode[];
    [key: string]: any;
}
interface GraphEdge {
    source: string;
    target: string;
    label?: string;
    [key: string]: any;
}
interface GraphProps extends JSX.Component<HTMLElement> {
    data: GraphData | JSX.IReference<GraphData>;
    onNodeClick?: (node: any) => void;
}
function Graph(props: GraphProps, children: HTMLElement | HTMLElement[] | (() => HTMLElement[])): any;
{};

interface IconButtonProps {
    icon: JSX.SvgImage;
    label?: string;
    title?: string;
    onClick?: () => void;
    value?: boolean;
    onToggle?: (value: boolean) => Partial<IconButtonProps>;
}
function IconButton(props: IconButtonProps): any;
{};

function ShowLightbox(title: any, element: any, onClose?: () => void | undefined): () => void;

interface ListProps extends JSX.Component<any> {
    items: IObservableList<any>;
}
type ListTemplate = (item: any, remove: any) => HTMLElement;
function List(props: ListProps, children: [ListTemplate]): any;
function ListEditor({ items, onAdd, onModify, onRemove }: {
    items: any[];
    onAdd: (item: any) => void;
    onModify: (item: any) => void;
    onRemove: (item: any) => void;
}, children: [ListTemplate]): any;
{};

function Loader({ ref }: {
    ref: any;
}): any;

interface MarkdownProps {
    text: string;
    allowExternalLinks?: boolean;
    sendMessage: (input: string) => void;
}
function Markdown({ text, allowExternalLinks, sendMessage }: MarkdownProps): HTMLDivElement;
function renderMarkdown(text: string, allowExternalLinks: boolean | undefined, sendMessage: (input: string) => void): string;
function removeMarkdown(markdown: string): string;
{};

interface MenuProps {
}
function Menu(props: MenuProps, children: any): any;
{};

interface TableProps {
    columns?: string[];
    data: IList<any>;
    onSelect?: (item: any) => void;
}
function Table(props: TableProps): any;
{};

interface TabsProps {
    selected?: string;
    tabs?: IObservableList<HTMLElement>;
    onSelect?: (tab: string) => void;
}
function Tabs(props: TabsProps, children: (HTMLElement | HTMLElement[]) | (() => HTMLElement[])): any;
{};

function ShowTooltip(text: string, element: HTMLElement, seconds?: number): void;

type ConnectorType = 'openai' | 'claude';
interface ITextCompletionService {
    name: string;
    model?: string;
    systemPrompt?: string;
    getTextCompletion(text: string, messages: IConversationMessage[], context: string[], max_tokens?: number | undefined): Promise<string>;
}
interface VectorEmbedding {
    embedding: number[];
    text: string;
}
interface ITextEmbeddingService {
    getEmbeddings(input: string[]): Promise<VectorEmbedding[]>;
}
interface IImageDescriptionService {
    getImageDescription(image_url: string, input: string, messages: IConversationMessage[], context: string[], max_tokens: number): Promise<string>;
}
interface ISpeechGenerationService {
    getSpeechGeneration(input: string, voice: string, speed: number): Promise<Blob>;
}
interface ISpeechTranscriptionService {
    getSpeechTranscription(audioBlob: Blob, previousTranscript: string, temperature?: number): Promise<{
        transcript: string;
    }>;
}
interface ISearchResult {
    title: string;
    type?: string;
    summary?: string;
    url?: string;
    relevance?: number;
    image?: {
        url: string;
        width?: number;
        height?: number;
    };
    thumbnail?: {
        url: string;
        width?: number;
        height?: number;
    };
}
interface ISearchProvider {
    search(query: string, max_count: number): Promise<ISearchResult[]>;
}

class ImageDescriptionService implements IImageDescriptionService {
    getImageDescription(image_url: string, text: string, messages: IConversationMessage[], context: string[], max_tokens: number): Promise<string>;
}

class SearchService implements ISearchProvider {
    search(query: string, max_count: number): Promise<ISearchResult[]>;
}

class TextCompletionService implements ITextCompletionService {
    private connector;
    promptExtension: string;
    private initial_tokens;
    static Connection: ConnectorType;
    get name(): "audio" | "data" | "search" | "document" | "image" | "chat" | "knowledge" | "tools" | "task";
    constructor(connector: 'chat' | 'knowledge' | 'tools' | 'data' | 'image' | 'audio' | 'search' | 'task' | 'document', promptExtension: string, initial_tokens?: number);
    getTextCompletion(text: string, messages: IConversationMessage[], context: string[], max_tokens?: number | undefined): Promise<string>;
}

class TextEmbeddingService implements ITextEmbeddingService {
    getEmbeddings(input: string[]): Promise<any>;
}

interface IConversationMessage {
    content: string;
    role: string;
    name?: string;
    file?: string;
    files?: IConversationFile[];
    imageUrl?: string;
}
interface IConversationFile {
    name: string;
    type: string;
    search(text: string): Promise<number>;
    text(): Promise<string>;
    json(): Promise<any>;
}
interface IConversationContext {
    Messages: IObservableList<IConversationMessage>;
    Files: IObservableList<IConversationFile>;
    addFiles(files: File[], addMessage?: boolean): Promise<IConversationFile[]>;
    clear(): Promise<void>;
}
interface ConversationSettings {
    enableSpeechInput: boolean;
    enableFileInput: boolean;
    enableMultilineInput: boolean;
    enableMessageRemove: boolean;
    enableMessageSend: boolean;
    enableMessageCopy: boolean;
    enableMessageSpeak: boolean;
    onSelectFile?: (file: IConversationFile) => void;
}
interface IConversationResponseHandler {
    onInputReceived(type: any, input: any, conversation: IConversationContext): Promise<void> | void;
}

function isElementReference(arg: any): arg is JSX.IReference<HTMLElement>;
function isReference<T>(arg: any): arg is JSX.IReference<T>;
function $element(component: any, props?: {}, ...children: any): HTMLElement | undefined;
function resolveChildren(children: any, ...args: any[]): any;
function $children(element: any, children: any): void;
function $reference<T = HTMLElement>(): JSX.IReference<T>;
function $event<T>(context?: any): IEvent<T>;

type IList<T> = (T[] | Iterable<T> | AsyncIterable<T> | (() => Promise<T[]>));
type ListEventHandler<T> = (item: T, arg?: any) => void;
type EventHandler<T> = (arg: T, context?: any) => void | Promise<void>;
interface IEvent<T> {
    add(handler: EventHandler<T>): void;
    notify(arg: T, context?: any): void | Promise<void>;
}
interface IObservableList<T> {
    onItemAdded(callback: ListEventHandler<T>): void;
    onItemRemoved(callback: ListEventHandler<T>): void;
    add(item: T, arg?: any): Promise<void>;
    remove(item: T): Promise<void>;
    clear(): Promise<void>;
    [Symbol.iterator](): IterableIterator<T>;
    count: number;
    array: T[];
}
interface IFileStore extends AsyncIterable<string> {
    clear(): Promise<void>;
    has(name: string): Promise<boolean>;
    storeFile(name: string, file: Blob): Promise<void>;
    storeObject(name: string, obj: any): Promise<void>;
    fetch(name: string): Promise<Response | undefined>;
    removeFile(name: string): Promise<void>;
}
interface IMarkdownOutput {
    removeMarkdown(text: string): string;
    renderMarkdown(text: string): HTMLElement;
}

namespace JSX {
    type EventHandler<T extends Event> = (event: T) => void;
    type SvgImage = () => HTMLImageElement;
    interface IReference<T> {
        setReference(reference: T): any;
        onLoad: IEvent<T>;
        readonly value?: T;
    }
    interface Reference<T = HTMLElement> {
        ref?: IReference<T>;
    }
    interface Component<T> extends Reference<T> {
        'class'?: string;
        'if'?: boolean;
        'when'?: Promise<any> | IReference<any>;
        'id'?: string;
    }
    interface BasicElement extends Component<HTMLElement> {
        'title'?: string | undefined;
        'style'?: string | undefined;
        'draggable'?: boolean;
        'ondragstart'?: EventHandler<DragEvent>;
        'ondragenter'?: EventHandler<DragEvent>;
        'ondragleave'?: EventHandler<DragEvent>;
        'ondragover'?: EventHandler<DragEvent>;
        'ondragend'?: EventHandler<DragEvent>;
        'ondrop'?: EventHandler<DragEvent>;
        'onclick'?: EventHandler<MouseEvent>;
    }
    interface ValueElement extends BasicElement {
        autocomplete?: "off";
        type?: 'text' | 'password' | 'file' | 'radio' | 'checkbox' | 'date' | 'time' | 'number' | 'range' | 'color' | 'submit' | 'reset';
        value?: string;
        name?: string;
        checked?: 'checked' | undefined;
        multiple?: boolean;
        min?: number;
        max?: number;
        step?: number;
        maxlength?: number;
        placeholder?: string | undefined;
        oninput?: EventHandler<InputEvent>;
        onchange?: EventHandler<InputEvent>;
        onkeypress?: EventHandler<KeyboardEvent>;
        onpaste?: EventHandler<KeyboardEvent>;
    }
    interface OptionElement extends ValueElement {
        disabled?: 'disabled' | undefined;
        selected?: 'selected' | undefined;
    }
    interface ImageElement extends BasicElement {
        alt: string;
        src: string;
    }
    interface ActionElement extends BasicElement {
        href?: string;
    }
    interface FormElement extends BasicElement {
        method?: string;
        action?: string;
    }
    interface CanvasElement extends BasicElement {
        graph?: any;
        width: number;
        height: number;
    }
    interface IntrinsicElements {
        p: BasicElement;
        em: BasicElement;
        strong: BasicElement;
        code: BasicElement;
        pre: BasicElement;
        div: BasicElement;
        dl: BasicElement;
        dt: BasicElement;
        dd: BasicElement;
        main: BasicElement;
        header: BasicElement;
        footer: BasicElement;
        article: BasicElement;
        section: BasicElement;
        a: ActionElement & Reference<HTMLAnchorElement>;
        button: ActionElement & Reference<HTMLButtonElement>;
        form: FormElement;
        dialog: BasicElement & {
            open?: boolean;
        };
        fieldset: BasicElement;
        legend: BasicElement;
        details: BasicElement & {
            open?: boolean;
        };
        summary: BasicElement;
        input: ValueElement & Reference<HTMLInputElement>;
        textarea: ValueElement & {
            rows?: number;
        } & Reference<HTMLTextAreaElement>;
        select: ValueElement & Reference<HTMLSelectElement>;
        option: OptionElement;
        label: BasicElement & {
            'for'?: string;
        };
        span: BasicElement;
        audio: Reference<HTMLAudioElement> & {
            src: string;
            autoplay?: boolean;
            controls?: boolean;
        };
        img: ImageElement & Reference<HTMLImageElement>;
        h1: BasicElement;
        h2: BasicElement;
        h3: BasicElement;
        h4: BasicElement;
        h5: BasicElement;
        h6: BasicElement;
        table: BasicElement;
        thead: BasicElement;
        tbody: BasicElement;
        tfoot: BasicElement;
        tr: BasicElement;
        td: BasicElement & {
            colspan?: number;
        };
        th: BasicElement;
        ul: BasicElement;
        ol: BasicElement;
        li: BasicElement;
        i: BasicElement;
        canvas: CanvasElement & Reference<HTMLCanvasElement>;
        nav: BasicElement;
    }
}

type Entity = {
    id: string;
    components: any[];
    add: (component: any) => Entity;
    remove: (component: any) => Entity;
    removeComponents: <T = any>(componentType: new (...args: any[]) => T) => Entity;
    get: <T = any>(componentType: new (...args: any[]) => T) => T | undefined;
};
interface System {
    id: string;
    update: (entity: Entity) => void;
}
class ECS {
    entities: Entity[];
    systems: System[];
    findSystem<T = System>(id: string): T;
    findEntity(id: string): Entity | undefined;
    findComponent<T = any>(componentTypeOrName: new (...args: any[]) => T | string): T | undefined;
    findComponents<T = any>(componentType: new (...args: any[]) => T): T[];
    removeEntity(entity: Entity): void;
    removeComponents(components: any[]): void;
    createEntity(id: string, ...components: any[]): Entity;
    createSystem(id: string, update: (entity: Entity) => void, query?: (component: any) => boolean): System;
    addSystem(system: System): void;
    update(): void;
    runDelayed(time?: DOMHighResTimeStamp): void;
    private intervalId;
    start(interval?: number): void;
    stop(): void;
    saveState(name: string, fileStore: IFileStore): Promise<void>;
    loadState(name: string, fileStore: IFileStore, componentMap: {
        [key: string]: new (...args: any[]) => any;
    }): Promise<void>;
    createGraph(): {
        nodes: {
            id: string;
            label: string;
        }[];
        edges: {
            source: string;
            target: any;
        }[];
    };
}

class EventManager<T> {
    private handlers;
    constructor();
    add(handler: EventHandler<T>): void;
    notify(arg: T, context?: any): Promise<void>;
}

class FileStore implements IFileStore {
    private folder;
    constructor(folder: string);
    [Symbol.asyncIterator](): AsyncGenerator<string, void, unknown>;
    has(name: string): Promise<boolean>;
    clear(): Promise<void>;
    fetch(name: string): Promise<Response | undefined>;
    storeObject(name: string, obj: any): Promise<void>;
    storeFile(name: string, file: Blob): Promise<void>;
    removeFile(name: string): Promise<void>;
    static id(text: any, length?: number): Promise<string>;
}

class ObservableList<T> implements IObservableList<T> {
    items: IList<T>;
    array: any[];
    private added;
    private removed;
    constructor(items: IList<T>);
    get count(): number;
    [Symbol.iterator](): Generator<any, void, unknown>;
    onItemAdded(added: ListEventHandler<T>): void;
    onItemRemoved(removed: ListEventHandler<T>): void;
    add(item: any, arg?: any): Promise<void>;
    remove(item: any): Promise<void>;
    clear(): Promise<void>;
    private load;
}

interface ConversationEnvironment {
    speechInput: ISpeechInputManager;
    speechOutput: ISpeechOutputManager;
    fileProcessor: IFileProcessor;
    fileStore: IFileStore;
    speechCache: IFileStore;
    messages: IConversationMessage[];
    messageStore: IFileStore;
    messageStoreLocation: string;
}

function StructuredWebDeveloperAgent(getTextCompletion: (systemPrompt: string, ...text: string[]) => Promise<string>): (objective: string) => Promise<string>;
function SuperWebDeveloperAgent(getTextCompletion: (systemPrompt: string, ...text: string[]) => Promise<string>): (objective: string) => Promise<string>;
function SimpleWebDeveloperFixer(getTextCompletion: (systemPrompt: string, ...text: string[]) => Promise<string>): (objective: string, code: string, feedback?: string) => Promise<string>;
function SimpleWebDeveloperImprover(getTextCompletion: (systemPrompt: string, ...text: string[]) => Promise<string>): (objective: string, code: string, feedback?: string) => Promise<string>;
function guide(review: (objective: string, actions: string[], currentOutput?: string) => Promise<string>, act: (objective: string, action: string) => Promise<string>, output: (objective: string, actions: string[], outputs: string[]) => Promise<string>): (objective: string) => Promise<void>;
function agent(plan: (objective: string) => Promise<string>, work: (objective: string, task: string) => Promise<string>, output: (objective: string, tasks: string[], outputs: string[]) => Promise<string>, language?: string): (objective: string) => Promise<string>;
function getArrayItems(content: any): any[];
function extractCodeFromMarkdown(markdownText: any, onCodeBlockFound: any): void;
interface IFunctionCallInterface {
    name: string;
    description?: string;
    parameters?: string[];
}
class OpenAIFunctionCallService {
    private baseUrl;
    private headers;
    private systemPrompt;
    constructor(baseUrl: string, headers: {}, systemPrompt: string);
    getFunctionCall(functions: IFunctionCallInterface[], messages: IConversationMessage[], context: string[], max_tokens?: number): Promise<any>;
}

class ConnectorComponent extends AsyncComponent {
    readonly connection: string;
    readonly connector: string;
    readonly parameters: any;
    constructor(name: string, connection: string, connector: string, parameters?: any);
    getComponent(): Promise<Component>;
}
class AdapterComponent extends AsyncComponent {
    readonly type: string;
    readonly data: any;
    constructor(name: string, type: string, data: any);
    getComponent(): Promise<Component>;
}
class TrainerComponent extends AsyncComponent {
    readonly knowledge: string;
    constructor(name: string, knowledge: string);
    getComponent(): Promise<Component>;
}

class ReviewerComponent extends ParallelComponent {
    readonly title: string;
    readonly content: string;
    readonly type: 'write' | 'code' | 'research';
    readonly mode: 'improve' | 'fix';
    constructor(name: string, title: string, content: string, type: 'write' | 'code' | 'research', mode?: 'improve' | 'fix');
    createComponents(world: WorldContext): Promise<Component[]>;
}
class SolverComponent extends ParallelComponent {
    readonly problem: string;
    constructor(name: string, problem: string);
    createComponents(world: WorldContext): Promise<Component[]>;
}
class CoordinatorComponent extends ParallelComponent {
    readonly project: string;
    readonly type: 'write' | 'code' | 'research';
    constructor(name: string, project: string, type?: 'write' | 'code' | 'research');
    createComponents(world: WorldContext): Promise<Component[]>;
}
class SolutionAssemblerComponent extends MergeComponent<SolutionOutputComponent> {
    readonly objective: string;
    readonly type: 'write' | 'code' | 'research';
    constructor(name: string, objective: string, type?: 'write' | 'code' | 'research');
    mergeComponents(components: SolutionOutputComponent[], world: WorldContext): Promise<Component>;
}
class SolutionAssemblerOutputComponent extends CompositeComponent {
    readonly objective: string;
    readonly content: string;
    readonly type: string;
    constructor(name: string, objective: string, content: string, type: string);
}

class SearchInputComponent extends ParallelComponent {
    readonly search: string;
    constructor(name: string, search: string);
    createComponents(): Promise<Component[]>;
}
class SearchOutputComponent extends CompositeComponent {
    readonly search: string;
    readonly title: string;
    readonly content: string;
    readonly link: string;
    readonly relevance: number;
    constructor(name: string, search: string, title: string, content: string, link: string, relevance: number);
}
class ConversationMessageComponent extends CompositeComponent {
    readonly content: string;
    readonly role: string;
    constructor(name: string, content: string, role: string);
}
class ConversationInputComponent extends ConversationMessageComponent {
    readonly spoken: boolean;
    constructor(name: string, text: string, spoken?: boolean);
}
class ConversationContextComponent extends ConversationMessageComponent {
    constructor(name: string, content: string);
}
class AssistantComponent extends MergeComponent<ConversationMessageComponent> {
    readonly objective: string;
    constructor(name: string, objective: string);
    mergeComponents(components: ConversationMessageComponent[], world: WorldContext): Promise<Component>;
}

class MemoryComponent extends AsyncComponent {
    readonly memory: string;
    constructor(name: string, memory: string);
    getComponent(): Promise<Component>;
}
class PreferenceComponent extends Component {
    readonly name: string;
    readonly preference: string;
    constructor(name: string, preference: string);
}
class StorageComponent extends AsyncComponent {
    readonly storage: string;
    constructor(name: string, storage: string);
    getComponent(world: WorldContext): Promise<Component>;
}

class TextInputComponent extends CompositeComponent {
    readonly text: string;
    constructor(name: string, text: string);
}
class FileInputComponent extends AsyncComponent {
    readonly file: Blob;
    constructor(name: string, file: Blob);
    getComponent(world: WorldContext): Promise<Component>;
}
class DataInputComponent extends AsyncComponent {
    readonly data: any;
    constructor(name: string, data: any);
    getComponent(world: WorldContext): Promise<Component>;
}
class AudioInputComponent extends AsyncComponent {
    readonly audio: Blob;
    constructor(name: string, audio: Blob);
    getComponent(world: WorldContext): Promise<Component>;
}
class ImageInputComponent extends AsyncComponent {
    readonly image: string;
    constructor(name: string, image: string);
    getComponent(world: WorldContext): Promise<Component>;
}
class UrlInputComponent extends AsyncComponent {
    readonly url: string;
    constructor(name: string, url: string);
    getComponent(world: WorldContext): Promise<Component>;
}
class ContextInputComponent extends Component {
    readonly name: string;
    readonly context: string;
    constructor(name: string, context: string);
}

class PlannerComponent extends ParallelComponent {
    readonly objective: string;
    readonly type: 'write' | 'code' | 'research';
    constructor(name: string, objective: string, type: 'write' | 'code' | 'research');
    createComponents(world: WorldContext): Promise<Component[]>;
}
class WorkerComponent extends AsyncComponent {
    readonly task: string;
    readonly type: 'write' | 'code' | 'research';
    constructor(name: string, task: string, type: 'write' | 'code' | 'research');
    getComponent(world: WorldContext): Promise<Component>;
}
class WorkerOutputComponent extends CompositeComponent {
    readonly task: string;
    readonly content: string;
    readonly type: string;
    constructor(name: string, task: string, content: string, type: string);
}
class WorkerAssemblerComponent extends MergeComponent<WorkerOutputComponent> {
    readonly objective: string;
    readonly type: 'write' | 'code' | 'research';
    constructor(name: string, objective: string, type: 'write' | 'code' | 'research');
    mergeComponents(components: WorkerOutputComponent[], world: WorldContext): Promise<Component>;
}
class SolutionOutputComponent extends CompositeComponent {
    readonly objective: string;
    readonly content: string;
    readonly type: string;
    constructor(name: string, objective: string, content: string, type: string);
}

interface WorldContext {
    conversationId: string;
    messages: IConversationMessage[];
    context: string[];
    getTextCompletion(systemPrompt: string, ...text: string[]): Promise<string>;
    getCodeBlocks(markdown: string): {
        code: string;
        language?: string;
    }[];
    getSteps(markdown: string): string[];
}
type ComponentType<T extends Component = Component> = {
    new (...args: any[]): Component;
};
abstract class Component {
    abstract name: string;
    source: string;
    description: string;
}
abstract class CompositeComponent extends Component {
    readonly name: string;
    constructor(name: string);
}
abstract class MergeComponent<T extends CompositeComponent> extends Component {
    readonly name: string;
    abstract mergeComponents(components: T[], world: WorldContext): Promise<Component>;
    constructor(name: string);
}
abstract class AsyncComponent extends Component {
    readonly name: string;
    abstract getComponent(world: WorldContext): Promise<Component>;
    constructor(name: string);
}
abstract class ParallelComponent extends Component {
    readonly name: string;
    abstract createComponents(world: WorldContext): Promise<Component[]>;
    constructor(name: string);
}
abstract class ChoiceComponent extends Component {
    readonly name: string;
    readonly choice: string;
    abstract selectChoice(world: WorldContext): Promise<Component>;
    constructor(name: string, choice: string);
}

class CompressedZipPackage {
    zipFileName: string;
    files: File[];
    constructor(zipFileName: string);
    addFile(path: string, blob: Blob): void;
    compress(): Promise<File>;
}

const SystemPrompts: {
    Assistant: string;
    Helper: string;
    Solver: string;
    Coordinator: string;
    Planner: string;
    Worker: string;
    Assemble: string;
    Fix: string;
    Improve: string;
    IterativeDeveloper: string;
    FunctionalDeveloper: string;
    FunctionalArchitect: string;
    Application: string;
};

class AsyncProcessingSystem implements System {
    readonly ecs: ECS;
    readonly id: string;
    readonly getWorldContext: () => WorldContext;
    readonly runInParallel: boolean;
    constructor(ecs: ECS, id: string, getWorldContext: () => WorldContext, runInParallel?: boolean);
    update(entity: Entity): void;
}

class CompositionSystem<T extends CompositeComponent> implements System {
    readonly ecs: ECS;
    readonly id: string;
    readonly world: WorldContext;
    readonly type: ComponentType<T>;
    constructor(ecs: ECS, id: string, world: WorldContext, type: ComponentType<T>);
    update(entity: Entity): void;
}

class ConditionalBranchingSystem implements System {
    readonly ecs: ECS;
    readonly id: string;
    readonly select: (choices: string[]) => Promise<string>;
    constructor(ecs: ECS, id: string, select: (choices: string[]) => Promise<string>);
    update(entity: Entity): void;
}

class ParallelBranchingSystem implements System {
    readonly ecs: ECS;
    readonly id: string;
    readonly getWorldContext: () => WorldContext;
    constructor(ecs: ECS, id: string, getWorldContext: () => WorldContext);
    update(entity: Entity): void;
}

class TextProcessor {
    removeDuplicateSections(texts: string[]): string;
    removeNoiseWords(text: string): string;
    private noiseWords;
}

class VectorDB {
    private readonly fileStore;
    private readonly textEmbeddings;
    private name;
    private db;
    private readonly textProcessor;
    constructor(fileStore: IFileStore, textEmbeddings: ITextEmbeddingService, name: string);
    load(): Promise<void>;
    save(): Promise<void>;
    vectorSearch(text: string): Promise<any[]>;
    storeDocument(name: string, text: string, chunkSize?: number, url?: string | undefined): Promise<string[]>;
    storeVector(name: string, text: string, embedding: number[], url?: string): Promise<void>;
    removeVectors(sourceName: string): Promise<void>;
    removeVector(text: string): Promise<void>;
    removeVectorAt(index: number): Promise<void>;
    private removeDuplicates;
    private rankVectors;
    private sortArray;
    private retrieveVectors;
    private textSearch;
    private cosineSimilarity;
    private chunkText;
}

class ConversationViewModel {
    conversation: IConversationContext;
    settings: ConversationSettings;
    speechInput: ISpeechInputManager;
    speechOutput: ISpeechOutputManager;
    fileProcessor: IFileProcessor;
    fileStore: IFileStore;
    messageStore: IFileStore;
    messageStoreLocation: string;
    constructor(settings?: Partial<ConversationSettings>, env?: Partial<ConversationEnvironment>);
    init(): Promise<void>;
    clearConversation(): void;
    saveMessages(): Promise<void>;
    addFiles: (files: File[], addMessage?: boolean) => Promise<IConversationFile[]>;
    createFile(name: string): {
        name: string;
        type: string;
        text: () => Promise<string>;
        json: () => Promise<any>;
        search(text: any): Promise<0 | 1>;
    };
    getConversationMarkdown(assistantName?: string, userName?: string): string;
    downloadConversation(zipFileName: string, assistantName: string, userName?: string): Promise<File>;
}

interface IWorkspaceAction {
    name: string;
    title: string;
    description: string;
    icon: JSX.SvgImage;
    execute: () => Promise<void> | void;
}
interface IWorkspaceActivity {
    type: 'Conversation' | 'Document' | 'Component';
    title: string;
    content: any;
    context?: any;
}
class WorkspaceViewModel {
    onAssistantWorking: IEvent<boolean>;
    currentContent: JSX.IReference<HTMLElement>;
    currentActivity: JSX.IReference<IWorkspaceActivity>;
    popupItems: IObservableList<IWorkspaceActivity>;
    activities: IObservableList<IWorkspaceAction>;
    buttons: IObservableList<IWorkspaceAction>;
    onActivityClosed: IEvent<void>;
    history: IObservableList<IWorkspaceActivity>;
    sidebarTabs: IObservableList<HTMLElement>;
    screenInput: IMediaInputManager;
    cameraInput: IMediaInputManager;
    audioInput: IMediaInputManager;
    browserAudioInput: ISpeechInputManager;
    audioAnalyzer: AudioAnalyzer;
    welcomeView: IWorkspaceActivity;
    activitiesView: IWorkspaceActivity;
    chatFiles: IObservableList<string>;
    chat?: ConversationViewModel;
    conversationType?: AssistantActivityType;
    assistant?: AssistantViewModel;
    fileStore: IFileStore;
    messageStore: IFileStore;
    vectorDB: VectorDB;
    constructor(assistant: JSX.IReference<Assistant>);
    init(): Promise<void>;
    addToConversation(message: string, imageUrl?: string): Promise<void>;
    onInputRequested(type: AssistantActivityType, title: string, message: string, clearConversation?: boolean): Promise<void>;
    startNewConversation(type: AssistantActivityType, title: string): Promise<void>;
    renderConversation(type: AssistantActivityType): Promise<any>;
    stopRecording: () => void;
    openAssistant: () => Promise<void>;
    openChat: (file: string) => Promise<void>;
    openFile: (file: any) => Promise<void>;
    showActivities: () => void;
    openActivity(activity: IWorkspaceActivity): void;
    closeActivity: () => void;
    getActivityIcon(activity: IAssistantActivity): JSX.SvgImage;
    private blobToDataUrl;
    private isMobileDevice;
}

interface ActivitiesViewProps {
    activities: IObservableList<IWorkspaceAction>;
}
function ActivitiesView({ activities }: ActivitiesViewProps): any;
{};

interface Conversation {
    model: ConversationViewModel;
    element: HTMLElement;
}
function createConversation(settings?: Partial<ConversationSettings>, env?: Partial<ConversationEnvironment>): Promise<{
    view: any;
    model: ConversationViewModel;
}>;
function ConversationView(vm: ConversationViewModel): any;

function HelperView(): any;
class OpenAITextCompletionService {
    private baseUrl;
    private headers;
    private systemPrompt;
    readonly model: string;
    private initial_tokens;
    private temperature;
    constructor(baseUrl: string, headers: {}, systemPrompt: string, model?: string, initial_tokens?: number, temperature?: number);
    getTextCompletion(messages: IConversationMessage[], context: string[], max_tokens?: number | undefined): any;
}

function WelcomeView(onContinueActivity: () => void, startNewActivity: () => void, showAssistant: (settings: AssistantSettings) => Promise<void>, hideAssistant: () => void): any;
function createActivityList(startActivity: (type: AssistantActivityType, title: string, message: string) => void): ObservableList<IWorkspaceAction>;
function howItWorks(): void;

function WorkspaceView(assistant: JSX.IReference<Assistant>, vm: WorkspaceViewModel): any;
