import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

const LABELS = [
  { x: 9, text: "Snape" },
  { x: 30, text: "Lily" },
  { x: 61, text: "Ron" },
  { x: 87, text: "James" },
  { x: 155, text: "Draco" },
  { x: 210, text: "Neville" },
  { x: 211, text: "Harry" },
  { x: 259, text: "Hermione" },
  { x: 336, text: "Hagrid" },
  { x: 361, text: "Voldemort" },
];

ReactDOM.render(
  <React.StrictMode>
    <App labels={LABELS} />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
