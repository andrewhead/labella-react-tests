import { Force, Node, Renderer } from "labella";
import React from "react";
import "./App.css";
import Label from "./Label";
import TextDimensionsCalculator, {
  Dimensions,
} from "./TextDimensionsCalculator";

export type Side = "above" | "below";

export interface Feature {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelData {
  /**
   * Bounding box of feature in the diagram that is being labeled.
   */
  feature: Feature;
  /**
   * Text to show in the label.
   */
  text: string;
}

interface AdjustedNode extends Node {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Props {
  labels: LabelData[];
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
    const labelGroups = splitLabels(labels, textDimensions);
    const topLabels = labelGroups.first;
    const bottomLabels = labelGroups.second;

    const topNodes = createNodes(topLabels, textDimensions, "above");
    const bottomNodes = createNodes(bottomLabels, textDimensions, "below");

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
            <g className="feature-layer">
              {allNodes.map((n, i) => (
                <rect
                  key={i}
                  className="feature"
                  x={n.data.feature.x}
                  y={n.data.feature.y}
                  width={n.data.feature.width}
                  height={n.data.feature.height}
                />
              ))}
            </g>
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
                <path
                  key={i}
                  className="link"
                  d={generateLeader(n, n.data.feature, n.data.side)}
                />
              ))}
            </g>
          </svg>
        </header>
      </div>
    );
  }
}

/**
 * Split labels into two lists of roughly equal total width. The first list's labels will all be
 * above the labels in the second list.
 */
function splitLabels(
  labels: LabelData[],
  textDimensions: { [text: string]: Dimensions }
) {
  const totalWidth = labels.reduce((width, label) => {
    return width + textDimensions[label.text].width;
  }, 0);
  /*
   * Sort labels from those that refer to features the highest up in the diagram to those the
   * lowest down in the diagram.
   */
  const sorted = [...labels].sort((l1, l2) => l1.feature.y - l2.feature.y);
  let sumWidth = 0;
  let splitIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    sumWidth += textDimensions[sorted[i].text].width;
    if (sumWidth > totalWidth / 2) {
      splitIndex = i;
      break;
    }
  }
  return {
    first: sorted.slice(0, splitIndex),
    second: sorted.slice(splitIndex, labels.length),
  };
}

function createNodes(
  labels: LabelData[],
  textDimensions: { [text: string]: Dimensions },
  side: Side
): AdjustedNode[] {
  /*
   * Once the text widths are available (in a second render), dynamically determine the positions
   * of the width based on their desired positions, and re-render them in their new positions.
   */
  const nodes = labels.map(
    (label) =>
      new Node(
        /*
         * Ideal position for each label is centered over the feature.
         */
        label.feature.x + label.feature.width / 2,
        /*
         * Add a bit of padding on either side of the label.
         */
        textDimensions[label.text].width + 4,
        {
          /*
           * Associate data with this node that can be used for rendering it:
           * * text: the text to place in the node
           * * side: which side of the diagram the label will be placed on
           * * feature: the feature in the diagram the label is labeling
           */
          text: label.text,
          feature: label.feature,
          side,
        }
      )
  );

  let textHeight = Math.max(
    ...Object.values(textDimensions).map((d) => d.height)
  );

  /*
   * Lay out the nodes. Do not allow multiple layers, as it will intefere with us providing
   * legible labeling on the boundaries and using simple computations to compute the leader lines.
   */
  const force = new Force({ algorithm: "none" });
  force.nodes(nodes).compute();
  const renderer = new Renderer({
    layerGap: 60,
    nodeHeight: textHeight,
    direction: side === "above" ? "up" : "down",
  });
  renderer.layout(nodes);
  return nodes as AdjustedNode[];
}

/**
 * Generate L-shaped leaders, which seem to have a good balance between usability and user
 * preferability. See Barth et al. 2019, "On the readability of leaders in boundary labeling".
 */
function generateLeader(label: AdjustedNode, feature: Feature, side: Side) {
  /*
   * Label port is centered horizontally with respect to label.
   */
  const portX = label.x;
  let site;
  if (portX < feature.x) {
    site = { x: feature.x, y: feature.y + feature.height / 2 };
  } else if (portX > feature.x + feature.width) {
    site = { x: feature.x + feature.width, y: feature.y + feature.height / 2 };
  } else {
    site = {
      x: portX,
      y: side === "above" ? feature.y : feature.y + feature.height,
    };
  }
  let midpoint = { x: portX, y: site.y };
  const port = {
    x: portX,
    y: side === "above" ? label.y + label.dy : label.y,
  };
  const pathPoints = [port, midpoint, feature];

  /**
   * TODO---stop at the edge of the feature. Feature should have bounding box.
   */
  return (
    `M ${port.x}, ${port.y}` +
    `L ${midpoint.x}, ${midpoint.y}` +
    `L ${site.x}, ${site.y}`
  );
}

export default Diagram;
