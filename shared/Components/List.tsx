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

export function ListEditor(
 {
   items,
   onAdd,
   onModify,
   onRemove
 }: {
   items: any[];
   onAdd: (item: any) => void;
   onModify: (item: any) => void;
   onRemove: (item: any) => void;
 },
 children: [ListTemplate]
) {
 // 1) Create or subscribe to an ObservableList so we can reactively track items.
 const list = new ObservableList(items);

 list.onItemAdded(onAdd);
 list.onItemRemoved(onRemove);

 // 2) Track the currently dragged item/index for reorder (if using DnD)
 let dragIndex = -1;

 function onDragStart(e: DragEvent, item: any, index: number) {
   dragIndex = index;
   // Mark data to let the browser know we are moving items
   e.dataTransfer?.setData('text/plain', JSON.stringify(item));
   e.dataTransfer!.effectAllowed = 'move';
 }

 function onDragOver(e: DragEvent) {
   e.preventDefault();
   // Indicate that we can be dropped onto
   e.dataTransfer!.dropEffect = 'move';
 }

 function onDrop(e: DragEvent, dropIndex: number) {
   e.preventDefault();

   // If we are dropping on a new index
   if (dragIndex !== dropIndex && dragIndex >= 0) {
     list.moveItem(dragIndex, dropIndex);
   }
   dragIndex = -1;
 }

 // 3) Inline handlers for reorder without drag:
 function moveUp(index: number) {
   if (index <= 0) return;
   list.moveItem(index, index - 1);
 }

 function moveDown(index: number) {
   if (index >= list.array.length - 1) return;
   list.moveItem(index, index + 1);
 }

 return (
   <div class="list-editor">
     <List items={list}>
       {(item, remove, index) => (
         <>
           {/* -- DRAG & DROP HANDLERS -- */}
           <div
             class="list-item"
             draggable={true}
             ondragstart={(e: DragEvent) => onDragStart(e, item, index)}
             ondragover={onDragOver}
             ondrop={(e: DragEvent) => onDrop(e, index)}
           >
             {/* -- REORDER BUTTONS -- */}
             <button onclick={() => moveUp(index)}>&uarr;</button>
             <button onclick={() => moveDown(index)}>&darr;</button>

             {/* -- USER-DEFINED TEMPLATE CONTENT -- */}
             {/* {resolveChildren(children, item, remove)} */}

             {/* -- EDIT BUTTON -- */}
             <button onclick={() => onModify(item)} title="Edit">
               &#x270E;
             </button>

             {/* -- REMOVE BUTTON -- */}
             <button onclick={remove} title="Remove">
               &#x2716;
             </button>
           </div>
         </>
       )}
     </List>

     {/* -- ADD NEW ITEM BUTTON -- */}
     <button onclick={() => list.add({})} title="Add Item">
       &#x2795;
     </button>
   </div>
 );
}
