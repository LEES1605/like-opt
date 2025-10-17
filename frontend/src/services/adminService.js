/**
 * 관리자 서비스 - 관리자 관련 API 호출
 */

import { apiClient } from './api.js';

export class AdminService {
  async login(password) {
    return await apiClient.post('/admin/login', { password });
  }

  async logout() {
    return await apiClient.post('/admin/logout');
  }

  async runIndexing() {
    return await apiClient.post('/admin/indexing/run');
  }

  async getIndexingStatus() {
    return await apiClient.get('/admin/indexing/status');
  }

  async createBackup(tagName = null) {
    return await apiClient.post('/admin/backup/create', { tag_name: tagName });
  }

  async listBackups() {
    return await apiClient.get('/admin/backup/list');
  }

  async restoreBackup(tagName, assetName) {
    return await apiClient.post('/admin/backup/restore', {
      tag_name: tagName,
      asset_name: assetName,
    });
  }
}

export const adminService = new AdminService();
