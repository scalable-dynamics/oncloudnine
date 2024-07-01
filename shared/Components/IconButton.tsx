interface IconButtonProps {
    icon: JSX.SvgImage;
    label?: string;
    title?: string;
    onClick?: () => void;
    value?: boolean;
    onToggle?: (value: boolean) => Partial<IconButtonProps>;
}

export function IconButton(props: IconButtonProps) {
    let { icon, label = '', title = '', onClick = undefined, value = false, onToggle = undefined } = props;
    const button = $reference<HTMLButtonElement>();

    if (value !== undefined && onToggle) {
        const newProps = onToggle(value);
        icon = newProps.icon || icon;
        label = newProps.label || label;
        title = newProps.title || title;
        value = newProps.value || value;
    }

    return (
        <button ref={button} onclick={() => onButtonClick()} title={title} data-value={value}>
            {icon}
            {label && <span>{label}</span>}
        </button>
    );

    function onButtonClick() {
        if (!button.value) return;
        if (onToggle) {
            const value = !(button.value.dataset.value === 'true');
            button.value.dataset.value = value.toString();
            const newProps = onToggle(value);
            button.value.title = newProps.title || title;
            button.value.innerHTML = '';
            const icon = newProps.icon || props.icon;
            button.value.appendChild(icon());
            if (newProps.label || label) {
                button.value.appendChild(<span>{newProps.label || label}</span>);
            }
        }
        if (onClick) {
            onClick();
        }
    }
}
