// Types ======================================================================

type EventCallback = (...args: any[]) => any

// Source =====================================================================

export default class Events {

    constructor() {}

    private eventListeners: Record<string, EventCallback[]> = {}

    public emit(name: string, ...args: any[]): void {
        if (this.eventListeners[name])
            for (let i = 0; i < this.eventListeners[name].length; i++)
                this.eventListeners[name][i](...args)
                
    } 

    public on(name: string, callback: EventCallback) {
        !this.eventListeners[name] && (this.eventListeners[name] = [])
        this.eventListeners[name].push(callback)
    }

    public off(name: string, callback: EventCallback) {
        if (this.eventListeners[name]) {
            this.eventListeners[name] = this.eventListeners[name].filter(x => x !== callback)
        }
    }

}