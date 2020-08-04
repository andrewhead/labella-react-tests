import React from "react";

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

class Label extends React.PureComponent<Props> {
  render() {
    const { x, y, width, height, text } = this.props;
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect width={width} height={height} />
        <text x={15} y={4} fill="#fff">
          {text}
        </text>
      </g>
    );
  }
}

export default Label;
