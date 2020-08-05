import React from "react";

interface Props {
  textClassname?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  labelPadding?: number;
}

class Label extends React.PureComponent<Props> {
  render() {
    const { x, y, width, height, text, labelPadding } = this.props;
    return (
      <g className="label" transform={`translate(${x}, ${y})`}>
        <rect className="label__background" width={width} height={height} />
        <text
          className={this.props.textClassname}
          x={2}
          y={height - (labelPadding || 0) * 2}
        >
          {text}
        </text>
      </g>
    );
  }
}

export default Label;
