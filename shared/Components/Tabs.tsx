interface TabsProps {
    selected?: string;
    tabs?: IObservableList<HTMLElement>;
    onSelect?: (tab: string) => void;
}

export function Tabs(props: TabsProps, children: (HTMLElement | HTMLElement[]) | (() => HTMLElement[])) {
    const tabs = $reference<HTMLElement>();
    const tabContainer = $reference<HTMLElement>();
    const tabContent = $reference<HTMLElement>();

    if (props?.tabs) {
        props.tabs.onItemAdded((tab) => {
            if (!tabContainer.value || !tabContent.value) return;
            tabContent.value.appendChild(tab);
            tabContainer.value.appendChild(<div data-tab={tab.dataset.tab} class="tab" onclick={(e) => selectTab(e.target, tab)}>{tab.dataset.tab}</div>);
            selectTab(tabContainer.value.querySelector(`.tab[data-tab="${tab.dataset.tab}"]`), tab);
        });
        props.tabs.onItemRemoved((tab) => {
            if (!tabContainer.value || !tabContent.value) return;
            tabContainer.value.querySelector(`.tab[data-tab="${tab.dataset.tab}"]`)?.remove();
            tabContent.value.querySelector(`[data-tab="${tab.dataset.tab}"]`)?.remove();
        });
    }

    if (typeof (children) === 'function') children = children();
    if (!Array.isArray(children)) children = [children];
    children = children.flat();

    if (props?.selected) {
        tabs.onLoad.add((container) => {
            container.querySelector<HTMLElement>(`.tab[data-tab="${props.selected}"]`)?.click();
        });
    } else {
        tabs.onLoad.add((container) => {
            container.querySelector<HTMLElement>('.tab')?.click();
        });
    }

    return (
        <div ref={tabs} class="tabs">
            <div ref={tabContainer} class="tab-container">
                {children.map(tab => (
                    <div data-tab={tab.dataset.tab} class={tab.dataset.tab === props?.selected ? "tab selected" : "tab"} onclick={(e) => selectTab(e.target, tab)}>{tab.dataset.tab}</div>
                ))}
            </div>
            <div ref={tabContent} class="tab-content">
                {children}
            </div>
        </div>
    );

    function selectTab(tab, content) {
        if (!tabs.value) return;
        tabs.value.querySelector('.tab.selected')?.classList.remove('selected');
        tabs.value.querySelectorAll('.open').forEach(content => content.classList.remove('open'));
        tab.classList.add('selected');
        content.classList.add('open');
        if (typeof (props?.onSelect) === 'function') props.onSelect(tab.dataset.tab);
    }
}