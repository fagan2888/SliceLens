import * as d3_array from "d3-array";
import * as d3_all from "d3";

const d3 = {...d3_array, ...d3_all};

export { getMetadata, getData };

function getMetadata(dataset, splitType) {
  if (!dataset || !dataset.columns) {
    return null;
  }

  const cols = dataset.columns;

  const label = 'label';
  const labelValues = Array.from(new Set(dataset.map(d => d[label])));
  
  const featureNames = cols.filter(d => d !== 'label' && d !== 'prediction');
  const hasPredictions = cols.includes('prediction');

  const numBins = 3;
  const verbs = ['low', 'medium', 'high'];

  const features = featureNames.reduce((acc, val) => {
    const values = dataset.map(d => d[val]);
    const uniqueValues = Array.from(new Set(values)).sort();
    const feature = {
      name: val
    };

    if (uniqueValues.length <= 5) {
      feature.values = uniqueValues;
      feature.type = 'C';
    } else if (!isNaN(values[0])) {
      feature.type = 'Q';
      feature.values = verbs;
      
      const extent = d3.extent(values);
      feature.extent = extent;

      if (splitType === 'interval') {
        feature.thresholds = equalIntervalThresholds(extent);
      } else {
        feature.thresholds = quantileThresholds(values);
      }
    } else if (values[0] instanceof Date) {
      feature.type = 'T';
      // TODO: handle dates
    } else {
      feature.values = uniqueValues;
      feature.type = 'C';
    }

    acc[val] = feature;

    return acc;
  }, {});

  return {
    features: features,
    featureNames: featureNames,
    label: label,
    labelValues: labelValues,
    hasPredictions: hasPredictions,
  }

  function equalIntervalThresholds([min, max]) {
    const binSize = (max - min) / numBins;
    const thresholds = d3.range(1, numBins)
        .map(d => min + d * binSize);
    return thresholds;
  }

  function quantileThresholds(values) {
    return d3.range(1, numBins)
        .map(d => d3.quantile(values, d / numBins));
  }
}

function getData(metadata, selectedFeatures, dataset) {
  if (metadata === null) {
    return null;
  }

  return splitData(dataset, 0, '', '');
      
  function splitData(data, index, splitFeature, splitLabel) {
    const counts = d3.rollup(data, v => v.length, d => d.label);

    const node = {counts, splitFeature, splitLabel};

    if (metadata.hasPredictions) {
      const predictionCounts = d3.rollup(data, v => v.length, d => d.prediction);
  
      const predictionResults = d3.rollup(data,
        v => d3.rollup(v, g => g.length, p => {
          if (p.prediction === p.label) {
            return 'correct';
          } else {
            return 'incorrect';
          }
        }),
        d => d.prediction);

      node.predictionCounts = predictionCounts;
      node.predictionResults = predictionResults;
    }

    if (index < selectedFeatures.length) {
      const nextFeatureName = selectedFeatures[index];
      const nextFeature = metadata.features[nextFeatureName];
      let splits;

      if (nextFeature.type === 'Q') {
        const bin = d3.bin()
            .value(d => d[nextFeatureName])
            .domain(nextFeature.extent)
            .thresholds(nextFeature.thresholds);
        splits = bin(data);
      } else if (nextFeature.type === 'C') {
        splits = d3.groups(data, d => d[nextFeatureName])
            .map(d => d[1]);
      }
  
      node.children = splits
          .map((d, i) => splitData(d, index + 1, nextFeatureName, nextFeature.values[i]))
          .filter(d => d !== undefined);
    } else {
      node.value = data.length;
    }

    return node;
  }
}