import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

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

    isAnomaly: { type: Boolean, required: true, default: false, index: true },

    error: { type: String },
  },
  { timestamps: true },
);

responseSchema.index({ timestamp: -1 });

export type ResponseAttrs = InferSchemaType<typeof responseSchema>;
export type ResponseDocument = HydratedDocument<ResponseAttrs>;

export const ResponseModel = model('Response', responseSchema);
