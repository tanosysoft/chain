import d from '@dominant/core';

class Chain extends d.Component {
  cursor = 0;
  dl = 100;

  constructor(props) {
    super();
    this.props = props;
  }

  onFrame = async () => {
    await new Promise(r => setTimeout(r, this.dl));

    let i = 0;
    let { children } = this.props;

    for (let [ix, x] of children.entries()) {
      let isLastChild = ix >= children.length - 1;

      if (typeof x === 'string') {
        let j = this.cursor - i;

        if (j >= x.length) {
          i += x.length;
          continue;
        }

        this.el.append(document.createTextNode(x[j]));

        if (!isLastChild || j < x.length - 1) {
          this.cursor++;
          requestAnimationFrame(this.onFrame);

          break;
        }

        continue;
      }

      if (i !== this.cursor) {
        i++;
        continue;
      }

      if (x instanceof Node) {
        this.el.append(x);

        this.cursor++;
        requestAnimationFrame(this.onFrame);

        break;
      }
    }
  };

  render = () => this.el = (
    <span onAttach={this.onFrame} />
  );
}

export default Chain;
