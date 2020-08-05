import React from "react";

interface Props {
  textClassname?: string;
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
      <g className="label" transform={`translate(${x}, ${y})`}>
        <rect className="flag" width={width} height={height + 4} />
        <text className={this.props.textClassname} x={2} y={height - 1}>
          {text}
        </text>
      </g>
    );
  }
}

export default Label;
