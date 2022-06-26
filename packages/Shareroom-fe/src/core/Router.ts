class Router {
  rootElement?: HTMLElement | null;
  router: { [key: string]: Element } = {};
  query: {
    param: {
      [dynamicPath: string]: string
    }
    query: {
      key: string
      val: string
    }[]
  } = { param: {}, query: [] };

  setRootElement(rootElementId: string) {
    this.rootElement = document.getElementById(rootElementId);
  }

  constructor() {
    window.history.pushState = this.createEventTriggerFunction('pushState');
    window.addEventListener('load', this.move);
    window.addEventListener('pushState', this.move);
    window.addEventListener('popstate', this.move);
  }

  private createEventTriggerFunction<
    T extends keyof typeof History.prototype,
    P extends Parameters<History[T]>
  >(type: T) {
    const orig = history[type];

    return function(this: History, ...parameters: P) {
        orig.apply(this, parameters);
        const e = new Event(type);
        // @ts-ignore
        e.arguments = arguments;
        window.dispatchEvent(e);
    };
  };

  private findPath = (currentPath: string, routerPaths: string[]) => {
    // 만약 dynamic이라면, pathname에서 :id위치의 값을 추출해서 param에 저장하고 :id로 변환해서 줘야한다.
    // dynamic의 기준은 ":"
    const currentPathSplit: string[] = currentPath.split('/');

    let isEqual = true;
    let targetPath: Element | null = null;
    const mapper: { [paramKey: string]: string } = {};
    for (let i = 0; i < routerPaths.length; i++) {
      const routerPath = routerPaths[i];
      const ithRouterSplit = routerPath.split('/');

      // 그냥 정확히 일치하면 끝
      if (routerPath === currentPath) {
        targetPath = this.router[routerPath];
        break;
      }

      // 애초에 /로 나눈 길이가 안맞으면 그냥 넘겨야 한다.
      if (ithRouterSplit.length !== currentPathSplit.length) continue;

      isEqual = true;
      for (let j = 0; j < currentPathSplit.length; j++) {
        let ithRouterWord = ithRouterSplit[j];
        const currentPathWord = currentPathSplit[j];

        // 현 라우터와 등록된 라우터의 주소 위치가 정확히 일치해야한다.
        if (currentPathSplit[j] !== ithRouterSplit[j]) {
          // :로 시작되는 단어인 경우
          if (/(^:\w*)/.test(ithRouterWord)) {
            // 맞는 경우 dynamic 변수에 해당하는 곳이므로 mapping 필요
            const paramKey = ithRouterWord.replace(':', '');
            mapper[paramKey] = currentPathWord;
            ithRouterWord = currentPathWord;
            continue;
          }

          isEqual = false;
          break;
        }
      }

      if (isEqual) {
        targetPath = this.router[routerPath];
        break;
      }
    }

    return {
      targetPath,
      mapper,
    }
  }

  private mapQueryString = (queryString: string) => {
    // query들 끼리의 구분자
    const queries = queryString.split('&');
    const mappedQuery = queries
      .filter((query) => query)
      .map((query) => {
        // key, val 페어 구분자
        const keyValPair = query.split('=');
        const key = keyValPair[0];
        const val = keyValPair[1];
        return {
          key,
          val,
        };
      });

    return mappedQuery;
  }

  private move = () => {
    if (!this.rootElement) throw Error('please set a rootElement');

    // 비구조할당시에는 값들이 immutable하게 관리됨, 하지만 . 찍어서놓으면 발동될 때마다 찾아가서 갱신됨.
    // 비구조할당의 특성으로 값이 갱신이 안되어 문제가 생길 여지가 있음.
    const currentPath = window.location.pathname;
    const routerPaths = Object.keys(this.router);
    const { targetPath, mapper } = this.findPath(currentPath, routerPaths);

    const queryStrings = window.location.search.slice(1);
    const queries = this.mapQueryString(queryStrings);

    this.query.param = {};
    this.query.query = [];


    if (targetPath) {

      // child를 비우는 데에도 비용이 든다.
      // this.rootElement.innerHTML = '';
      this.rootElement.replaceChildren(targetPath);

      this.query.param = mapper;
      this.query.query = queries;
    } else {
      this.rootElement.replaceChildren(this.router[404]);
    }
  }

  // 라우트 등록
  set = (route: string, element: Element) => {
    // set은 그냥 그대로 하면 됨
    this.router[route] = element;
  }

  // 라우터 이동
  push = (route: string) => {
    window.history.pushState({ route }, '', route);
    this.move();
  }

  // 라우터가 없는 경우
  setException = (element: Element) => {
    this.router[404] = element;
  }
}

// singleton으로 관리
export default new Router();
