/**
 * 인증 서비스 - 사용자 인증 관련 API 호출
 */

import { apiClient } from './api.js';

export class AuthService {
  async adminLogin(password) {
    return await apiClient.post('/admin/login', { password });
  }

  async adminLogout() {
    return await apiClient.post('/admin/logout');
  }

  async checkAuthStatus() {
    return await apiClient.get('/admin/status');
  }
}

export const authService = new AuthService();
