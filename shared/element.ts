function isElementReference(arg: any): arg is JSX.IReference<HTMLElement> {
    return isReference<HTMLElement>(arg);
}

function isReference<T>(arg: any): arg is JSX.IReference<T> {
    return arg && typeof (arg) === 'object' && typeof (arg.onLoad) === 'object';
}

function $element(component, props = {}, ...children: any): HTMLElement | undefined {
    //children = children.flat().filter((child) => child !== undefined && child !== null);
    const isFragment = (component === $children);
    if (props && props.hasOwnProperty('if') && props['if'] !== true) return undefined;
    if (typeof (component) === 'function' && !isFragment) {
        return component(props, children);
    }
    else if (typeof (component) === 'string' || isFragment) {
        const element = document.createElement(isFragment ? 'div' : component);
        let asyncProps: Promise<[string, any]>[] = [];
        for (let property in props) {
            const value = props[property];
            if (property === 'if' || property === 'ref') continue;
            if (typeof (value) === 'function' || property.toLowerCase() !== property) {
                element[property] = value;
            } else if (isElementReference(value)) {
                const func = children && children[0];
                const hasAsyncChild = (children && typeof (children[0]) === 'function');
                asyncProps.push(new Promise((resolve) => {
                    let firstLoad = true;
                    value.onLoad.add((arg) => {
                        if (property !== 'when') element.setAttribute(property, arg);
                        if (firstLoad) {
                            resolve([property, arg]);
                            firstLoad = false;
                        } else if (hasAsyncChild) {
                            element.innerHTML = '';
                            let newChildren = func(arg);
                            if (!Array.isArray(newChildren)) newChildren = [newChildren];
                            $children(element, newChildren);
                        }
                    });
                }));
            } else if (value instanceof Promise) {
                asyncProps.push(value.then((arg) => {
                    if (property !== 'when') element.setAttribute(property, arg);
                    return [property, arg];
                }));
            } else {
                element.setAttribute(property, value);
            }
        }
        if (children && props && props['when'] && typeof (children[0]) === 'function') {
            const func = children[0];
            Promise.all(asyncProps).then((properties) => {
                let newChildren = func(...properties.map(([property, value]) => value));
                if (!Array.isArray(newChildren)) newChildren = [newChildren];
                $children(element, newChildren);
            });
            delete children[0];
        }
        if (children) $children(element, children);
        if (props && isElementReference(props['ref'])) props['ref'].setReference(element);
        return element;
    }
    console.log('$element component not recognized:', component, props, children);
    throw new Error(`Component not valid: ${component}(${Object.keys(props)})`);
}

function resolveChildren(children: any, ...args: any[]) {
    //console.log('resolveChildren', children, args);
    if(Array.isArray(children)) children = children.flat();
    if (Array.isArray(children) && children.length === 1) children = children[0];
    if (typeof (children) === 'function') children = children(...args);
    if (!Array.isArray(children)) children = [children];
    return children.flat();
}

function $children(element, children) {
    //console.log('$children', element, children);
    for (let child of children) {
        if (child === undefined || child === null) {
            continue;
        } else if (Array.isArray(child)) {
            $children(element, child);
            continue;
        } else if (typeof (child) === 'string') {
            const text = document.createTextNode(child);
            element.appendChild(text);
            // if (element.children.length > 0) {
            //     const span = document.createElement('span');
            //     span.innerText = child?.toString() || '';
            //     element.appendChild(span);
            // } else {
            //     element.innerText = child?.toString() || '';
            // }
            continue;
        } else if (typeof (child) === 'function') {
            child = child();
        } else if (child && typeof (child) === 'object' && child.svg) {
            const { svg } = child;
            child = document.createElement('span');
            child.innerHTML = svg;
        }
        if (child && child.style) {
            element.appendChild(child);
        } else if (child) {
            console.log('$element child not recognized:', element, children, child);
            throw new Error(`Child not valid: ${child}`);
        }
    }
}

function $reference<T = HTMLElement>(): JSX.IReference<T> {
    let value;
    let ref = {
        onLoad: $event<T>(),
        setReference(reference) {
            value = reference;
            setTimeout(() => ref.onLoad.notify(value), 100);
        },
        get value() {
            return value;
        }
    };
    return ref;
}

function $event<T>(context?: any): IEvent<T> {
    const handlers: EventHandler<T>[] = [];
    let state;
    return {
        add(handler: EventHandler<T>) {
            handlers.push(handler);
            if (state) handler(state, context);
        },
        async notify(arg: T, context_in?: any) {
            for (let handler of handlers) {
                await handler(arg, context_in || context);
            }
            state = arg;
        }
    };
}