type IList<T> = (T[] | Iterable<T> | AsyncIterable<T> | (() => Promise<T[]>));
type ListEventHandler<T> = (item: T, arg?: any) => void;
type EventHandler<T> = (arg: T, context?: any) => void | Promise<void>;

interface IEvent<T> {
    add(handler: (arg: T, context?: any) => void | Promise<void>): void;
    notify(arg: T, context?: any): Promise<void>;
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
