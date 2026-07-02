import { Schema, model, InferSchemaType, HydratedDocument, Types } from 'mongoose';

export type IncidentSeverity = 'low' | 'medium' | 'high';

const incidentSchema = new Schema(
  {
    responseId: { type: Types.ObjectId, ref: 'Response', required: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },

    severity: { type: String, enum: ['low', 'medium', 'high'], required: true, index: true },

    endpoint: { type: String, required: true },
    responseTimeMs: { type: Number, required: true },
    avgResponseTimeMs: { type: Number, required: true },

    title: { type: String, required: true },
    rootCause: { type: String, required: true },
    recommendations: { type: [String], required: true, default: [] },

    generatedBy: { type: String, required: true, default: 'rule-based' },
  },
  { timestamps: true },
);

incidentSchema.index({ timestamp: -1 });

export type IncidentAttrs = InferSchemaType<typeof incidentSchema>;
export type IncidentDocument = HydratedDocument<IncidentAttrs>;

export const IncidentModel = model('Incident', incidentSchema);
