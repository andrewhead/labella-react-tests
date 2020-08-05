import Labella from "labella";
import React from "react";
import "./App.css";
import Label from "./Label";
import SvgTextRenderer, { Dimensions } from "./SvgTextRenderer";

export type Side = "above" | "below";

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  /**
   * Bounding box of feature in the diagram that is being labeled.
   */
  location: BoundingBox;
  /**
   * Short name for the entity.
   */
  label: string;
}

interface LabelNode {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  entity: Entity;
  where: Side;
}

interface Props {
  entities: Entity[];
  /**
   * Dimensions of the drawing area (before labels are added).
   */
  drawingArea: BoundingBox;
}

interface State {
  svgTextDimensions: { [text: string]: Dimensions } | null;
}

/*
 * Figure with label overlays on top of entities.
 * TODO(andrewhead): only label the first instance
 */
class Figure extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      svgTextDimensions: null,
    };
    this.onSvgTextDimensionsComputed = this.onSvgTextDimensionsComputed.bind(
      this
    );
  }

  onSvgTextDimensionsComputed(dimensions: { [text: string]: Dimensions }) {
    this.setState({ svgTextDimensions: dimensions });
  }

  render() {
    /*
     * First, render just the text elements to get their widths. These widths are needed in order
     * to dynamically layout the elements.
     */
    const { svgTextDimensions } = this.state;
    if (svgTextDimensions === null) {
      return (
        <svg>
          <SvgTextRenderer
            textClassName="label__text"
            texts={this.props.entities.map((l) => l.label)}
            onTextDimensionsComputed={this.onSvgTextDimensionsComputed}
          />
        </svg>
      );
    }

    /*
     * Split entities into two groups: those that will have labels that appear above the figure,
     * and those that will have labels that appear below the figure.
     */
    const { entities, drawingArea } = this.props;
    const entityGroups = splitEntities(entities, svgTextDimensions);
    const topEntities = entityGroups.first;
    const bottomEntities = entityGroups.second;

    const BOUNDARY_MARGIN = 5;
    const LABEL_PADDING = 2;
    const topLabels = createLabels(
      topEntities,
      svgTextDimensions,
      drawingArea,
      "above",
      BOUNDARY_MARGIN,
      LABEL_PADDING
    );
    const bottomLabels = createLabels(
      bottomEntities,
      svgTextDimensions,
      drawingArea,
      "below",
      BOUNDARY_MARGIN,
      LABEL_PADDING
    );

    /*
     * Size the SVG canvas dynamically so that all labels will be showing.
     */
    const labels = [...topLabels, ...bottomLabels];
    const left = Math.min(0, ...labels.map((l) => l.x));
    const right = Math.max(
      drawingArea.width,
      ...labels.map((l) => l.x + l.width)
    );
    const top = Math.min(0, ...labels.map((l) => l.y));
    const bottom = Math.max(
      drawingArea.height,
      /*
       * TODO(andrewhead): fix up this factor of '4', parameterize so that it's one source of
       * data for this margin shared in all places.
       */
      ...labels.map((l) => l.y + l.height + 4)
    );
    const width = right - left;
    const height = bottom - top;

    return (
      <div className="App">
        <header className="App-header">
          <svg
            viewBox={`${left} ${top} ${width} ${height}`}
            width={width}
            height={height}
          >
            <g className="feature-layer">
              {labels.map((l) => (
                <rect
                  key={l.entity.id}
                  className="feature"
                  x={l.entity.location.left}
                  y={l.entity.location.top}
                  width={l.entity.location.width}
                  height={l.entity.location.height}
                />
              ))}
            </g>
            <g className="label-layer">
              {labels.map((l) => (
                <Label
                  key={l.entity.id}
                  textClassname="label__text"
                  x={l.x - l.width / 2}
                  y={l.y}
                  width={l.width}
                  height={l.height}
                  text={l.text}
                  labelPadding={LABEL_PADDING}
                />
              ))}
            </g>
            <g className="link-layer">
              {labels.map((l) => (
                <path key={l.entity.id} className="link" d={createLeader(l)} />
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
function splitEntities(
  labels: Entity[],
  textDimensions: { [text: string]: Dimensions }
) {
  const totalWidth = labels.reduce((width, label) => {
    return width + textDimensions[label.label].width;
  }, 0);
  /*
   * Sort labels from those that refer to features the highest up in the diagram to those the
   * lowest down in the diagram.
   */
  const sorted = [...labels].sort(
    (l1, l2) => l1.location.top - l2.location.top
  );
  let sumWidth = 0;
  let splitIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    sumWidth += textDimensions[sorted[i].label].width;
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

function createLabels(
  entities: Entity[],
  textDimensions: { [text: string]: Dimensions },
  drawingArea: Dimensions,
  where: Side,
  boundaryMargin?: number | undefined,
  labelPadding?: number | undefined
): LabelNode[] {
  const entitiesById = entities.reduce((byId, entity) => {
    byId[entity.id] = entity;
    return byId;
  }, {} as { [id: string]: Entity });

  /*
   * All labels share the same height, which is the height of the tallest label.
   */
  const labelHeight =
    Math.max(...Object.values(textDimensions).map((d) => d.height)) +
    (labelPadding || 0) * 2;

  /*
   * Horizontally position the nodes using Labella.js' force-directed layout algorithm. Set
   * algorithm to 'none' to disable the use of multiple layers, because:
   * * multiple layers might decrease readability of labels
   * * only a very simple algorithm is used to generate L-shaped leader lines elsewhere in the code.
   *   This algorithm does not support routing leaders around other labels.
   *
   * Unlike in the Labella.js examples, the Renderer class is not used in this code, because the
   * renderer only supports Bezier leader lines, and assumes that labels should be positioned
   * vertically relative to a heightless timeline. That said, the 'Force' helper is still useful
   * for horizontally positioning labels, before using custom code for leader lines and vertically
   * positioning the labels.
   */
  const nodes = entities.map((e) => {
    const idealX = e.location.left + e.location.width / 2;
    const labelWidth = textDimensions[e.label].width + (labelPadding || 0) * 2;
    return new Labella.Node(idealX, labelWidth, { entityId: e.id });
  });
  const force = new Labella.Force({ algorithm: "none" });
  force.nodes(nodes).compute();

  boundaryMargin = boundaryMargin || 0;
  const y =
    where === "above"
      ? -boundaryMargin - labelHeight
      : drawingArea.height + boundaryMargin;

  return nodes.map((n) => ({
    x: n.currentPos,
    y,
    width: n.width,
    height: labelHeight,
    entity: entitiesById[n.data.entityId],
    text: entitiesById[n.data.entityId].label,
    where: where,
  }));
}

/**
 * Generate L-shaped leaders, which seem to have a good balance between usability and user
 * preferability. For a review of the terms used in this function, and of the justification for
 * L-shaped leaders, see Barth et al., "On the readability of leaders in boundary labeling", 2019.
 */
function createLeader(label: LabelNode) {
  const feature = label.entity.location;
  const { where } = label;

  /*
   * Determine the point where the leader connects to the entity (i.e., feature). Leader should
   * not occlude the feature. There should only be a bend in the line if the label is not
   * vertically aligned to the feature.
   */
  let site;
  if (label.x < feature.left) {
    site = { x: feature.left, y: feature.top + feature.height / 2 };
  } else if (label.x > feature.left + feature.width) {
    site = {
      x: feature.left + feature.width,
      y: feature.top + feature.height / 2,
    };
  } else {
    site = {
      x: label.x,
      y: where === "above" ? feature.top : feature.top + feature.height,
    };
  }

  /*
   * The leader extends vertically from the label, and bends at the y-position of the feature.
   */
  let midpoint = { x: label.x, y: site.y };

  /*
   * The leader leaves the label from the middle of the label.
   */
  const port = {
    x: label.x,
    y: where === "above" ? label.y + label.height : label.y,
  };

  /*
   * Path is expressed in SVG path coordinates:
   * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
   */
  return (
    `M ${port.x}, ${port.y}` +
    `L ${midpoint.x}, ${midpoint.y}` +
    `L ${site.x}, ${site.y}`
  );
}

export default Figure;
