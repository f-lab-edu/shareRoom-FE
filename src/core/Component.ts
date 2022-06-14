import { nanoid } from 'nanoid';

// TODO: 사용자가 만든 Component도 포함되어야 한다. (document.createElement('name'))으로 가능, prop 넣어주는 것은 별도로
export interface Template {
  parent: Element | Node;
  children?: (Template | Element | Node | DocumentFragment)[];
}

abstract class Component extends HTMLElement {
  private componentId = nanoid();

  constructor() {
    super();
  }

  private connectedCallback() {
    this.render();
    this.componentDidMounted();
  }
  private disconnectedCallback() {
    this.componentDidUpdated();
  }
  private attributeChangedCallback() {
    this.componentDidUnMounted();
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

  protected addEventListenerToWindow = (eventName: string, callback: (e: CustomEvent) => void) => {
    window.addEventListener(eventName, callback.bind(this) as EventListener);
  };

  // 각 컴포넌트의 렌더링이 어떻게 될지는 알아서
  // 사용자 자유! 이 안에 렌더할 것을 넣어주세요!
  // TODO: 사용자의 Component일 경우엔 props 함수를 실행시켜 적용된 prop을 넣어주도록 하거나, props라는 객체 property를 가져 그걸 갱신하도록
  // 갱신 trigger는 각 prop의 refernce가 변하면 새로 그림 (shallow equal)
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
