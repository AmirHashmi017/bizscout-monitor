import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../config/database';
import { ResponseModel } from './response.model';
import { createApp } from '../../app';

const TEST_URI =
  process.env.MONGO_TEST_URI ?? 'mongodb://127.0.0.1:27017/bizscout_test';

describe('GET /api/responses', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDatabase(TEST_URI);
    await ResponseModel.deleteMany({});

    const docs = Array.from({ length: 25 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60_000),
      url: 'https://httpbin.org/anything',
      method: 'POST',
      statusCode: 200,
      success: true,
      responseTimeMs: 100 + i,
      responseSizeBytes: 500,
      isAnomaly: i % 5 === 0,
    }));
    await ResponseModel.insertMany(docs);
  });

  afterAll(async () => {
    await ResponseModel.deleteMany({});
    await mongoose.connection.dropDatabase();
    await disconnectDatabase();
  });

  it('returns the first page with default pagination', async () => {
    const res = await request(app).get('/api/responses');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(20);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20, total: 25, totalPages: 2 });
  });

  it('returns newest first', async () => {
    const res = await request(app).get('/api/responses?limit=3');
    const times = res.body.items.map((i: { timestamp: string }) => new Date(i.timestamp).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('respects page and limit', async () => {
    const res = await request(app).get('/api/responses?page=2&limit=10');
    expect(res.body.items).toHaveLength(10);
    expect(res.body.pagination.page).toBe(2);
  });

  it('filters to anomalies only', async () => {
    const res = await request(app).get('/api/responses?anomaliesOnly=true');
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.items.every((i: { isAnomaly: boolean }) => i.isAnomaly)).toBe(true);
  });

  it('rejects an invalid limit', async () => {
    const res = await request(app).get('/api/responses?limit=999');
    expect(res.status).toBe(400);
  });

  it('exposes rolling stats', async () => {
    const res = await request(app).get('/api/responses/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('mean');
    expect(res.body.count).toBe(25);
  });
});
