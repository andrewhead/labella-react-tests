import { Force, Node, Renderer } from "labella";
import React from "react";
import "./App.css";
import Label from "./Label";
import TextDimensionsCalculator, {
  Dimensions,
} from "./TextDimensionsCalculator";

interface AdjustedNode extends Node {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Props {
  labels: { text: string; site: { x: number; y: number } }[];
  /**
   * Dimensions of the drawing area (doesn't include labels).
   */
  dimensions: Dimensions;
}

interface State {
  textDimensions: { [text: string]: Dimensions } | null;
}

/*
 * Starter source code from view-source: https://twitter.github.io/labella.js/with_text2.html
 * TODO: align the SVG over an absolute existing location on the page
 */
class Diagram extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      textDimensions: null,
    };
    this.onTextDimensionsAvailable = this.onTextDimensionsAvailable.bind(this);
  }

  onTextDimensionsAvailable(dimensions: { [text: string]: Dimensions }) {
    this.setState({ textDimensions: dimensions });
  }

  render() {
    /**
     * First, render just the text elements to get their widths. These widths are needed in order
     * to dynamically layout the elements.
     */
    const { textDimensions } = this.state;
    if (textDimensions === null) {
      return (
        <svg>
          <TextDimensionsCalculator
            className="label__text"
            texts={this.props.labels.map((l) => l.text)}
            onDimensionsAvailable={this.onTextDimensionsAvailable}
          />
        </svg>
      );
    }

    /**
     * Once the text widths are available (in a second render), dynamically determine the positions
     * of the width based on their desired positions, and re-render them in their new positions.
     */
    const nodes = this.props.labels.map(
      (d) =>
        new Node(d.site.x * 2, textDimensions[d.text].width + 4, {
          text: d.text,
        })
    );

    const force = new Force({ minPos: 0, maxPos: 960 });
    force.nodes(nodes).compute();

    let textHeight = 0;
    Object.values(textDimensions).forEach((d) => {
      textHeight = d.height > textHeight ? d.height : textHeight;
    });

    /*
     * Lay out the nodes.
     */
    const renderer = new Renderer({
      layerGap: 60,
      nodeHeight: textHeight,
      direction: "up",
    });
    renderer.layout(nodes);
    const adjustedNodes = nodes as AdjustedNode[];

    /*
     * Determine SVG canvas dimensions dynamically based on what will fit both the drawing area
     * and the labels.
     */
    const minX = Math.min(0, ...adjustedNodes.map((n) => n.x));
    const maxX = Math.max(
      this.props.dimensions.width,
      ...adjustedNodes.map((n) => n.x + n.dx)
    );
    const minY = Math.min(0, ...adjustedNodes.map((n) => n.y));
    const maxY = Math.max(
      this.props.dimensions.height,
      ...adjustedNodes.map((n) => n.y + n.dy)
    );
    const width = maxX - minX;
    const height = maxY - minY;

    return (
      <div className="App">
        <header className="App-header">
          <svg
            viewBox={`${minX} ${minY} ${width} ${height}`}
            width={width}
            height={height}
          >
            <g className="label-layer">
              {adjustedNodes.map((n, i) => (
                <Label
                  key={i}
                  textClassname="label__text"
                  x={n.x - n.dx / 2}
                  y={n.y}
                  width={n.dx}
                  height={n.dy}
                  text={n.data.text}
                />
              ))}
            </g>
            <g className="link-layer">
              {adjustedNodes.map((n, i) => (
                <path key={i} className="link" d={renderer.generatePath(n)} />
              ))}
            </g>
          </svg>
        </header>
      </div>
    );
  }
}

export default Diagram;
