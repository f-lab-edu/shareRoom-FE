export interface Dispatch {
  type: string;
  payload?: unknown;
}

interface PublishPayload<T> {
  type: string;
  payload: unknown;
  store: T;
}

function createStore<T, P extends Dispatch>(
  name: string,
  callback: (store: T, action: P) => T,
  targetElement?: HTMLElement,
) {
  let currentStore: T;
  const reducer = callback;
  const dispatchEventName = `${name}-dispatch`;
  const listenerElement = targetElement || window;

  // listener Element를 정할 수 있다는 장점이 있지만... 그것 뿐인 것 같다.
  // 원본처럼 subscribe로 바꾸는 편이 좋을 것 같다.
  listenerElement.addEventListener(dispatchEventName, (e: CustomEventInit<P>) => {
    currentStore = reducer(currentStore, e.detail!);

    // FIXME: publish를 listen하는 곳에서 어떤 결과가 올지를 type으로 알려줄 수가 없다는 것이 단점이다. -> event interface 확장을 통해 가능할 것...
    // FIXME: listener가 달린 DOM 객체가 아니면 listening을 할 수 없어, 불편하다...
    const publish = new CustomEvent<PublishPayload<T>>(name, {
      detail: {
        type: e.detail!.type,
        payload: e.detail!.payload,
        store: currentStore,
      },
    });
    dispatchEvent(publish);
  });

  function dispatch({ type, payload }: P) {
    const dispatch = new CustomEvent(dispatchEventName, {
      detail: {
        type,
        payload,
      },
    });
    dispatchEvent(dispatch);
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
