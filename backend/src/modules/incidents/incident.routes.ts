import { Router } from 'express';
import { listIncidentsHandler } from './incident.controller';

// Routes for /api/incidents.
export const incidentRoutes = Router();

incidentRoutes.get('/', listIncidentsHandler);
