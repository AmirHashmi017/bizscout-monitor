import { EventEmitter } from 'events';
import type { ResponseDocument } from '../modules/responses/response.model';
import type { IncidentDocument } from '../modules/incidents/incident.model';

export interface AppEvents {
  'response:new': (response: ResponseDocument) => void;
  'incident:new': (incident: IncidentDocument) => void;
}

class TypedEventBus extends EventEmitter {
  emit<K extends keyof AppEvents>(
    event: K,
    ...args: Parameters<AppEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): this {
    return super.on(event, listener);
  }
}

export const eventBus = new TypedEventBus();
