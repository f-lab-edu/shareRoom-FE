interface Element {
  addEventListener<T extends string, K extends { type?: string, payload?: any, store: any }>(type: T, listener: (this: Element, ev: Event & { detail: K }) => any, options?: boolean | AddEventListenerOptions): void;
}
