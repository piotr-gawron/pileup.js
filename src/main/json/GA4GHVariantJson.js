/**
 * A data source which implements generic JSON protocol.
 * Currently only used to load alignments.
 * @flow
 */
'use strict';

import type {VcfDataSource} from '../sources/VcfDataSource';
import {Variant, VariantContext} from '../data/variant';

import _ from 'underscore';
import {Events} from 'backbone';
import Q from 'q';
import ContigInterval from '../ContigInterval';
import type {GenomeRange} from '../types';

function create(json: string): VcfDataSource {

  // parse json
  var parsedJson = JSON.parse(json);
  var variants: VariantContext[] = [];
  var callSetNames: string[] = [];

  // fill variants with json
  if (!_.isEmpty(parsedJson)) {
      variants = _.values(parsedJson.variants).map(variant => new VariantContext(Variant.fromGA4GH(variant),variant.calls));
      if (variants.length > 0) { // only call variants if non-empty
          callSetNames = _.map(variants[0].calls, c => c.callSetName);
      }
  }

  function rangeChanged(newRange: GenomeRange) {
    // Data is already parsed, so immediately return
    var range = new ContigInterval(newRange.contig, newRange.start, newRange.stop);
    o.trigger('newdata', range);
    o.trigger('networkdone');
    return;
  }

  function getVariantsInRange(range: ContigInterval<string>): Variant[] {
    if (!range) return [];
    var filtered = _.filter(variants, variant => variant.intersects(range));
    return _.map(filtered, f => f.variant);
  }

  function getGenotypesInRange(range: ContigInterval<string>): VariantContext[] {
      if (!range) return [];

      return _.filter(variants, variant => variant.intersects(range));
  }

  function getCallNames(): Q.Promise<string[]> {
      return Q.resolve(callSetNames);
  }

  var o = {
    rangeChanged,
    getVariantsInRange,
    getGenotypesInRange,
    getCallNames,

    on: () => {},
    once: () => {},
    off: () => {},
    trigger: (string, any) => {}
  };
  _.extend(o, Events);
  return o;
}

module.exports = {
  create
};
