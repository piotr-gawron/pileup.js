/**
 * @flow
 */
'use strict';

import {expect} from 'chai';

import pileup from '../../main/pileup';
import dataCanvas from 'data-canvas';
import {waitFor} from '../async';
import TwoBit from '../../main/data/TwoBit';
import TwoBitDataSource from '../../main/sources/TwoBitDataSource';
import MappedRemoteFile from '../MappedRemoteFile';
import {FakeTwoBit} from '../FakeTwoBit';

describe('EcbigVariantTrack', function() {
  var testDiv = document.getElementById('testdiv');
  if (!testDiv) throw new Error("Failed to match: testdiv");
  var reference: string = '';
  
  // Test data files
  var twoBitFile = new MappedRemoteFile(
          '/test-data/hg19.2bit.mapped',
          [[0, 16383], [691179834, 691183928], [694008946, 694011447]]);

  before(function(): any {
    var twoBit = new TwoBit(twoBitFile);
    return twoBit.getFeaturesInRange('17', 7500000, 7510000).then(seq => {
      reference = seq;
    });
  });

  beforeEach(() => {
    testDiv.style.width = '700px';
    dataCanvas.RecordingContext.recordAll();
  });

  afterEach(() => {
    dataCanvas.RecordingContext.reset();
    // avoid pollution between tests.
    testDiv.innerHTML = '';
  });
  var {drawnObjects} = dataCanvas.RecordingContext;

  function ready() {
    return testDiv.getElementsByTagName('canvas').length > 0 &&
        drawnObjects(testDiv, '.ecbig').length > 0;
  }

  it('should render variants', function(): any {

    var fakeTwoBit = new FakeTwoBit(twoBitFile),
        referenceSource = TwoBitDataSource.createFromTwoBitFile(fakeTwoBit);

    // Release the reference first.
    fakeTwoBit.release(reference);

    var p = pileup.create(testDiv, {
      range: {contig: '17', start: 9386380, stop: 9537390},
      tracks: [
        {
          viz: pileup.viz.genome(),
          data: referenceSource,
          isReference: true
        },
        {
          data: pileup.formats.vcf({
            url: '/test-data/test.vcf'
          }),
          viz: pileup.viz.ecbig()
        }
      ]
    });

    return waitFor(ready, 2000)
      .then(() => {
        var variants = drawnObjects(testDiv, '.ecbig');
        expect(variants.length).to.be.equal(1);

        p.destroy();
      });
  });

});
