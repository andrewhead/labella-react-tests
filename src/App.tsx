import { Force, Node, Renderer } from "labella";
import React from "react";
import "./App.css";
import TextWidthCalculator from "./TextWidthCalculator";

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
  textWidths: { [text: string]: number } | null;
}

/*
 * Some potentially useful references for libraries for adaptively sizing 'text' elements:
 * * https://blog.logrocket.com/building-size-aware-react-components-b4c37e7d96e7/
 * * https://medium.com/hootsuite-engineering/resizing-react-components-6f911ba39b59
 * * https://medium.com/trabe/measuring-elements-in-react-6bf343b65347
 *
 * Starter source code from view-source:https://twitter.github.io/labella.js/with_text2.html
 */
class App extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      textWidths: null,
    };
    this.onWidthsAvailable = this.onWidthsAvailable.bind(this);
  }

  onWidthsAvailable(widths: { [text: string]: number }) {
    this.setState({ textWidths: widths });
  }

  render() {
    const { textWidths } = this.state;
    if (textWidths === null) {
      return (
        <svg>
          <TextWidthCalculator
            texts={this.props.labels.map((l) => l.text)}
            onWidthsAvailable={this.onWidthsAvailable}
          />
        </svg>
      );
    }

    const nodes = this.props.labels.map(
      (d) => new Node(d.x * 2.5, textWidths[d.text], { text: d.text })
    );

    const force = new Force({ minPos: 0, maxPos: 960 });
    force.nodes(nodes).compute();

    const renderer = new Renderer({
      layerGap: 60,
      nodeHeight: 12,
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
                <g key={i} transform={`translate(${n.x - n.dx / 2}, ${n.y})`}>
                  <rect className="flag" width={n.dx} height={n.dy} />
                  <text x={0} y={15} fill="#fff">
                    {n.data.text}
                  </text>
                </g>
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
