import { Force, Node, Renderer } from "labella";
import React from "react";
import "./App.css";
import Label from "./Label";
import TextDimensionsCalculator, {
  Dimensions,
} from "./TextDimensionsCalculator";

export interface LabelSpec {
  text: string;
  /**
   * Site in the diagram that the label is labeling.
   */
  site: { x: number; y: number };
}

interface AdjustedNode extends Node {
  x: number;
  y: number;
  dx: number;
  dy: number;
  /**
   * Store reference to the renderer that rendered this node, so that it can be acessed again
   * when generating a path for this node.
   */
  renderer: Renderer;
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

    /*
     * Split nodes into those that will appear above and below the diagram. Lay them out separately.
     */
    const { labels } = this.props;
    const { dimensions: drawAreaDimensions } = this.props;
    const topLabels = labels.slice(0, labels.length / 2);
    const bottomLabels = labels.slice(labels.length / 2, labels.length);
    const topNodes = layoutNodes(
      topLabels,
      0,
      drawAreaDimensions.width,
      textDimensions,
      "above-drawing-area"
    );
    const bottomNodes = layoutNodes(
      bottomLabels,
      0,
      drawAreaDimensions.width,
      textDimensions,
      "below-drawing-area"
    );

    /*
     * Determine SVG canvas dimensions dynamically based on what will fit both the drawing area
     * and the labels.
     */
    const allNodes = [...topNodes, ...bottomNodes];
    const minX = Math.min(0, ...allNodes.map((n) => n.x));
    const maxX = Math.max(
      this.props.dimensions.width,
      ...allNodes.map((n) => n.x + n.dx)
    );
    const minY = Math.min(0, ...allNodes.map((n) => n.y));
    const maxY = Math.max(
      this.props.dimensions.height,
      ...allNodes.map((n) => n.y + n.dy)
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
              {allNodes.map((n, i) => (
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
              {allNodes.map((n, i) => (
                <path key={i} className="link" d={n.renderer.generatePath(n)} />
              ))}
            </g>
          </svg>
        </header>
      </div>
    );
  }
}

function layoutNodes(
  labels: LabelSpec[],
  minX: number,
  maxX: number,
  textDimensions: { [text: string]: Dimensions },
  direction: "above-drawing-area" | "below-drawing-area"
): AdjustedNode[] {
  /*
   * Once the text widths are available (in a second render), dynamically determine the positions
   * of the width based on their desired positions, and re-render them in their new positions.
   */
  const nodes = labels.map(
    (d) =>
      new Node(d.site.x, textDimensions[d.text].width + 4, {
        text: d.text,
      })
  );

  let textHeight = Math.max(
    ...Object.values(textDimensions).map((d) => d.height)
  );

  /*
   * Lay out the nodes.
   */
  const force = new Force({ minPos: minX, maxPos: maxX });
  force.nodes(nodes).compute();
  const renderer = new Renderer({
    layerGap: 60,
    nodeHeight: textHeight,
    direction: direction === "above-drawing-area" ? "up" : "down",
  });
  renderer.layout(nodes);

  /*
   * Save a reference to the renderer for generating paths.
   */
  const adjusted = nodes as AdjustedNode[];
  adjusted.forEach((n) => (n.renderer = renderer));
  return adjusted;
}

export default Diagram;
