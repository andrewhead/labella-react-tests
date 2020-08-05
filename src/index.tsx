import React from "react";
import ReactDOM from "react-dom";
import Figure, { Entity } from "./Diagram";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

const entities: Entity[] = [
  {
    id: "1",
    tex: "s_t^{(j)}",
    label: "output of layer",
    location: { left: 17, top: 12, width: 25, height: 29 },
  },
  {
    id: "2",
    tex: "j",
    label: "layer",
    location: { left: 32, top: 14, width: 8, height: 13 },
  },
  {
    id: "3",
    tex: "t",
    label: "token",
    location: { left: 27, top: 31, width: 5, height: 9 },
  },
  {
    id: "4",
    tex: "LN",
    label: "layer normalization",
    location: { left: 74, top: 20, width: 30, height: 14 },
  },
  {
    id: "5",
    tex: "j",
    label: "layer",
    location: { left: 128, top: 14, width: 7, height: 13 },
  },
  {
    id: "6",
    tex: "t",
    label: "token",
    location: { left: 122, top: 31, width: 6, height: 10 },
  },
  {
    id: "7",
    tex: "T^{(j)}",
    label: "jth self-attention layer",
    location: { left: 187, top: 15, width: 32, height: 19 },
  },
  {
    id: "8",
    tex: "T",
    label: "token representations",
    location: { left: 187, top: 20, width: 14, height: 14 },
  },
  {
    id: "9",
    tex: "j",
    label: "layer",
    location: { left: 206, top: 15, width: 8, height: 14 },
  },
  {
    id: "10",
    tex: "t",
    label: "token",
    location: { left: 238, top: 31, width: 5, height: 9 },
  },
  {
    id: "11",
    tex: "j",
    label: "layer",
    location: { left: 243, top: 14, width: 7, height: 13 },
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
