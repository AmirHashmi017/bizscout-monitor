import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

// One monitoring sample per ping.
// Stores the echoed request payload and a trimmed response body.
const responseSchema = new Schema(
  {
    timestamp: { type: Date, required: true, default: Date.now, index: true },

    url: { type: String, required: true },
    method: { type: String, required: true, default: 'POST' },
    requestPayload: { type: Schema.Types.Mixed },

    statusCode: { type: Number, required: true, index: true },
    success: { type: Boolean, required: true },
    responseTimeMs: { type: Number, required: true, index: true },
    responseSizeBytes: { type: Number, required: true, default: 0 },

    responseBody: { type: Schema.Types.Mixed },

    // Anomaly flag set by the write time check (time above factor times the average).
    isAnomaly: { type: Boolean, required: true, default: false, index: true },

    error: { type: String },
  },
  { timestamps: true },
);

// Newest first is the main dashboard query.
responseSchema.index({ timestamp: -1 });

export type ResponseAttrs = InferSchemaType<typeof responseSchema>;
export type ResponseDocument = HydratedDocument<ResponseAttrs>;

export const ResponseModel = model('Response', responseSchema);
