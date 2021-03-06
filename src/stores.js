import { writable, derived } from 'svelte/store';
import { getData } from './DataTransformer.js';

export const dataset = writable([]);

export const selectedFeatures = writable([]);

export const metadata = writable(null);

export const data = derived(
  [metadata, selectedFeatures, dataset],
  ([$metadata, $selectedFeatures, $dataset]) => getData($metadata, $selectedFeatures, $dataset)
);