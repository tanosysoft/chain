import d from '@dominant/core';

let timeout = dl => new Promise(r => setTimeout(r, dl));

class Chain extends d.Component {
  static el(type, props, ...children) {
    children = children.map(x => {
      if (typeof x === 'function') {
        let n = d.comment(`chain: ${x.name || 'anonymous'}`);
        n.chainFn = x;

        return n;
      }

      return x;
    });

    return d.el(type, props, ...children);
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

  dl = 100;

  constructor(props) {
    super();
    this.props = props;
  }

  get classes() {
    return d.resolve(this.props.class) || null;
  }

  runScript = async () => {
    let stack = [];
    let queue = [...this.props.children];
    let targetEl = this.el;

    while (stack.length || queue.length) {
      if (!queue.length) {
        let prevState = stack.pop();

        queue = prevState.queue;
        targetEl = prevState.targetEl;

        continue;
      }

      let x = queue.shift();

      if (x instanceof Text) {
        await this.typewrite(targetEl, x.textContent);
        continue;
      }

      if (x instanceof Node) {
        if (x.chainFn) {
          targetEl.append(x);
          await x.chainFn(targetEl, this);

          continue;
        }

        if (x.chainIf) {
          x.chainIfResult = await x.chainIf();

          if (!x.chainIfResult) {
            continue;
          }
        }

        if (
          (x.chainThen && !x.chainThen.chainIfResult) ||
          (x.chainElse && x.chainElse.chainIfResult)
        ) {
          continue;
        }

        if (!x.childNodes || !x.childNodes.length) {
          targetEl.append(x);
          continue;
        }

        stack.push({ targetEl, queue });

        queue = [...x.childNodes];
        x.innerHTML = '';

        targetEl.append(x);
        targetEl = x;

        continue;
      }

      if (typeof x === 'function') {
        await x();
        continue;
      }

      await this.typewrite(targetEl, x);
    }
  };

  typewrite = async (el, x) => {
    x = String(x);

    for (let i = 0; i < x.length; i++) {
      await timeout(this.dl);
      el.append(document.createTextNode(x[i]));
    }
  };

  render = () => this.el = (
    <div
      onAttach={this.runScript}
      class={['Chain', () => this.classes]}
    />
  );
}

let sdl = dl => (_, chain) => chain.dl = dl;
let sec = s => () => timeout(s * 1000);

let w = el => new Promise(resolve => {
  let cursor = <span class="Chain-waitCursor" />;
  el.append(cursor);

  let onClick = () => {
    document.removeEventListener('click', onClick);
    cursor.remove();

    resolve();
  };

  document.addEventListener('click', onClick);
});

export default Chain;
export { sdl, sec, w };
