import { Schema, model, InferSchemaType, HydratedDocument, Types } from 'mongoose';

export type IncidentSeverity = 'low' | 'medium' | 'high';

// Auto generated incident report (Option B requirement 2).
// Created when a response time crosses the anomaly threshold.
// Gemini fills in rootCause and recommendations. A rule based fallback covers the rest.
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

    // Provenance of the analysis: "llm" or "rule-based".
    generatedBy: { type: String, required: true, default: 'rule-based' },
  },
  { timestamps: true },
);

incidentSchema.index({ timestamp: -1 });

export type IncidentAttrs = InferSchemaType<typeof incidentSchema>;
export type IncidentDocument = HydratedDocument<IncidentAttrs>;

export const IncidentModel = model('Incident', incidentSchema);
