import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authAdminRouter from '../routes/api/admin/authAdmin.route.js';
import { verifyAdmin } from '../middleware/verifiAdmin.js';
import logger from '../utils/logger.js';

// Mock các module
jest.mock('../models/User.js');
jest.mock('../utils/logger.js');

// Tạo Express app cho testing
const app = express();
app.use(express.json());
app.use('/api/admin/auth', authAdminRouter);

// Route protected để test middleware
app.get('/api/admin/protected', verifyAdmin, (req, res) => {
  res.status(200).json({ message: 'Access granted', user: req.user });
});

describe('Admin Authentication Tests', () => {
  let mockAdmin;
  let validAccessToken;
  let validRefreshToken;

  beforeAll(() => {
    // Setup JWT_SECRET cho testing
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    // Reset tất cả mocks sau mỗi test
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Mock admin user
    mockAdmin = {
      _id: '507f1f77bcf86cd799439011',
      username: 'admin',
      role: 'admin',
      refreshToken: null,
      comparePassword: jest.fn(),
      save: jest.fn(),
    };

    // Generate valid tokens
    validAccessToken = jwt.sign(
      { id: mockAdmin._id, role: mockAdmin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    validRefreshToken = jwt.sign(
      { id: mockAdmin._id, role: mockAdmin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7h' }
    );
  });

  describe('POST /api/admin/auth/login', () => {
    test('1. Login đúng → trả token', async () => {
      // Setup mock - Tạo admin object có thể mutate
      const testAdmin = {
        _id: '507f1f77bcf86cd799439011',
        username: 'admin',
        role: 'admin',
        refreshToken: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      
      User.findOne.mockResolvedValue(testAdmin);

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          username: 'admin',
          password: 'correctpassword',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Verify các methods được gọi
      expect(User.findOne).toHaveBeenCalledWith({ username: 'admin' });
      expect(testAdmin.comparePassword).toHaveBeenCalledWith('correctpassword');
      expect(testAdmin.save).toHaveBeenCalled();
      
      // Verify refreshToken đã được set
      expect(testAdmin.refreshToken).not.toBeNull();
    });

    test('2. Login sai password', async () => {
      mockAdmin.comparePassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(mockAdmin);

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid username or password');
      expect(mockAdmin.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    test('3. Login sai email/username', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          username: 'wronguser',
          password: 'anypassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid username or password');
      expect(User.findOne).toHaveBeenCalledWith({ username: 'wronguser' });
    });

    test('Login với user không phải admin', async () => {
      const normalUser = { 
        _id: '507f1f77bcf86cd799439012',
        username: 'normaluser',
        role: 'user',
        comparePassword: jest.fn(),
        save: jest.fn(),
      };
      User.findOne.mockResolvedValue(normalUser);

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          username: 'normaluser',
          password: 'password',
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied: Admins only');
    });

    test('Login với lỗi server', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({
          username: 'admin',
          password: 'password',
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
    });
  });

  describe('POST /api/admin/auth/refresh', () => {
    test('Refresh token thành công', async () => {
      const testAdmin = {
        _id: '507f1f77bcf86cd799439011',
        username: 'admin',
        role: 'admin',
        refreshToken: validRefreshToken,
      };
      User.findById.mockResolvedValue(testAdmin);

      const response = await request(app)
        .post('/api/admin/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(User.findById).toHaveBeenCalledWith(mockAdmin._id);
    });

    test('Refresh token không được gửi', async () => {
      const response = await request(app)
        .post('/api/admin/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Refresh token required');
    });

    test('Refresh token không hợp lệ', async () => {
      // Token không hợp lệ sẽ khiến jwt.verify throw error
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .post('/api/admin/auth/refresh')
        .send({
          refreshToken: invalidToken,
        });

      // Controller catch error và return 403
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Token expired or invalid');
    });

    test('Refresh token không khớp với user', async () => {
      const testAdmin = {
        _id: '507f1f77bcf86cd799439011',
        username: 'admin',
        role: 'admin',
        refreshToken: 'different.refresh.token',
      };
      User.findById.mockResolvedValue(testAdmin);

      const response = await request(app)
        .post('/api/admin/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid refresh token');
    });
  });

  describe('POST /api/admin/auth/logout', () => {
    test('Logout thành công', async () => {
      const testAdmin = {
        _id: '507f1f77bcf86cd799439011',
        username: 'admin',
        role: 'admin',
        refreshToken: validRefreshToken,
        save: jest.fn().mockResolvedValue(true),
      };
      
      User.findById.mockResolvedValue(testAdmin);

      const response = await request(app)
        .post('/api/admin/auth/logout')
        .send({
          refreshToken: validRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successfully');
      expect(testAdmin.refreshToken).toBeNull();
      expect(testAdmin.save).toHaveBeenCalled();
    });

    test('Logout không có refresh token', async () => {
      const response = await request(app)
        .post('/api/admin/auth/logout')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Refresh token required');
    });

    test('Logout với token không hợp lệ', async () => {
      // Token không hợp lệ sẽ khiến jwt.verify throw error
      const invalidToken = 'invalid.token';

      const response = await request(app)
        .post('/api/admin/auth/logout')
        .send({
          refreshToken: invalidToken,
        });

      // Controller catch error và return 403
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid or expired refresh token');
    });
  });

  describe('Middleware verifiAdmin Tests', () => {
    test('4. Gọi API không có token → 401', async () => {
      const response = await request(app).get('/api/admin/protected');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token provided');
    });

    test('5. Gọi API với token sai → 403', async () => {
      const invalidToken = 'invalid.token.here';

      const response = await request(app)
        .get('/api/admin/protected')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });

    test('6. Gọi API với token đúng → 200', async () => {
      const response = await request(app)
        .get('/api/admin/protected')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Access granted');
      expect(response.body.user).toHaveProperty('id', mockAdmin._id);
      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    test('7. Middleware với token không phải Bearer', async () => {
      const response = await request(app)
        .get('/api/admin/protected')
        .set('Authorization', validAccessToken);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No or invalid token provided');
    });

    test('Middleware với token của user không phải admin', async () => {
      const userToken = jwt.sign(
        { id: 'user123', role: 'user' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/protected')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'You are not an admin');
    });

    test('Middleware với token đã hết hạn', async () => {
      const expiredToken = jwt.sign(
        { id: mockAdmin._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      const response = await request(app)
        .get('/api/admin/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });
});