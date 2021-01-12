import 'yfiles/yfiles.css';
import * as _ from 'lodash';
import {
  License,
  GraphComponent,
  IGraph,
  INode,
  Rect,
  Fill,
  ShinyPlateNodeStyle,
  HierarchicLayout,
  Class,
  LayoutExecutor,
  GraphEditorInputMode,
  ShapeNodeStyle,
  Stroke,
  Size,
  TextRenderSupport,
  InteriorLabelModel,
  DefaultLabelStyle,
  SolidColorFill,
  Color,
  ShapeNodeShape,
  PreferredPlacementDescriptor,
  LabelPlacements,
  LabelAngleReferences,
  HierarchicLayoutData,
  LayoutOrientation,
  EdgeSegmentLabelModel,
  EdgeSides,
  ICanvasObjectDescriptor,
  GraphViewerInputMode,
  OrganicLayout,
  PolylineEdgeStyle,
  Bfs,
  TraversalDirection,
  FilteredGraphWrapper,
  BfsLayer
} from 'yfiles'
import { RulerVisual, NodeRenderVisual } from './RulerVisual';
import { RandomGraph } from './randomGraph';
import * as faker from 'faker';
// Tell the library about the license contents
License.value = {
  "company": "You",
  "date": "12/12/2324",
  "distribution": true,
  "domains": [
    "*"
  ],
  "fileSystemAllowed": true,
  "licensefileversion": "1.1",
  "localhost": true,
  "oobAllowed": true,
  "package": "complete",
  "product": "yFiles for HTML",
  "projectname": "My amazing stuff",
  "subscription": "12/12/2324",
  "type": "project",
  "version": "2.3",
  "key": "the-key"
};

// We need to load the yfiles/view-layout-bridge module explicitly to prevent the webpack
// tree shaker from removing this dependency which is needed for 'morphLayout' in this demo.
Class.ensure(LayoutExecutor);


/**
* A simple yFiles application that creates a GraphComponent and enables basic input gestures.
*/
class yApp {
  graph: IGraph;
  graphComponent: GraphComponent;
  filteredGraph: FilteredGraphWrapper;
  nodeFilter: (n: INode) => boolean;
  filteredNodes: INode[];
  initialize() {
    // create a GraphComponent
    this.graphComponent = new GraphComponent('#graphComponent');
    // graphComponent.backgroundGroup.addChild(new NodeRenderVisual(), ICanvasObjectDescriptor.VISUAL);
    const ruler = new RulerVisual('px');
    this.graphComponent.focusGroup.addChild(ruler, ICanvasObjectDescriptor.VISUAL);
    // this.graphComponent.backgroundGroup.addChild(ruler, ICanvasObjectDescriptor.VISUAL);

    // create and configure a default node style
    this.graphComponent.graph.nodeDefaults.style = new ShapeNodeStyle({
      fill: new SolidColorFill(new Color(141, 177, 218)),
      stroke: null,
      shape: ShapeNodeShape.ROUND_RECTANGLE
    });

    // get the IGraph
    this.graph = this.graphComponent.graph;

    // create an input mode
    this.graphComponent.inputMode = new GraphViewerInputMode();
    this.nodeFilter = (n: INode) => {
      return _.includes(this.filteredNodes, n);
    }
    this.filteredGraph = new FilteredGraphWrapper(this.graph, this.nodeFilter, () => true);
    this.graphComponent.graph = this.filteredGraph;

    this.createRandomGraph();
    // this.layout();
    this.showNeighbors();

  }
  createRandomGraph() {
    const raw = RandomGraph.BarabasiAlbert(50);
    const dic = {};
    for (let i = 0; i < raw.nodes.length; i++) {
      const item = raw.nodes[i];
      const node: INode = this.graph.createNode();
      dic[i] = node;
      const tag = {
        id: i,
        label: faker.name.findName(),
        sublabel: faker.address.county()
      }
      node.tag = tag;
      const size1 = TextRenderSupport.measureText(tag.label, this.graph.getLabelDefaults(node).style.font);
      const size2 = TextRenderSupport.measureText(tag.sublabel, this.graph.getLabelDefaults(node).style.font);
      this.graph.setNodeLayout(node, new Rect(node.layout.toPoint(), new Size(Math.max(size1.width, size2.width) + 10, Math.max(size1.height, size2.height) + 30)));
      this.graph.addLabel({
        owner: node,
        text: tag.label,
        style: new DefaultLabelStyle({ textFill: Fill.WHITE, insets: 5 }),
        layoutParameter: InteriorLabelModel.CENTER
      });
      this.graph.addLabel({
        owner: node,
        text: tag.sublabel,
        style: new DefaultLabelStyle({
          textFill: new SolidColorFill(new Color(45, 83, 128, 250)),
          textSize: 10, insets: [7, 0, 3, 0]
        }),
        layoutParameter: InteriorLabelModel.SOUTH
      });
    }
    for (let i = 0; i < raw.edges.length; i++) {
      const item = raw.edges[i];
      const edge = this.graph.createEdge(dic[item.source], dic[item.target]);

      const labelModel = new EdgeSegmentLabelModel({
        autoRotation: false,
        offset: 10
      });
      this.graph.addLabel(edge, `${faker.random.number(100)}%`, labelModel.createParameterFromSource(0, 0.0, EdgeSides.LEFT_OF_EDGE))
    }
  }


  constructor() {
    this.initialize();
  }
  rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h, s, l];
  }
  hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      var hue2rgb = function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }
  shade(fill, factor = 0.7) {
    const color = fill.color
    let [h, s, l] = this.rgbToHsl(color.r, color.g, color.b);
    l += factor;
    const [r, g, b] = this.hslToRgb(h, s, l);
    return new SolidColorFill(r, g, b, color.a)
  }

  showNeighbors() {

    // const ana = new TreeAnalyzer(this.filteredGraph.wrappedGraph);
    // console.log(ana.getRoot().tag.label);

    const root = this.graph.nodes.get(7);
    console.log(root.tag.label)
    this.filteredNodes = [root];
    const parentsCount = 3;
    const childrenCount = 3;

    const children = new Bfs({
      coreNodes: root,
      traversalDirection: TraversalDirection.SUCCESSOR,
      layerCount: childrenCount
    }).run(this.filteredGraph.wrappedGraph);
    for (let i = 0; i < children.layers.size; i++) {
      const layer = children.layers.get(i);
      const nodes = layer.nodes.toArray();
      nodes.forEach(n => { n.tag.index = children.nodeLayerIds.get(n) });
      this.filteredNodes = this.filteredNodes.concat(layer.nodes.toArray());
    }
    const parents = new Bfs({
      coreNodes: root,
      traversalDirection: TraversalDirection.PREDECESSOR,
      layerCount: parentsCount
    }).run(this.filteredGraph.wrappedGraph);
    for (let i = 0; i < parents.layers.size; i++) {
      const layer = parents.layers.get(i);
      const nodes = layer.nodes.toArray();
      nodes.forEach(n => { n.tag.index = parents.nodeLayerIds.get(n) });
      this.filteredNodes = this.filteredNodes.concat(nodes);
    }

    // console.log(children.layers.first().nodes.get(0).tag.label)
    this.filteredGraph.nodePredicateChanged();

    // colorize
    // const m = [Fill.RED, Fill.ORANGE, Fill.GREEN, Fill.YELLOW];
    const m = [0, 0.1, 0.2, 0.3, 0.4,0.5];
    this.filteredGraph.nodes.forEach(n => {
      // n.style.fill = m[n.tag.index];
      n.tag.label = n.tag.index
      this.graph.setStyle(n, new ShapeNodeStyle({
        fill: this.shade(n.style.fill, m[n.tag.index]),
        stroke: null,
        shape: ShapeNodeShape.ROUND_RECTANGLE
      }))
    });

    console.log(this.filteredGraph.nodes.size);
    this.graphComponent.morphLayout(new HierarchicLayout());
  }

  layout() {
    const specs = {
      layout: new OrganicLayout({
        layoutOrientation: LayoutOrientation.BOTTOM_TO_TOP,
        preferredEdgeLength: 180,
        considerNodeSizes: true,
        nodeEdgeOverlapAvoided: true
      }),
      layoutData: null
    }

    this.graphComponent.morphLayout(specs);
  }
  zoomIntoNode(node) {

    const el = document.querySelector("#go");
    el.onclick = () => {
      this.graphComponent.zoomToAnimated(node.layout.toPoint(), 2);
    };
  }
  createManual() {

    // create some nodes
    const node1: INode = this.graph.createNode({

    });
    const node2: INode = this.graph.createNode();
    let size = TextRenderSupport.measureText("yWorks GmbH", this.graph.getLabelDefaults(node1).style.font);
    this.graph.setNodeLayout(node1, new Rect(node1.layout.toPoint(), new Size(size.width + 10, size.height + 30)));
    this.graph.addLabel({
      owner: node1,
      text: 'yWorks GmbH',
      style: new DefaultLabelStyle({ textFill: Fill.WHITE, insets: 5 }),
      layoutParameter: InteriorLabelModel.CENTER
    });
    this.graph.addLabel({
      owner: node2,
      text: 'yFiles for HTML',
      style: new DefaultLabelStyle({ textFill: Fill.WHITE, insets: 5 }),
      layoutParameter: InteriorLabelModel.CENTER
    });
    size = TextRenderSupport.measureText("yFiles for HTML", this.graph.getLabelDefaults(node1).style.font);
    this.graph.setNodeLayout(node2, new Rect(node1.layout.toPoint(), new Size(size.width + 10, size.height + 30)));
    this.graph.addLabel({
      owner: node1,
      text: 'Germany',
      layoutParameter: InteriorLabelModel.SOUTH,
      style: new DefaultLabelStyle({
        textFill: new SolidColorFill(new Color(45, 83, 128, 250)),
        textSize: 10, insets: [7, 0, 3, 0]
      })
    });
    // create an edge
    const edge = this.graph.createEdge(node1, node2);
    const atSourceDescriptor = new PreferredPlacementDescriptor({
      placeAlongEdge: LabelPlacements.AT_SOURCE,
      sideOfEdge: LabelPlacements.LEFT_OF_EDGE,
      angleReference: LabelAngleReferences.RELATIVE_TO_EDGE_FLOW
    })
    const layoutData = new HierarchicLayoutData({
      edgeLabelPreferredPlacement: atSourceDescriptor
    });
    const labelModel = new EdgeSegmentLabelModel({
      autoRotation: false,
      offset: 10
    });
    this.graph.addLabel(edge, "22%", labelModel.createParameterFromSource(0, 0.0, EdgeSides.LEFT_OF_EDGE))
    this.graph.setStyle(edge, new PolylineEdgeStyle({
      stroke: Stroke.SILVER
    }))


  }
}

new yApp();
