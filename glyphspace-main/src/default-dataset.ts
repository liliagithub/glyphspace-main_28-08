import { DatasetCollection } from './app/shared/interfaces/dataset-collection';

export const DEFAULT_DATASETCOLLECTION: DatasetCollection = [
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
