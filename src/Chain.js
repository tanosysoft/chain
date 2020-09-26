import d from '@dominant/core';

let timeout = (chain, dl) => new Promise(r => {
  let done = false;
  let id = setTimeout(r, dl);

  (function monitorFastForwardFlag() {
    if (done) {
      return;
    }

    if (chain.fastForward) {
      clearInterval(id);
      r();

      return;
    }

    requestAnimationFrame(monitorFastForwardFlag);
  })();
});

let getMaxScrollY = () =>
  document.body.scrollHeight - document.documentElement.clientHeight;

let canScrollDown = () => scrollY < getMaxScrollY() - 30;
let scrollToBottom = () => scroll(0, getMaxScrollY());

class Chain extends d.Component {
  static evPropsMap = new WeakMap();

  static el(type, props, ...children) {
    children = children.flat(10).map(x => {
      if (typeof x === 'function') {
        let n = d.comment(`chain: ${x.name || 'anonymous'}`);
        n.chainFn = x;

        return n;
      }

      if (['boolean', 'undefined'].includes(typeof x) || x === null) {
        return '';
      }

      return x;
    });

    let el = d.el(type, props, ...children);

    let evProps = {};

    for (let k of Object.keys(props || {}).filter(k => k.startsWith('on'))) {
      if (['onattach', 'ondetach'].includes(k.toLowerCase())) {
        continue;
      }

      evProps[k] = props[k];
    }

    if (Object.keys(evProps).length) {
      Chain.evPropsMap.set(el, evProps);
    }

    return el;
  }

  static frag({ children }) {
    return children;
  }

  static atom({ children, ...props }) {
    let el = d.el('div', props, ...children);
    el.classList.add('Chain-atom');

    return el;
  }

  static if(predFn, nThen, nElse) {
    let cIf = d.comment('chain: if');
    let cElse = d.comment('chain: else');

    cIf.chainIf = predFn;
    nThen.chainThen = cIf;

    let ret = [cIf, nThen];

    if (nElse) {
      cElse.chainElse = cIf;
      nElse.chainElse = cIf;

      ret.push(cElse, nElse);
    }

    return ret;
  }

  static shield({ children, ...props }) {
    let el = d.el('div', props, ...children);
    el.chainShield = true;

    return el;
  }

  static halt() {
    let n = d.comment('chain: halt');
    n.chainHalt = true;

    return n;
  }

  stack = [];
  queue = [];
  targetEl = null;
  dl = 100;
  progress = {};

  constructor(props) {
    super();
    this.props = props;
  }

  get classes() {
    return d.resolve(this.props.class) || null;
  }

  get autoSave() {
    return Boolean(d.resolve(this.props.autoSave));
  }

  get autoLoad() {
    return Boolean(d.resolve(this.props.autoLoad));
  }

  saveGame = () => {
    localStorage.setItem('chain.savedProgress', JSON.stringify(this.progress));
  };

  loadGame = () => {
    try {
      this.progress =
        JSON.parse(localStorage.getItem('chain.savedProgress') || '{}');

      this.rewind(this.progress.lastCheckpoint);
    } catch (err) {
      console.error(err);
      console.warn('Could not parse chain.savedProgress from local storage.');
    }
  };

  cloneChildren = (
    xs = this.props.children,
    cloneMap = new Map(),
  ) => xs.map(x => {
    if (x instanceof Node) {
      let y = x.cloneNode(false);

      cloneMap.set(x, y);

      for (let k of ['bindings', 'context']) {
        if (x[k]) {
          y[k] = x[k];
        }
      }

      for (let k of Object.keys(x).filter(y => y.startsWith('chain'))) {
        let z = x[k];

        if (z instanceof Node) {
          let w = cloneMap.get(z);

          if (!w) {
            throw new Error(`Prop ${k} references a node not in the cloneMap`);
          }

          y[k] = w;

          continue;
        }

        y[k] = x[k];
      }

      let evListeners = Chain.evPropsMap.get(x);

      for (let [k, v] of Object.entries(evListeners || {})) {
        y.addEventListener(k.slice(2).toLowerCase(), v);
      }

      if (x.childNodes && x.childNodes.length) {
        y.append(...this.cloneChildren([...x.childNodes], cloneMap));
      }

      return y;
    }

    return x;
  });

  labelExists = label => {
    for (let n of this.props.children) {
      if (!(n instanceof Node)) {
        continue;
      }

      let walker = document.createTreeWalker(n, NodeFilter.SHOW_COMMENT);

      for (let n2 = walker.currentNode; n2; n2 = walker.nextNode()) {
        if (n2.chainLabel === label) {
          return true;
        }
      }
    }

    return false;
  };

  rewind = toLabel => {
    this.stack = [];
    this.queue = this.cloneChildren();
    this.targetEl = this.el;

    if (toLabel) {
      let found = false;
      let rootElsToRemove = [];

      while (this.stack.length || this.queue.length) {
        if (!this.queue.length) {
          this.targetEl.remove();

          let prevState = this.stack.pop();

          this.queue = prevState.queue;
          this.targetEl = prevState.targetEl;

          continue;
        }

        let x = this.queue.shift();

        if (x.chainLabel === toLabel) {
          found = x;
          break;
        }

        if (x.childNodes && x.childNodes.length) {
          this.stack.push({
            targetEl: this.targetEl,
            queue: this.queue,
          });

          this.queue = [...x.childNodes];
          x.innerHTML = '';

          this.targetEl.append(x);
          this.targetEl = x;
        }
      }

      if (!found) {
        throw new Error(`Label not found: ${toLabel}`);
      }
    }
  };

  init = () => {
    addEventListener('click', ({ target }) => {
      if (
        this.canFastForward &&
        !['A', 'BUTTON'].includes(target.tagName) &&
        !target.closest('a, button')
      ) {
        this.fastForward = true;
      }
    });

    this.isInitialized = true;
  };

  run = async fromLabel => {
    if (!this.isInitialized) {
      this.init();
    }

    if (fromLabel || !this.autoLoad || !localStorage.getItem('chain.savedProgress')) {
      this.rewind(fromLabel);
    } else {
      this.loadGame();
    }

    while (this.stack.length || this.queue.length) {
      if (!this.queue.length) {
        let prevState = this.stack.pop();

        this.queue = prevState.queue;
        this.targetEl = prevState.targetEl;

        continue;
      }

      let isManuallyScrolling = canScrollDown();

      let x = this.queue.shift();

      if (x instanceof Text) {
        await this.typewrite(this.targetEl, x.textContent);
        continue;
      }

      if (x instanceof Node) {
        if (x.chainHalt) {
          break;
        }

        if (x.chainFn) {
          this.targetEl.append(x);
          let y = await x.chainFn(this, this.targetEl);

          if (typeof y === 'function') {
            y = await y(this, this.targetEl);
          }

          if (typeof y === 'string' || Array.isArray(y) || y instanceof Node) {
            this.stack.push({
              targetEl: this.targetEl,
              queue: this.queue,
            });

            this.queue = [y].flat(10);
          }

          !isManuallyScrolling && scrollToBottom();
          continue;
        }

        if (x.chainIf) {
          x.chainIfResult = Boolean(await x.chainIf());

          if (!x.chainIfResult) {
            continue;
          }
        }

        if (
          (x.chainThen && (x.chainThen.chainIfResult === undefined || !x.chainThen.chainIfResult)) ||
          (x.chainElse && (x.chainElse.chainIfResult === undefined || x.chainElse.chainIfResult))
        ) {
          continue;
        }

        if (x.chainShield) {
          continue;
        }

        if (
          !x.childNodes ||
          !x.childNodes.length ||
          x.classList?.contains('Chain-atom')
        ) {
          this.targetEl.append(x);
          !isManuallyScrolling && scrollToBottom();

          continue;
        }

        this.stack.push({
          targetEl: this.targetEl,
          queue: this.queue,
        });

        this.queue = [...x.childNodes];
        x.innerHTML = '';

        this.targetEl.append(x);
        this.targetEl = x;

        !isManuallyScrolling && scrollToBottom();
        continue;
      }

      if (typeof x === 'function') {
        let y = await x(this, this.targetEl);

        if (typeof y === 'function') {
          await y(this, this.targetEl);
        }

        continue;
      }

      if (['string', 'number'].includes(typeof x)) {
        await this.typewrite(this.targetEl, x);
      }
    }

    this.fastForward = false;
  };

  typewrite = async (el, x) => {
    try {
      this.canFastForward = true;

      x = String(x);

      for (let i = 0; i < x.length; i++) {
        await timeout(this, this.dl);

        let isManuallyScrolling = canScrollDown();

        el.append(document.createTextNode(x[i]));
        !isManuallyScrolling && scrollToBottom();
      }
    } finally {
      this.canFastForward = false;
    }
  };

  render = () => this.el = d.el('div', {
      onAttach: () => this.run(),
      class: ['Chain', () => this.classes],
      model: this,
  });
}

let cancelFastForward = chain => {
  chain.fastForward = false;
};

let clear = chain => {
  for (let n of [...chain.el.childNodes]) {
    if (!n.contains(chain.targetEl)) {
      n.remove();
    }
  }

  let cursor = chain.targetEl;

  while (cursor && cursor !== chain.el.parentElement) {
    while (cursor.childNodes.length > 1) {
      cursor.childNodes[0].remove();
    }

    cursor = cursor.parentElement;
  }
};

let goTo = label => chain => chain.rewind(label);

let label = id => {
  let n = d.comment(`chain: label ${id}`);
  n.chainLabel = id;

  return n;
};

let checkpoint = id => [
  label(id),

  chain => {
    chain.progress.lastCheckpoint = id;

    if (chain.autoSave) {
      chain.saveGame();
    }
  },
];

let sdl = dl => chain => chain.dl = dl;

let sec = s => async chain => {
  chain.canFastForward = true;

  await timeout(chain, s * 1000);
  chain.canFastForward = false;
};

let w = (chain, el) => new Promise(resolve => {
  let cursor = d.el('span', { class: 'Chain-waitCursor' });
  el.append(cursor);

  let onClick = () => {
    removeEventListener('click', onClick);

    cursor.remove();
    scrollToBottom();

    chain.fastForward = false;

    resolve();
  };

  addEventListener('click', onClick);
});

export default Chain;
export { cancelFastForward, clear, d, goTo, label, checkpoint, sdl, sec, w };
