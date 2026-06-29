import { DatasetCollection } from './app/shared/interfaces/dataset-collection';

export const DEFAULT_DATASETCOLLECTION: DatasetCollection = [
  {
    dataset: 'wineqr',
    source: 'local',
    items: [
      {
        algorithms: {
          feature: 'wineqr.15012026.feature.json',
          position: {
            umap: 'wineqr.15012026.position.umap.json',
            pca: 'wineqr.15012026.position.pca.json',
            tsne: 'wineqr.15012026.position.tsne.json',
          },
          meta: 'wineqr.15012026.meta.json',
          schema: 'wineqr.15012026.schema.json',
        },
        time: '15012026',
      },
    ],
  },
  {
    dataset: 'nutrients',
    source: 'local',
    items: [
      {
        algorithms: {
          position: {
            umap: 'nutrients.15012026.position.umap.json',
            pca: 'nutrients.15012026.position.pca.json',
            tsne: 'nutrients.15012026.position.tsne.json',
          },
          feature: 'nutrients.15012026.feature.json',
          schema: 'nutrients.15012026.schema.json',
          meta: 'nutrients.15012026.meta.json',
        },
        time: '15012026',
      },
    ],
  },
  {
    dataset: 'opennutrition',
    source: 'local',
    items: [
      {
        algorithms: {
          position: {
            pca: 'opennutrition.26052026.position.pca.json',
            tsne: 'opennutrition.26052026.position.tsne.json',
          },
          feature: 'opennutrition.26052026.feature.json',
          schema: 'opennutrition.26052026.schema.json',
          meta: 'opennutrition.26052026.meta.json',
        },
        time: '26052026',
      },
    ],
  },
  {
    dataset: 'opennutrition_5attr',
    source: 'local',
    items: [
      {
        algorithms: {
          position: {
            tsne: 'opennutrition_5attr.26052026.position.tsne.json',
            pca: 'opennutrition_5attr.26052026.position.pca.json',
          },
          feature: 'opennutrition_5attr.26052026.feature.json',
          schema: 'opennutrition_5attr.26052026.schema.json',
          meta: 'opennutrition_5attr.26052026.meta.json',
        },
        time: '26052026',
      },
    ],
  },
];
