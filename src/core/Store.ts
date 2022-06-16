type StoreElement = HTMLElement | typeof window;

export interface Dispatch {
  type: string;
  payload?: unknown;
}

interface PublishPayload<T> {
  type: string;
  payload: unknown;
  store: T;
}

interface DispatchOption {
  bubbles?: boolean
  dispatchElement?: StoreElement
}

function createStore<T, P extends Dispatch>(
  name: string,
  callback: (store: T, action: P) => T,
  targetElement?: HTMLElement,
) {
  let currentStore: T;
  const reducer = callback;
  const dispatchEventName = `${name}-dispatch`;
  const storeElement: StoreElement = targetElement || window;

  storeElement.addEventListener(dispatchEventName, (e: CustomEventInit<P> & Event) => {
    e.stopPropagation();
    currentStore = reducer(currentStore, e.detail!);

    // FIXME: publish를 listen하는 곳에서 어떤 결과가 올지를 type으로 알려줄 수가 없다는 것이 단점이다. -> event interface 확장을 통해 가능할 것...
    const publish = new CustomEvent<PublishPayload<T>>(name, {
      detail: {
        type: e.detail!.type,
        payload: e.detail!.payload,
        store: currentStore,
      },
    });
    storeElement.dispatchEvent(publish);
  });

  function dispatch(
    { type, payload }: P,
    { bubbles = false, dispatchElement = storeElement }: DispatchOption,
  ) {
    const dispatch = new CustomEvent(dispatchEventName, {
      detail: {
        type,
        payload,
      },
      bubbles,
    });
    dispatchElement.dispatchEvent(dispatch);
  }

  const getStore = () => {
    return currentStore;
  };

  // init!
  // @ts-ignore
  dispatch({ type: 'init', action: { type: '' } });

  return {
    dispatch,
    getStore,
  };
}

export default createStore;
