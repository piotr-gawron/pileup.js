/* @flow */
'use strict';

import {expect} from 'chai';

import {VcfFile} from '../../main/data/vcf';
import VcfDataSource from '../../main/sources/VcfDataSource';
import ContigInterval from '../../main/ContigInterval';
import RemoteFile from '../../main/RemoteFile';

describe('VcfDataSource', function() {
  function getTestSource() {
    var vcf = new VcfFile(new RemoteFile('/test-data/snv.vcf'));
    return VcfDataSource.createFromVcfFile(vcf);
  }

  it('should extract variants in a range', function(done) {
    var source = getTestSource();
    var range = new ContigInterval('20', 63799, 69094);

    // No variants are cached yet.
    var variants = source.getVariantsInRange(range);
    expect(variants).to.deep.equal([]);

    source.on('newdata', () => {
      var variants = source.getVariantsInRange(range);
      expect(variants).to.have.length(6);
      expect(variants[0].contig).to.equal('20');
      expect(variants[0].position).to.equal(63799);
      expect(variants[0].ref).to.equal('C');
      expect(variants[0].alt).to.equal('T');
      done();
    });
    source.rangeChanged({
      contig: range.contig,
      start: range.start(),
      stop: range.stop()
    });
  });

  it('should extract genotypes in a range', function(done) {
    var source = getTestSource();
    var range = new ContigInterval('20', 63799, 69094);

    // No variants are cached yet.
    var variants = source.getGenotypesInRange(range);
    expect(variants).to.deep.equal([]);

    source.on('newdata', () => {
      var variants = source.getGenotypesInRange(range);
      expect(variants).to.have.length(6);
      expect(variants[0].variant.contig).to.equal('20');
      expect(variants[0].variant.position).to.equal(63799);
      expect(variants[0].variant.ref).to.equal('C');
      expect(variants[0].variant.alt).to.equal('T');
      expect(variants[0].calls).to.have.length(2);
      expect(variants[0].calls[0].genotype).to.deep.equal([0,1]);
      expect(variants[0].calls[0].callSetName).to.equal("NORMAL");
      done();
    });
    source.rangeChanged({
      contig: range.contig,
      start: range.start(),
      stop: range.stop()
    });
  });

  it('should extract samples from a vcf file', function(done) {
    var source = getTestSource();

    source.getCallNames().then(samples => {
      expect(samples).to.have.length(2);
      done();
    });
  });
});
