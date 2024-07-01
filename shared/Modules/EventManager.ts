class EventManager<T> {

    private handlers: EventHandler<T>[];

    constructor() {
        this.handlers = [];
    }

    add(handler: EventHandler<T>) {
        this.handlers.push(handler);
    }

    async notify(arg: T, context?: any) {
        for (let handler of this.handlers) {
            await handler(arg, context);
        }
    }
}
