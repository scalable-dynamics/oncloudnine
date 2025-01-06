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
