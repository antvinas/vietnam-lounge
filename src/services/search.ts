import TypesenseInstantSearchAdapter from 'typesense-instantsearch-adapter';

const host = import.meta.env.VITE_TYPESENSE_HOST;
const port = Number(import.meta.env.VITE_TYPESENSE_PORT || 443);
const protocol = import.meta.env.VITE_TYPESENSE_PROTOCOL || 'https';
const apiKey = import.meta.env.VITE_TYPESENSE_SEARCH_KEY;
const collection = import.meta.env.VITE_TYPESENSE_COLLECTION || 'spots';

export const typesenseAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey,    // search-only key
    nodes: [{ host, port, protocol }]
  },
  additionalSearchParameters: { query_by: 'name,city,category' }
});

export const searchClient = typesenseAdapter.searchClient;
export const typesenseCollection = collection;
