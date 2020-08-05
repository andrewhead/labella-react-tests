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
  tex?: string;
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
 * TODO(andrewhead): if the symbol has subsymbols, we may need to add a line to indicate
 * that the label applies to the parent symbol.
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

    const { entities, drawingArea } = this.props;

    /*
     * Filter entities to show a label only the first time an entity appears.
     */
    const filtered = [];
    const texIncluded: { [tex: string]: boolean } = {};
    for (const entity of entities) {
      if (entity.tex !== undefined && texIncluded[entity.tex] !== true) {
        filtered.push(entity);
        texIncluded[entity.tex] = true;
      }
    }

    /*
     * Split entities into two groups: those that will have labels that appear above the figure,
     * and those that will have labels that appear below the figure.
     */
    const entityGroups = splitEntities(filtered, svgTextDimensions);
    const topEntities = entityGroups.first;
    const bottomEntities = entityGroups.second;

    const BOUNDARY_MARGIN = 15;
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

    const FEATURE_MARGIN = 2;

    return (
      <div style={{ position: "absolute", left, top }} className="figure">
        <svg
          viewBox={`${left} ${top} ${width} ${height}`}
          width={width}
          height={height}
        >
          <g className="feature-layer">
            {filtered.map((e) => (
              <rect
                key={e.id}
                className="feature"
                x={e.location.left}
                y={e.location.top}
                width={e.location.width}
                height={e.location.height}
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
          <g className="leader-layer">
            {labels.map((l) => (
              <g key={l.entity.id} className="leader">
                <path
                  key={`${l.entity.id}-leader-background`}
                  className="leader-background"
                  d={createLeader(l, FEATURE_MARGIN)}
                />
                <path
                  key={`${l.entity.id}-leader-line`}
                  className="leader-line"
                  d={createLeader(l, FEATURE_MARGIN)}
                />
              </g>
            ))}
          </g>
        </svg>
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
  drawingArea: BoundingBox,
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
  const force = new Labella.Force({ algorithm: "none", nodeSpacing: 8 });
  force.nodes(nodes).compute();

  boundaryMargin = boundaryMargin || 0;
  const y =
    where === "above"
      ? drawingArea.top - boundaryMargin - labelHeight
      : drawingArea.top + drawingArea.height + boundaryMargin;

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
function createLeader(label: LabelNode, featureMargin?: number) {
  const feature = label.entity.location;
  const { where } = label;

  featureMargin = featureMargin || 0;

  /*
   * The leader leaves the label from the middle of the label.
   */
  const port = {
    x: label.x,
    y: where === "above" ? label.y + label.height : label.y,
  };

  /*
   * The leader connects to the entity (i.e., feature) at a site. The site is chosen in a way
   * that the leader will not pass through the feature. If possible, the leader will be purely
   * vertical; otherwise, if the label doesn't align with the feature, the label will connect
   * on the side of the feature.
   */
  let site;
  if (label.x < feature.left) {
    site = {
      x: feature.left - featureMargin,
      y: feature.top + feature.height / 2,
      side: "left",
    };
  } else if (label.x > feature.left + feature.width) {
    site = {
      x: feature.left + feature.width + featureMargin,
      y: feature.top + feature.height / 2,
      side: "right",
    };
  } else if (where === "above") {
    site = {
      x: feature.left + feature.width / 2,
      y: feature.top - featureMargin,
      side: "top",
    };
  } else {
    site = {
      x: feature.left + feature.width / 2,
      y: feature.top + feature.height + featureMargin,
      side: "bottom",
    };
  }

  /*
   * The leader extends vertically from the label and, if it is not aligned horizontally
   * with the feature, makes an L-shaped bend at the y-position of the feature.
   */
  let midpoint = { x: label.x, y: site.y };

  /*
   * Add an edge to the leader line covering the entire side of the feature on which the leader
   * line connects.
   */
  let featureEdge;
  if (site.side === "left" || site.side === "right") {
    featureEdge = [
      { x: site.x, y: feature.top },
      { x: site.x, y: feature.top + feature.height },
    ];
  } else {
    featureEdge = [
      { x: feature.left, y: site.y },
      { x: feature.left + feature.width, y: site.y },
    ];
  }

  /*
   * Path is expressed in SVG path coordinates:
   * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
   */
  return (
    `M ${port.x}, ${port.y} ` +
    `L ${midpoint.x}, ${midpoint.y} ` +
    `L ${site.x}, ${site.y} ` +
    featureEdge.map((p) => `L ${p.x}, ${p.y}`)
  );
}

export default Figure;