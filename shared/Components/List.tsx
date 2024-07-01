interface ListProps extends JSX.Component<any> {
    items: IObservableList<any>;
}

type ListTemplate = (item, remove) => HTMLElement;

export function List(props: ListProps, children: [ListTemplate]) {
    const { items, class: addedClass, ...rest } = props;
    const list = $reference<HTMLElement>();
    const itemsArray = Array.from(items);

    items.onItemAdded(onItemAdded);
    items.onItemRemoved(onItemRemoved);

    const className = (addedClass ? `list ${addedClass}` : 'list') + (itemsArray.length > 10 ? ' large' : '');

    return (
        <div ref={list} class={className} {...rest}>
            {itemsArray.map(renderItem)}
        </div>
    );

    function onItemAdded(item) {
        if (!list.value) return;
        const child = renderItem(item);
        list.value.appendChild(child);
        list.value.classList.toggle('large', items.count > 10);
    }

    function onItemRemoved(item, index) {
        if (!list.value) return;
        console.log('removing', index, list.value.children[index]);
        list.value.children[index].remove();
        list.value.classList.toggle('large', items.count > 10);
    }

    function renderItem(item) {
        let element;
        if (children) {
            if (typeof (children[0]) === 'function') {
                element = children[0](item, (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    items.remove(item);
                });
            } else {
                element = document.createElement('div');
                $children(element, children);
            }
        } else {
            element = document.createElement('div');
            element.innerText = item?.toString();
        }
        element.style.setProperty('--list-index', getItemIndex(item).toString());
        return element;
    }

    function getItemIndex(item) {
        let index = 0;
        for (let data of items) {
            if (data === item) return index;
            index++;
        }
        return -1;
    }
}

export function ListEditor({ items, onAdd, onModify, onRemove }: { items: any[], onAdd: (item: any) => void, onModify: (item: any) => void, onRemove: (item: any) => void }, children:[ListTemplate]) {
    const list = new ObservableList(items);
    list.onItemAdded(onAdd);
    list.onItemRemoved(onRemove);
    return (
        <div class="list-editor">
            <List items={list}>
                {(item, remove) => (<>
                    {resolveChildren(children, item, remove)}
                    <button onclick={() => onModify(item)}>&#x270E;</button>
                    <button onclick={remove}>&#x2716;</button>
                </>)}
            </List>
            <button onclick={() => list.add({})}>&#x2795;</button>
        </div>
    )
}
