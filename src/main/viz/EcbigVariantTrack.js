/**
 * Visualization of variants
 * @flow
 */
'use strict';

import type {VcfDataSource} from '../sources/VcfDataSource';
import type {DataCanvasRenderingContext2D} from 'data-canvas';
import type {VizProps} from '../VisualizationWrapper';
import type {Scale} from './d3utils';
import type {State} from '../types';
import React from 'react';
import VariantTrack from './VariantTrack';

import d3utils from './d3utils';
import shallowEquals from 'shallow-equals';
import ContigInterval from '../ContigInterval';
import canvasUtils from './canvas-utils';
import dataCanvas from 'data-canvas';
import style from '../style';
import DisplayMode from "./DisplayMode";

class EcbigVariantTrack extends VariantTrack {
  props: VizProps<VcfDataSource>;
  ref: Object;
  state: State;
  columnId: number;

  constructor(props: VizProps<VcfDataSource>) {
    super(props);
    this.ref = React.createRef();
    let columnName = props.options.column;
    props.source.getCallNames().then(samples => {
      this.columnId = samples.findIndex(column => column === columnName);
    });
  }

  render(): any {
    return <canvas ref={this.ref} onClick={this.handleClick.bind(this)}/>;
  }

  componentDidMount() {
    this.updateVisualization();

    this.props.source.on('newdata', () => {
      this.updateVisualization();
    });
  }

  getScale(): Scale {
    return d3utils.getTrackScale(this.props.range, this.props.width);
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (!shallowEquals(prevProps, this.props) ||
      !shallowEquals(prevState, this.state)) {
      this.updateVisualization();
    }
  }

  updateVisualization() {
    const canvas = this.ref.current;
    var {width, height} = this.props;

    // Hold off until height & width are known.
    if (width === 0) return;

    if (canvas && canvas instanceof Element) { // check for getContext
      if (canvas instanceof HTMLCanvasElement) { // check for sizeCanvas
        d3utils.sizeCanvas(canvas, width, height);
      }
      var ctx = canvasUtils.getContext(canvas);
      var dtx = dataCanvas.getDataContext(ctx);
      this.renderScene(dtx);
    } else {
      throw new TypeError("canvas is not an Element");
    }
  }

  renderScene(ctx: DataCanvasRenderingContext2D) {
    var range = this.props.range,
      interval = new ContigInterval(range.contig, range.start, range.stop),
      variants = this.props.source.getVariantsInRange(interval),
      scale = this.getScale();

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.reset();
    ctx.save();


    // // get adjusted canvas height for drawing letters and rects
    var adjustedHeight = style.VARIANT_HEIGHT;

    ctx.textAlign = 'center';
    ctx.font = style.TEXT_STYLE(DisplayMode.TIGHT, adjustedHeight);

    ctx.fillStyle = "#aa0000";
    ctx.strokeStyle = "#aa0000";
    variants.forEach(variant => {
      let data = variant.vcfLine.split("\t");
      // drop first 8 titles. See vcf header specification 1.3: https://samtools.github.io/hts-specs/VCFv4.2.pdf
      let entry = data[this.columnId + 9];

      ctx.pushObject(variant);
      if (typeof this.props.options.processCell === "function") {
        entry = this.props.options.processCell({cell: entry, row: variant.vcfLine});
      }
      if (entry !== undefined) {
        ctx.fillText(entry, scale(0.5 + variant.position), adjustedHeight);
      }
      ctx.popObject();
    });

    ctx.restore();
  }
}

EcbigVariantTrack.displayName = 'ecbig';

module.exports = EcbigVariantTrack;
