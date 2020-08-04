import React from "react";

interface Props {
  texts: string[];
  onWidthsAvailable(widts: { [text: string]: number }): void;
}

/**
 * Rendered once so that the parent can discover the dimensions of the children.
 */
class TextWidthCalculator extends React.PureComponent<Props> {
  componentDidMount() {
    if (this._g === null) {
      return;
    }
    const widths: { [text: string]: number } = {};
    this._g.querySelectorAll("text").forEach((t) => {
      if (t.textContent !== null) {
        widths[t.textContent] = t.clientWidth;
      }
    });
    this.props.onWidthsAvailable(widths);
  }

  render() {
    return (
      <g ref={(ref) => (this._g = ref)}>
        {this.props.texts.map((t, i) => (
          <text key={i}>{t}</text>
        ))}
      </g>
    );
  }

  private _g: SVGGElement | null = null;
}

export default TextWidthCalculator;
