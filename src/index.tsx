import React from "react";
import ReactDOM from "react-dom";
import Diagram, { LabelSpec } from "./Diagram";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

const LABELS: LabelSpec[] = [
  { text: "Snape", site: { x: 9, y: 1 } },
  { text: "Lily", site: { x: 30, y: 0 } },
  { text: "Ron", site: { x: 61, y: 1 } },
  { text: "James", site: { x: 87, y: 0 } },
  { text: "Draco", site: { x: 155, y: 1 } },
  { text: "Neville", site: { x: 210, y: 0 } },
  { text: "Harry", site: { x: 211, y: 1 } },
  { text: "Hermione", site: { x: 259, y: 0 } },
  { text: "Hagrid", site: { x: 336, y: 1 } },
  { text: "Voldemort", site: { x: 361, y: 0 } },
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
