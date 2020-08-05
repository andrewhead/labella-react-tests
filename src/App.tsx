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
  labels: { x: number; text: string }[];
}

interface State {
  textDimensions: { [text: string]: Dimensions } | null;
}

/*
 * Starter source code from view-source:https://twitter.github.io/labella.js/with_text2.html
 */
class App extends React.PureComponent<Props, State> {
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
    const { textDimensions: textDimensions } = this.state;
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
        new Node(d.x * 2, textDimensions[d.text].width + 4, { text: d.text })
    );

    const force = new Force({ minPos: 0, maxPos: 960 });
    force.nodes(nodes).compute();

    let textHeight = 0;
    Object.values(textDimensions).forEach((d) => {
      textHeight = d.height > textHeight ? d.height : textHeight;
    });
    const renderer = new Renderer({
      layerGap: 60,
      nodeHeight: textHeight,
    });

    renderer.layout(nodes);
    const adjustedNodes = nodes as AdjustedNode[];

    const svgWidth = 800;
    const svgHeight = 220;

    return (
      <div className="App">
        <header className="App-header">
          <svg width={svgWidth} height={svgHeight}>
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

export default App;
