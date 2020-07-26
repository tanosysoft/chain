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

  dl = 100;

  constructor(props) {
    super();
    this.props = props;
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

    while (x.length) {
      await timeout(this.dl);

      el.append(document.createTextNode(x[0]));
      x = x.slice(1);
    }
  };

  render = () => this.el = (
    <div onAttach={this.runScript} class="Chain" />
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
