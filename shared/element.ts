/*************************************************************
 * Type Guards
 *************************************************************/
function isReference<T>(arg: any): arg is JSX.IReference<T> {
    return arg && typeof arg === 'object' && typeof arg.onLoad === 'object';
}

function isElementReference(arg: any): arg is JSX.IReference<HTMLElement> {
    return isReference<HTMLElement>(arg);
}

/*************************************************************
 * The core: $element
 *
 *  - Creates DOM elements (or calls functional components).
 *  - Allows "if" for conditional rendering.
 *  - Allows "ref" for capturing references to DOM nodes.
 *  - Handles "when" references or Promises for async rendering.
 *  - Delegates child logic to $children (handles recursion).
 *  - Compatible with function components.
 *************************************************************/
function $element(
    component: string | Function,
    props: Record<string, any> = {},
    ...children: any[]
): HTMLElement | undefined {
    if (!props) props = {};
    // 1. Conditional rendering: skip if `props.if === false`
    if (props.hasOwnProperty('if') && props.if !== true) {
        return undefined;
    }

    // 2. If `component` is a function, it’s likely a functional component:
    if (typeof component === 'function') {
        return component(props, children);
    }

    // 3. Otherwise, treat `component` as a tag name (like "div").
    const element = document.createElement(component);

    // 4. Prepare an array of Promises from async/Promise props.
    //    (We'll wait on these to decide what to render if there's a "when".)
    const asyncProps: Array<Promise<[string, any]>> = [];

    // 5. Iterate over props and handle them:
    for (const property in props) {
        const value = props[property];
        if (property === 'if' || property === 'ref') {
            // skip these, handled externally
            continue;
        }

        // a) If `property` is uppercase or is a known function event (`on...`),
        //    treat it as a property assignment rather than an attribute.
        const isEventOrProperty =
            typeof value === 'function' ||
            property.toLowerCase() !== property ||
            property.startsWith('on');

        // b) If it's a reference or promise, we handle it async or watch for changes:
        if (isReference(value)) {
            // property is a dynamic reference
            const hasAsyncChild = children && typeof children[0] === 'function';
            const asyncChild = hasAsyncChild ? children[0] : undefined;
            asyncProps.push(
                new Promise<[string, any]>((resolve) => {
                    let firstLoad = true;
                    value.onLoad.add((resolvedValue: any) => {
                        // Update as attribute unless the property is “when”
                        if (property !== 'when') {
                            element.setAttribute(property, resolvedValue);
                        }

                        // The first time we get the value, we also fulfill the promise
                        if (firstLoad) {
                            resolve([property, resolvedValue]);
                            firstLoad = false;
                        } else if (hasAsyncChild) {
                            // For dynamic children, re-render on changes
                            if (!asyncChild) {
                                console.error('asyncChild is not defined', asyncChild, component, props, children);
                            }
                            element.innerHTML = '';
                            const dynamicChildren = asyncChild(resolvedValue);
                            $children(element, dynamicChildren);
                        }
                    });
                })
            );
        } else if (value instanceof Promise) {
            // property is a Promise
            asyncProps.push(
                value.then((resolvedValue) => {
                    if (property !== 'when') {
                        element.setAttribute(property, resolvedValue);
                    }
                    return [property, resolvedValue];
                })
            );
        } else if (isEventOrProperty) {
            // Regular property assignment (e.g. onclick, .value, etc.)
            (element as any)[property] = value;
        } else {
            // c) Otherwise, treat it as an HTML attribute.
            element.setAttribute(property, value);
        }
    }

    // 6. If `props.when` is set and `children[0]` is a function,
    //    we wait on all asyncProps, then call that function with each resolved value:
    if (props && props.when && typeof children[0] === 'function') {
        const dynamicFunc = children[0];
        Promise.all(asyncProps).then((resolvedProperties) => {
            // The function arguments are the resolved values in order.
            const newChildren = dynamicFunc(
                ...resolvedProperties.map(([_, val]) => val)
            );
            $children(element, newChildren);
        });
        // remove the function from the normal child rendering below
        children.shift();
    }

    // 7. Render children (e.g. strings, elements, arrays, etc.) recursively:
    $children(element, children);

    // 8. If there's a `ref` property, bind the reference so the caller can read the DOM element:
    if (props.ref && isElementReference(props.ref)) {
        props.ref.setReference(element);
    }

    return element;
}

/*************************************************************
 * $children
 *  - Recursively appends children to an element.
 *  - Handles arrays, text, functional children, or <svg> object stubs.
 *  - Allows you to nest arrays of children without manual flattening.
 *************************************************************/
function $children(
    parent: HTMLElement | null | undefined,
    children: any
): void {
    if (!parent || !children) return;

    // Flatten children if array
    if (Array.isArray(children)) {
        for (const child of children) {
            $children(parent, child);
        }
        return;
    }

    // Handle simple string child
    if (typeof children === 'string') {
        parent.appendChild(document.createTextNode(children));
        return;
    }

    // Handle function child
    if (typeof children === 'function') {
        $children(parent, children());
        return;
    }

    // Handle potential {svg: string} objects or other direct objects
    if (children && typeof children === 'object') {
        // If it’s an SVG snippet object: { svg: '...' }
        if (children.svg) {
            const spanWrapper = document.createElement('span');
            spanWrapper.innerHTML = children.svg;
            parent.appendChild(spanWrapper);
            return;
        }

        // If it’s an actual DOM element (like from $element), just append
        if (children instanceof HTMLElement) {
            parent.appendChild(children);
            return;
        }
    }

    // If none of the above matched, we can handle logs or throw:
    console.warn('Unrecognized child:', children);
    // or:
    // throw new Error(`Child not valid: ${children}`);
}

/*************************************************************
 * $reference
 *  - Returns an object that can hold a DOM element reference.
 *  - onLoad event is triggered once the reference is assigned.
 *************************************************************/
function $reference<T = HTMLElement>(): JSX.IReference<T> {
    let value: T | undefined;
    const ref: JSX.IReference<T> = {
        onLoad: $event<T>(),
        setReference(reference) {
            //console.log('Setting reference:', reference);
            value = reference;
            // Trigger onLoad asynchronously:
            setTimeout(() => ref.onLoad.notify(value!), 0);
        },
        get value() {
            return value;
        },
    };
    return ref;
}

/*************************************************************
 * $event
 *  - Creates an event-like structure with .add() and .notify() 
 *    to handle watchers or callbacks.
 *************************************************************/
function $event<T>(context?: any): IEvent<T> {
    const handlers: Array<(arg: T, ctx?: any) => void | Promise<void>> = [];
    let state: T | undefined;

    return {
        add(handler) {
            handlers.push(handler);
            // If there's already a state, call immediately with existing data:
            if (state !== undefined) handler(state, context);
        },
        async notify(arg: T, context_in?: any) {
            for (const handler of handlers) {
                await handler(arg, context_in ?? context);
            }
            state = arg;
        },
    };
}