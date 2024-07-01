class ObservableList<T> implements IObservableList<T> {

    public array: any[];
    private added: IEvent<T>;
    private removed: IEvent<T>;

    constructor(public items: IList<T>) {
        this.array = [];
        this.added = new EventManager<T>();
        this.removed = new EventManager<T>();
        this.load(items);
    }

    get count() {
        return this.array.length;
    }

    *[Symbol.iterator]() {
        for (let item of this.array) {
            yield item;
        }
    }

    onItemAdded(added: ListEventHandler<T>) {
        this.added.add(added);
    }

    onItemRemoved(removed: ListEventHandler<T>) {
        this.removed.add(removed);
    }

    async add(item: any, arg?: any) {
        this.array.push(item);
        await this.added.notify(item, arg);
    }

    async remove(item: any) {
        const index = this.array.findIndex(i => i === item);
        if (index === -1) { console.log('remove item: index not found!', this.array, item); return; }
        this.array.splice(index, 1);
        await this.removed.notify(item, index);
    }

    async clear() {
        for (let i = this.array.length - 1; i > -1; i--) {
            await this.removed.notify(this.array[i], i);
        }
        this.array = [];
    }

    private async load(data: IList<T>) {
        this.array = [];
        if (Array.isArray(data)) {
            for (let item of data) {
                this.array.push(item);
            }
        } else if (typeof (data[Symbol.asyncIterator]) === 'function') {
            const iterator = data as AsyncIterable<any>;
            for await (let item of iterator) {
                this.array.push(item);
            }
        } else if (typeof (data[Symbol.iterator]) === 'function') {
            const iterator = data as Iterable<any>;
            for (let item of iterator) {
                this.array.push(item);
            }
        } else if (typeof (data) === 'function') {
            const items = await data();
            for (let item of items) {
                this.array.push(item);
            }
        } else if (data) {
            throw new Error('ListDataSource is invalid');
        }
        console.log(this.array);
    }
}
