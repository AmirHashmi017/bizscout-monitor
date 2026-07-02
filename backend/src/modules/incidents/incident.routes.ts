import { Router } from 'express';
import { listIncidentsHandler } from './incident.controller';

export const incidentRoutes = Router();

incidentRoutes.get('/', listIncidentsHandler);
