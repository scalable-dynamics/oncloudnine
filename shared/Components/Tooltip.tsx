export function ShowTooltip(text: string, element: HTMLElement, seconds: number = 2) {
    const count: any = element.dataset['tooltips'] || '1';
    let tooltip = (<div class="tooltip">{text}</div>);
    document.body.appendChild(tooltip);
    const rect = element.getBoundingClientRect();
    tooltip.style.left = ((rect.left - tooltip.clientWidth / 2) + rect.width / 2) + 'px';
    tooltip.style.top = (rect.top - (count * tooltip.clientHeight - 8) - 30) + 'px';
    tooltip.style.opacity = '1';
    if (count) {
        element.dataset['tooltips'] = (parseInt(count) + 1).toString();
    } else {
        element.dataset['tooltips'] = '1';
    }
    let removed = false;
    function remove() {
        tooltip.style.opacity = '0';
        window.setTimeout(() => {
            if (removed) return;
            removed = true;
            tooltip.remove();
            element.removeEventListener('mouseleave', remove);
        }, 500);
    }
    element.addEventListener('mouseleave', remove);
    window.setTimeout(remove, seconds * 1000);
}