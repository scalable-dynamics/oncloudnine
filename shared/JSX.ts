namespace JSX {
    export type EventHandler<T extends Event> = (event: T) => void;

    export type SvgImage = () => HTMLImageElement;

    export interface IReference<T> {
        setReference(reference: T): void;
        onLoad: IEvent<T>;
        readonly value?: T;
    }

    export interface Reference<T = HTMLElement> {
        ref?: IReference<T>;
    }

    export interface Component<T> extends Reference<T> {
        class?: string;
        if?: boolean;
        when?: Promise<any> | IReference<any>;
        id?: string;
    }

    export interface BasicElement extends Component<HTMLElement> {
        title?: string;
        style?: string;
        draggable?: boolean;
        onclick?: (event: MouseEvent) => void;
        ondragstart?: (event: DragEvent) => void;
        ondragenter?: (event: DragEvent) => void;
        ondragleave?: (event: DragEvent) => void;
        ondragover?: (event: DragEvent) => void;
        ondragend?: (event: DragEvent) => void;
        ondrop?: (event: DragEvent) => void;
    }

    export interface ValueElement extends BasicElement {
        autocomplete?: 'off';
        type?:
        | 'text'
        | 'password'
        | 'file'
        | 'radio'
        | 'checkbox'
        | 'date'
        | 'time'
        | 'number'
        | 'range'
        | 'color'
        | 'submit'
        | 'reset';
        value?: string;
        name?: string;
        checked?: boolean;
        multiple?: boolean;
        min?: number;
        max?: number;
        step?: number;
        maxlength?: number;
        placeholder?: string;
        oninput?: (event: InputEvent) => void;
        onchange?: (event: InputEvent) => void;
        onkeypress?: (event: KeyboardEvent) => void;
        onpaste?: (event: ClipboardEvent) => void;
    }

    export interface OptionElement extends ValueElement {
        disabled?: boolean;
        selected?: boolean;
    }

    export interface ImageElement extends BasicElement {
        alt?: string;
        src?: string;
    }

    export interface ActionElement extends BasicElement {
        href?: string;
    }

    export interface FormElement extends BasicElement {
        method?: string;
        action?: string;
    }

    export interface CanvasElement extends BasicElement {
        graph?: any;
        width?: number;
        height?: number;
    }

    // As an example, you can define more as needed:
    export interface IntrinsicElements {
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
        nav: BasicElement;
        a: ActionElement & Reference<HTMLAnchorElement>;
        button: ActionElement & Reference<HTMLButtonElement>;
        form: FormElement;
        dialog: BasicElement & { open?: boolean };
        fieldset: BasicElement;
        legend: BasicElement;
        details: BasicElement & { open?: boolean };
        summary: BasicElement;
        input: ValueElement & Reference<HTMLInputElement>;
        textarea: ValueElement & { rows?: number } & Reference<HTMLTextAreaElement>;
        select: ValueElement & Reference<HTMLSelectElement>;
        option: OptionElement;
        label: BasicElement & { for?: string };
        span: BasicElement;
        audio: Reference<HTMLAudioElement> & { src?: string; autoplay?: boolean; controls?: boolean };
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
        td: BasicElement & { colspan?: number };
        th: BasicElement;
        ul: BasicElement;
        ol: BasicElement;
        li: BasicElement;
        i: BasicElement;
        canvas: CanvasElement & Reference<HTMLCanvasElement>;
    }
}