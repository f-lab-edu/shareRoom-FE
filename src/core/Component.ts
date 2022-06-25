import { nanoid } from 'nanoid';

export interface Template {
  parent: Element | Node;
  children?: (Template | Element | Node | DocumentFragment)[];
}

abstract class Component<T extends { [key: string]: any }> extends HTMLElement {
  private componentId = nanoid();
  private state?: T;

  constructor() {
    super();
  }

  private connectedCallback() {
    this.render();
    this.componentDidMounted();
  }
  private disconnectedCallback() {
    this.componentDidUnMounted();
  }
  private attributeChangedCallback() {
    this.componentDidUpdated();
  }

  protected componentDidMounted: () => void = () => {
    // override
  };
  protected componentDidUpdated: () => void = () => {
    // override
  };
  protected componentDidUnMounted: () => void = () => {
    // override
  };

  public getComponentId() {
    return this.componentId;
  }

  // prop과 state를 따로 안두고 하나로
  public setState = (newState: T) => {
    // state가 몇개가 갱신되더라도 한번만 갱신되도록 하고 싶다.
    // state안에 몇개의 state가 있을 테지만, 각 property가 갱신 될 때마다, render되게 하는 건 가혹하다. = proxy는 쓸 수 없다.

    // re-render 트리거는 shallow equal
    const isReRender = Object.entries(newState).some(([key, val]) => (
      (this.state ? this.state[key] : undefined) !== val
    ));

    if (isReRender) {
      this.state = {
        ...this.state,
        ...newState,
      };

      this.render();
      this.componentDidUpdated();
    }

    return this;
  };

  protected addEventListenerToWindow = (eventName: string, callback: (e: CustomEvent) => void) => {
    window.addEventListener(eventName, callback.bind(this) as EventListener);
  };

  // 각 컴포넌트의 렌더링이 어떻게 될지는 알아서
  // 사용자 자유! 이 안에 렌더할 것을 넣어주세요!
  protected abstract template: () => Template;

  private composeComponents = (newTemplates: Template): Element | Node => {
    const parent = newTemplates.parent;
    const children = newTemplates.children;

    if (children && children.length > 0) {
      children.forEach(el => {
        const child: Element | Node = el instanceof Element || el instanceof Node ? el : this.composeComponents(el);
        return parent.appendChild(child);
      });
    }

    return parent;
  };

  // Component의 최종 결과물은 항상 이 함수를 통해야 한다.
  protected render = () => {
    const newTemplate = this.template();
    const rootElement = this.composeComponents(newTemplate);

    this.replaceChildren(rootElement);
  };
}

export default Component;
