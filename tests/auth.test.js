// tests/auth.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/index.js';
import User from '../src/models/user.model.js';

describe('Auth API Integration Tests', () => {
    
    const testUser = {
        email: `testuser_${Date.now()}@example.com`,
        password: 'password123'
    };

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('POST /api/auth/register - should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully');
        
        expect(res.body.data.user).toHaveProperty('email', testUser.email);
    });

    test('POST /api/auth/login - should login and return token', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send(testUser);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('message', 'Login successful');
        expect(res.body.data).toHaveProperty('token');
    });

    test('POST /api/auth/login - should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
    });
});