import { Router } from 'express';
import { chatHandler, costHandler } from './chat.controller';

export const chatRoutes = Router();

chatRoutes.post('/', chatHandler);
chatRoutes.get('/cost', costHandler);
