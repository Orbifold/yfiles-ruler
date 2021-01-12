import { HtmlCanvasVisual, Point, IBoundsProvider, IHitTestable, IVisibilityTestable, } from 'yfiles';

/**
* @class demo.RulerVisual
* @implements {yfiles.view.ICanvasObjectDescriptor}
* @implements {yfiles.view.IVisualCreator}
*/
export class RulerVisual extends HtmlCanvasVisual {

  // the currently displayed scale
  private scale: string;

  // change the scale factor to display different scales, e.g. pixels, cm, ...
  scaleFactor: number

  // size of the ruler
  rulerSize: number

  // tick settings for labeled ticks
  labeledTickSpacing: number
  labeledTickSize: number

  // tick settings for major ticks
  majorTickSpacing: number
  majorTickSize: number

  // tick settings for minor ticks
  minorTickSpacing: number
  minorTickSize: number

  // the factor for tick spacing on different zoom levels
  tickSpacingFactor: number

  // ruler background color
  backgroundColor: string

  // label font size
  fontSize: number


  constructor(scale) {


    super();
    scale = scale || "px";
    this.rulerSize = 15;
    this.labeledTickSize = 10;
    this.majorTickSize = 5;
    this.minorTickSize = 3;
    this.tickSpacingFactor = 1;
    this.fontSize = 10;
    this.backgroundColor = "#E6E6E6";
    switch (scale) {
      case "in":
        this.scaleFactor = 72;
        this.minorTickSpacing = 0.2;
        this.majorTickSpacing = 1;
        this.labeledTickSpacing = 2;
        break;
      case "cm":
        this.scaleFactor = 595 / 21;
        this.minorTickSpacing = 2;
        this.majorTickSpacing = 10;
        this.labeledTickSpacing = 20;
        break;
      default:
        // px
        this.scaleFactor = 1;
        this.minorTickSpacing = 20;
        this.majorTickSpacing = 100;
        this.labeledTickSpacing = 200;
        break;
    }

    this.scale = scale;
  }

  /**
   * @param {yfiles.view.IRenderContext} renderContext The render context of the <api-link data-type="yfiles.view.CanvasComponent"></api-link>
   * @param {Object} ctx The HTML5 Canvas context to use for rendering.
   */
  paint(renderContext, ctx) {
    const canvas = renderContext.canvasComponent;
    const viewPoint = canvas.viewPoint;
    const viewPort = canvas.viewport;
    const scaling = 1 / canvas.zoom;



    ctx.translate(viewPoint.x, viewPoint.y);
    ctx.scale(scaling, scaling);

    const size = this.rulerSize;
    const width = canvas.size.width + 10;
    const height = canvas.size.height + 10;

    ctx.fillStyle = this.backgroundColor;
    ctx.font = this.fontSize + "px Arial";

    // draw horizontal ruler
    ctx.fillRect(0, 0, width, size);

    // draw vertical ruler
    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.fillRect(0, 0, -canvas.size.height, size);
    ctx.restore();

    // draw the ruler edge
    ctx.srokeStyle = "#e7e7e7";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(size, size);
    ctx.lineTo(width, size);
    ctx.moveTo(size, size);
    ctx.lineTo(size, height);
    ctx.stroke();

    // adjust the tick spacing depending on the zoom level
    // this might also be adjusted dynamically by measuring the actual spacing in pixels between between the ticks
    if (canvas.zoom <= 0.05) {
      this.tickSpacingFactor = 8;
    } else if (canvas.zoom <= 0.1) {
      this.tickSpacingFactor = 4;
    } else if (canvas.zoom <= 0.2) {
      this.tickSpacingFactor = 2;
    } else if (canvas.zoom <= 1) {
      this.tickSpacingFactor = 1;
    } else if (canvas.zoom <= 2) {
      this.tickSpacingFactor = 0.5;
    } else if (canvas.zoom <= 3) {
      this.tickSpacingFactor = 0.25;
    }

    const scaledLabeledTickSpacing = this.labeledTickSpacing * this.scaleFactor;
    const scaledMajorTickSpacing = this.majorTickSpacing * this.scaleFactor;
    const scaledMinorTickSpacing = this.minorTickSpacing * this.scaleFactor;
    this.drawHorizontalTicks(renderContext, ctx, scaledLabeledTickSpacing, scaledMajorTickSpacing, scaledMinorTickSpacing);
    this.drawVerticalTicks(renderContext, ctx, scaledLabeledTickSpacing, scaledMajorTickSpacing, scaledMinorTickSpacing);

    ctx.fillStyle = this.backgroundColor;

    // draw corner
    ctx.fillStyle = "#E6E6E6";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000";
    ctx.fillText(this.scale, 1, size - 5);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.stroke();
  }

  drawHorizontalTicks(renderContext, ctx, labeledTickSpacing, majorTickSpacing, minorTickSpacing) {
    const canvas = renderContext.canvasComponent;
    const viewPoint = canvas.viewPoint;
    const viewPort = canvas.viewport;
    const size = this.rulerSize;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";

    ctx.beginPath();

    let tickNr = Math.floor(viewPort.x / minorTickSpacing);
    const worldX = tickNr * minorTickSpacing;
    let viewX = canvas.toViewCoordinates(new Point(worldX, 0)).x;

    let tickSize;

    while (viewX <= canvas.size.width + 10) {

      if (tickNr % (10 * this.tickSpacingFactor) === 0) {
        tickSize = this.labeledTickSize;
        ctx.fillText(this.getLabelText(tickNr, minorTickSpacing), viewX + 4, size - 3);
      } else if (tickNr % (5 * this.tickSpacingFactor) === 0) {
        tickSize = this.majorTickSize;
      } else {
        tickSize = this.minorTickSize;
      }

      if (tickNr % this.tickSpacingFactor === 0) {
        ctx.moveTo(viewX, 0);
        ctx.lineTo(viewX, tickSize);
      }

      viewX += minorTickSpacing * canvas.zoom;
      tickNr++;
    }

    ctx.stroke();
  }

  getLabelText(tickNr, minorTickSpacing) {
    const exactTick = tickNr * minorTickSpacing / this.scaleFactor;
    const precisionOneTick = Math.round(exactTick * 10) / 10;
    return precisionOneTick.toString();
  }

  drawVerticalTicks(renderContext, ctx, labeledTickSpacing, majorTickSpacing, minorTickSpacing) {
    const canvas = renderContext.canvasComponent;
    const viewPoint = canvas.viewPoint;
    const viewPort = canvas.viewport;
    const size = this.rulerSize;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#000";

    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.beginPath();

    let tickNr = Math.floor(viewPort.y / minorTickSpacing);
    const worldY = tickNr * minorTickSpacing;
    let viewY = canvas.toViewCoordinates(new Point(0, worldY)).y;

    let tickSize;

    while (viewY <= canvas.size.height + 10) {

      if (tickNr % (10 * this.tickSpacingFactor) === 0) {
        tickSize = this.labeledTickSize;
        ctx.fillText(this.getLabelText(tickNr, minorTickSpacing), -viewY + 4, size - 3);
      } else if (tickNr % (5 * this.tickSpacingFactor) === 0) {
        tickSize = this.majorTickSize;
      } else {
        tickSize = this.minorTickSize;
      }

      if (tickNr % this.tickSpacingFactor === 0) {
        ctx.moveTo(-viewY, 0);
        ctx.lineTo(-viewY, tickSize);
      }

      viewY += minorTickSpacing * canvas.zoom;
      tickNr++;
    }

    ctx.stroke();
    ctx.restore();
  }

  /**
   * @param {Object} forUserObject the user object to query the bounds for
   * @returns {yfiles.view.IBoundsProvider}
   */
  getBoundsProvider(forUserObject) {
    return IBoundsProvider.UNBOUNDED;
  }

  /**
   * @param {Object} forUserObject the user object to do the hit testing for
   * @returns {yfiles.input.IHitTestable}
   */
  getHitTestable(forUserObject) {
    return IHitTestable.NEVER;
  }

  /**
   * @param {Object} forUserObject the user object to query the bounds for
   * @returns {yfiles.view.IVisibilityTestable}
   */
  getVisibilityTest(forUserObject) {
    return IVisibilityTestable.ALWAYS;
  }

  /**
   * @param {Object} forUserObject the user object to create a Visual for
   * @returns {yfiles.view.IVisualCreator}
   */
  getVisualCreator(forUserObject) {
    return this;
  }

  /**
   * @param {yfiles.view.ICanvasObject} canvasObject The object to check.
   * @param {yfiles.view.ICanvasContext} context The context that will be used for the update.
   * @returns {boolean}
   */
  isDirty(canvasObject, context) {
    return canvasObject.dirty;
  }

  /**
   * @param {yfiles.view.IRenderContext} ctx The context that describes where the visual will be used.
   * @returns {yfiles.view.Visual}
   */
  createVisual(ctx) {
    return this;
  }

  /**
   * @param {yfiles.view.IRenderContext} ctx The context that describes where the visual will be used in.
   * @param {yfiles.view.Visual} oldVisual The visual instance that had been returned the last time the <api-link data-type="yfiles.view.IVisualCreator" data-member="createVisual"></api-link> method was called on this instance.
   * @returns {yfiles.view.Visual}
   */
  updateVisual(ctx, oldVisual) {
    return oldVisual;
  }
};



/**
 * The visual for the mouse indicator of the ruler
 * @type {yfiles.lang.ClassDefinition}
 */
class RulerMouseIndicator {
  /**
   * @type {yfiles.geometry.Point}
   * @private
   */
  $position: any

  /**
   * The mouse position in view coordinates
   */

  get position() {
    return this.$position;
  }
  set position(value) {
    this.$position = value;
    this.$updateLocation();
  }


  /**
   * @private
   */
  $rulerSize: number

  /**
   * @private
   */
  $rulerSvgElement: any

  constructor(gc) {
    this.position = new Point(0, 0);
    this.$rulerSize = 15;
    this.$rulerSvgElement = null;
    const overlayPanel = gc.overlayPanel;

    const svg = window.document.createElementNS("http://www.w3.org/2000/svg", "svg");

    const xIndicator = window.document.createElementNS("http://www.w3.org/2000/svg", "line");
    xIndicator.setAttribute("x1", "0");
    xIndicator.setAttribute("y1", "0");
    xIndicator.setAttribute("x2", "0");
    xIndicator.setAttribute("y2", this.$rulerSize.toString());
    xIndicator.setAttribute('stroke', 'red');

    const yIndicator = window.document.createElementNS("http://www.w3.org/2000/svg", "line");
    yIndicator.setAttribute("x1", "0");
    yIndicator.setAttribute("y1", "0");
    yIndicator.setAttribute("x2", this.$rulerSize.toString());
    yIndicator.setAttribute("y2", "0");
    yIndicator.setAttribute('stroke', 'red');

    svg.appendChild(xIndicator);
    svg.appendChild(yIndicator);

    svg.setAttribute("style", "position:absolute;top:0;left:0;height:100%;width:100%;pointer-events:none");

    overlayPanel.appendChild(svg);

    this.$rulerSvgElement = svg;

    // have them hidden initially
    this.hideIndicators();
  }

  /**
   * @private
   */
  '$updateLocation'() {
    if (!this.$rulerSvgElement)
      return;

    const xIndicator = this.$rulerSvgElement.children[0];
    const yIndicator = this.$rulerSvgElement.children[1];

    if (this.position.x < this.$rulerSize || this.position.y < this.$rulerSize) {
      this.hideIndicators();
    } else {
      xIndicator.setAttribute("transform", "translate(" + this.position.x + " 0)");
      yIndicator.setAttribute("transform", "translate(0 " + this.position.y + ")");
    }
  }

  /**
   * Hides the indicators. The will be unhidden if the position is set again.
   */
  hideIndicators() {
    const xIndicator = this.$rulerSvgElement.children[0];
    const yIndicator = this.$rulerSvgElement.children[1];
    xIndicator.setAttribute("transform", "translate(-100, -100)");
    yIndicator.setAttribute("transform", "translate(-100, -100)");
  }
};
