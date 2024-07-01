import { Table } from "./Table.js";

interface FormProps extends JSX.Component<HTMLElement> {
    data: any;
    title?: string;
}

export function Form(props: FormProps, children: HTMLElement | HTMLElement[] | (() => HTMLElement[])) {
    let { ref, class: className, data, title } = props;
    if (typeof (children) === 'function') children = children();
    if (!Array.isArray(children)) children = [children];
    children = children.flat();

    console.log('Form', data, children);

    return (
        <form class={`form ${className || ''}`}>
            {title && <h2>{title}</h2>}
            <fieldset class="form-section">
                {children.map((element) => (
                    element.classList?.contains('divider') || element.classList?.contains('spacer')
                        ? element
                        :
                        <>
                            <label>{element.dataset?.label}</label>
                            {handleChange(element)}
                        </>
                ))}
                {children.length === 0 && Object.keys(data).map((key) => {
                    const value = data[key];
                    if (value && Array.isArray(value)) {
                        console.log('value', value);
                        return null;
                    } else if (typeof (value) === 'object') {
                        return null;
                    } else if (value) {
                        return {
                            name: key,
                            value,
                            update(newValue) {
                                data[key] = newValue;
                            }
                        };
                    }
                }).filter(item => !!item).map((item) => (
                    <label>
                        <span>{item!.name}</span>
                        <input value={item!.value} onchange={(ev) => item!.update((ev.target as any).value)} />
                    </label>
                ))}
            </fieldset>
        </form>
    );

    function handleChange(element: HTMLElement) {
        const name = element.dataset?.name || element.dataset?.label || 'data';
        if (element.tagName === 'INPUT') {
            const input = element as HTMLInputElement;
            if (input.type === 'checkbox') {
                input.checked = data[name] || false;
                input.onchange = () => data[name] = input.checked;
            } else {
                input.value = data[name] || '';
                input.oninput = () => data[name] = input.value;
            }
            return input;
        } else if (element.tagName === 'SELECT') {
            const select = element as HTMLSelectElement;
            select.value = data[name] || '';
            select.onchange = () => data[name] = select.value;
            return select;
        } else if (element.tagName === 'TEXTAREA') {
            const textarea = element as HTMLTextAreaElement;
            textarea.value = data[name] || '';
            textarea.oninput = () => data[name] = textarea.value;
            return textarea;
        } else {
            return element;
        }
    }
}