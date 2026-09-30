export const openapi = {
  openapi: '3.0.3',
  info: { title: 'HireLink API', version: '0.1.0', description: 'API REST de la plateforme HireLink' },
  servers: [{ url: 'http://localhost:4000/api' }],
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT (Supabase)' } } },
  security: [{ bearer: [] }],
  paths: {
    '/health': { get: { summary: 'Santé du service', security: [], responses: { 200: { description: 'OK' } } } },
    '/jobs': {
      get: { summary: 'Rechercher les offres publiées', security: [], parameters: ['q', 'type', 'location', 'work_mode', 'page', 'limit'].map((n) => ({ name: n, in: 'query', schema: { type: 'string' } })), responses: { 200: { description: 'Liste paginée' } } },
      post: { summary: 'Créer une offre (recruteur)', responses: { 201: { description: 'Créée' } } },
    },
    '/jobs/{id}': { get: { summary: 'Détail offre', security: [], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/applications': { post: { summary: 'Postuler (candidat) — calcule le matching', responses: { 201: { description: 'Créée' } } } },
    '/applications/mine': { get: { summary: 'Mes candidatures', responses: { 200: { description: 'OK' } } } },
    '/applications/job/{jobId}': { get: { summary: "Candidatures d'une offre + score IA", parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/ai/chat': { post: { summary: 'Assistant IA (langue synchronisée)', responses: { 200: { description: 'OK' } } } },
    '/ai/analyze-cv': { post: { summary: 'Extraction de compétences', responses: { 200: { description: 'OK' } } } },
    '/admin/stats': { get: { summary: 'Statistiques globales (admin)', responses: { 200: { description: 'OK' } } } },
    '/admin/companies/pending': { get: { summary: 'Entreprises à valider (admin)', responses: { 200: { description: 'OK' } } } },
  },
};
