import React from "react";
import ReactDOM from "react-dom";
import Figure, { Entity } from "./Diagram";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

const entities: Entity[] = [
  {
    id: "1",
    label: "Snape",
    location: { left: 9, top: 50, width: 10, height: 10 },
  },
  {
    id: "2",
    label: "Lily",
    location: { left: 30, top: 0, width: 10, height: 10 },
  },
  {
    id: "3",
    label: "Ron",
    location: { left: 61, top: 50, width: 10, height: 10 },
  },
  {
    id: "4",
    label: "James",
    location: { left: 87, top: 0, width: 10, height: 10 },
  },
  {
    id: "5",
    label: "Draco",
    location: { left: 155, top: 50, width: 10, height: 10 },
  },
  {
    id: "6",
    label: "Neville",
    location: { left: 210, top: 0, width: 10, height: 10 },
  },
  {
    id: "7",
    label: "Harry",
    location: { left: 211, top: 50, width: 10, height: 10 },
  },
  {
    id: "8",
    label: "Hermione",
    location: { left: 259, top: 0, width: 10, height: 10 },
  },
  {
    id: "9",
    label: "Hagrid",
    location: { left: 336, top: 50, width: 10, height: 10 },
  },
  {
    id: "10",
    label: "Voldemort",
    location: { left: 361, top: 0, width: 10, height: 10 },
  },
];

const left = Math.min(...entities.map((e) => e.location.left));
const top = Math.min(...entities.map((e) => e.location.top));
const right = Math.max(
  ...entities.map((e) => e.location.left + e.location.width)
);
const bottom = Math.max(
  ...entities.map((e) => e.location.top + e.location.height)
);
const width = right - left;
const height = bottom - top;

ReactDOM.render(
  <React.StrictMode>
    <Figure entities={entities} drawingArea={{ left, top, width, height }} />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
