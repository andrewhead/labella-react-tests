import { Force, Node, Renderer } from "labella";
import React from "react";
import "./App.css";
import logo from "./logo.svg";

interface AdjustedNode extends Node {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

function App() {
  const nodes = [
    new Node(1, 50),
    new Node(2, 50),
    new Node(3, 50),
    new Node(3, 50),
    new Node(3, 50),
    new Node(304, 50),
    new Node(454, 50),
    new Node(454, 50),
    new Node(454, 50),
    new Node(804, 50),
    new Node(804, 50),
    new Node(804, 50),
    new Node(804, 50),
    new Node(854, 50),
    new Node(854, 50),
  ];

  const force = new Force({ minPos: 0, maxPos: 960 });
  force.nodes(nodes).compute();

  const renderer = new Renderer({
    layerGap: 60,
    nodeHeight: 12,
  });

  renderer.layout(nodes);
  const adjustedNodes = nodes as AdjustedNode[];

  const svgWidth = 1000;
  const svgHeight = 112;

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <svg width={svgWidth} height={svgHeight}>
          <g className="label-layer">
            {adjustedNodes.map((n, i) => (
              <rect
                key={i}
                className="flag"
                x={n.x - n.dx / 2}
                y={n.y}
                width={n.dx}
                height={n.dy}
              />
            ))}
          </g>
          <g className="link-layer">
            {adjustedNodes.map((n, i) => (
              <path className="link" d={renderer.generatePath(n)} />
            ))}
          </g>
        </svg>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
