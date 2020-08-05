import React from "react";
import ReactDOM from "react-dom";
import Diagram, { LabelData } from "./Diagram";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

const LABELS: LabelData[] = [
  { text: "Snape", feature: { x: 9, y: 10, width: 10, height: 10 } },
  { text: "Lily", feature: { x: 30, y: 0, width: 10, height: 10 } },
  { text: "Ron", feature: { x: 61, y: 10, width: 10, height: 10 } },
  { text: "James", feature: { x: 87, y: 0, width: 10, height: 10 } },
  { text: "Draco", feature: { x: 155, y: 10, width: 10, height: 10 } },
  { text: "Neville", feature: { x: 210, y: 0, width: 10, height: 10 } },
  { text: "Harry", feature: { x: 211, y: 10, width: 10, height: 10 } },
  { text: "Hermione", feature: { x: 259, y: 0, width: 10, height: 10 } },
  { text: "Hagrid", feature: { x: 336, y: 10, width: 10, height: 10 } },
  { text: "Voldemort", feature: { x: 361, y: 0, width: 10, height: 10 } },
];

ReactDOM.render(
  <React.StrictMode>
    <Diagram labels={LABELS} dimensions={{ width: 400, height: 300 }} />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
