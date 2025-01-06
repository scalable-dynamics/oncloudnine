type Entity = {
    id: string;
    components: any[];
    add: (component: any) => Entity;
    remove: (component: any) => Entity;
    removeComponents: <T = any>(componentType: new (...args: any[]) => T) => Entity;
    get: <T = any>(componentType: new (...args: any[]) => T) => T | undefined;
};

interface System {
    id: string;
    update: (entity: Entity) => void;
};

class ECS {
    entities: Entity[] = [];
    systems: System[] = [];

    findSystem<T = System>(id: string): T {
        return this.systems.find(system => system.id === id) as T;
    }

    findEntity(id: string): Entity | undefined {
        return this.entities.find(entity => entity.id === id);
    }

    findComponent<T = any>(componentTypeOrName: new (...args: any[]) => T | string): T | undefined {
        for (const entity of this.entities) {
            const component = entity.components.find(c => typeof (componentTypeOrName) === 'string' ? c.name === componentTypeOrName : c instanceof componentTypeOrName);
            if (component) return component as T;
        }
    }

    findComponents<T = any>(componentType: new (...args: any[]) => T): T[] {
        const components: T[] = [];
        for (const entity of this.entities) {
            const component = entity.components.find(c => c instanceof componentType);
            if (component) components.push(component as T);
        }
        return components;
    }

    removeEntity(entity: Entity) {
        const index = this.entities.indexOf(entity);
        if (index === -1) return;
        this.entities.splice(index, 1);
    }

    removeComponents(components: any[]) {
        for (const entity of this.entities) {
            for (const component of components) {
                entity.remove(component);
            }
        }
    }

    createEntity(id: string, ...components: any[]): Entity {
        const entity: Entity = {
            id,
            components,
            add: (component: any) => {
                entity.components.push(component);
                return entity;
            },
            remove: (component: any) => {
                const index = entity.components.indexOf(component);
                if (index === -1) return entity;
                entity.components.splice(index, 1);
                return entity;
            },
            removeComponents: <T = any>(componentType: new (...args: any[]) => T) => {
                entity.components = entity.components.filter(c => !(c instanceof componentType));
                return entity;
            },
            get: (componentType: new (...args: any[]) => any) => {
                return entity.components.find(c => c instanceof componentType) as any;
            },
        };
        this.entities.push(entity);
        return entity;
    }

    createSystem(id: string, update: (entity: Entity) => void, query?: (component: any) => boolean): System {
        const system = { id, update };
        if (query) {
            system.update = (entity: Entity) => {
                const components = entity.components.filter(query);
                if (components.length > 0) {
                    update({ ...entity, components });
                }
            };
        }
        this.systems.push(system);
        return system;
    }

    addSystem(system: System) {
        this.systems.push(system);
    }

    update() {
        this.entities.forEach(entity => {
            this.systems.forEach(system => system.update(entity));
        });
    }

    // run(time?: DOMHighResTimeStamp) {
    //     this.update();
    //     window.requestAnimationFrame(this.run.bind(this));
    // }

    runDelayed(time?: DOMHighResTimeStamp) {
        setTimeout(() => {
            this.update();
            window.requestAnimationFrame(this.runDelayed.bind(this));
        }, 1000 / 30);
    }

    private intervalId: any;

    start(interval = 1000 / 30) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.intervalId = setInterval(() => {
            this.update();
        }, interval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async saveState(name: string, fileStore: IFileStore) {
        const state = {
            entities: this.entities.map(entity => ({
                id: entity.id,
                components: entity.components.map(component => ({
                    type: component.constructor.name,
                    data: component,
                })),
            })),
        };
        await fileStore.storeObject(name + '-ecs-state.json', state);
    }

    async loadState(name: string, fileStore: IFileStore, componentMap: { [key: string]: new (...args: any[]) => any }) {
        const response = await fileStore.fetch(name + 'ecs-state.json');
        if (response) {
            const state = await response.json();
            this.entities = state.entities.map(entityData => {
                const entity = this.createEntity(entityData.id);
                entityData.components.forEach(componentData => {
                    const ComponentClass = componentMap![componentData.type];
                    if (ComponentClass) {
                        entity.add(new ComponentClass(componentData.data));
                    }
                });
                return entity;
            });
        }
    }

    createGraph() {
        const nodes = this.entities.map(entity => ({
            id: entity.id,
            label: entity.id,
        }));

        const edges = this.entities.flatMap(entity => {
            nodes.push(...entity.components.map(component => ({
                id: component.name || component.constructor.name,
                label: component.name || component.constructor.name,
            })));
            return entity.components.map(component => {
                return {
                    source: entity.id,
                    target: component.name || component.constructor.name
                };
            });
        });
        return { nodes, edges };
    }
}