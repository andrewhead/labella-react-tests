import React from "react";

export interface Dimensions {
  width: number;
  height: number;
}

interface Props {
  /**
   * Class name to assign to each of the text elements.
   */
  className?: string;
  texts: string[];
  onDimensionsAvailable(widts: { [text: string]: Dimensions }): void;
}

/**
 * Rendered once so that the parent can discover the dimensions of the children.
 * If alternative solutions are desired for adaptively sizing 'text' elements, see:
 * * https://blog.logrocket.com/building-size-aware-react-components-b4c37e7d96e7/
 * * https://medium.com/hootsuite-engineering/resizing-react-components-6f911ba39b59
 * * https://medium.com/trabe/measuring-elements-in-react-6bf343b65347
 *
 */
class TextDimensionsCalculator extends React.PureComponent<Props> {
  componentDidMount() {
    if (this._g === null) {
      return;
    }
    const dimensions: { [text: string]: Dimensions } = {};
    this._g.querySelectorAll("text").forEach((t) => {
      if (t.textContent !== null) {
        dimensions[t.textContent] = {
          width: t.getBoundingClientRect().width,
          height: t.getBoundingClientRect().height,
        };
      }
    });
    this.props.onDimensionsAvailable(dimensions);
  }

  render() {
    return (
      <g ref={(ref) => (this._g = ref)}>
        {this.props.texts.map((t, i) => (
          <text className={this.props.className} key={i}>
            {t}
          </text>
        ))}
      </g>
    );
  }

  private _g: SVGGElement | null = null;
}

export default TextDimensionsCalculator;
