/**
 * Admin Service - 관리자 관련 API 통신
 */

import { apiClient, ApiError } from './api.js';

/**
 * 관리자 서비스 클래스
 */
export class AdminService {
  constructor() {
    this.isAuthenticated = false;
    this.indexingStatus = null;
    this.backupList = [];
    this.systemLogs = [];
  }

  /**
   * 관리자 로그인
   */
  async login(password) {
    try {
      const response = await apiClient.post('/admin/login', { password });
      this.isAuthenticated = true;
      return { success: true, message: response.message };
    } catch (error) {
      this.isAuthenticated = false;
      if (error.status === 401) {
        return { success: false, error: '잘못된 비밀번호입니다.' };
      }
      throw new AdminError('로그인에 실패했습니다.', error);
    }
  }

  /**
   * 관리자 로그아웃
   */
  async logout() {
    try {
      await apiClient.post('/admin/logout');
      this.isAuthenticated = false;
      return { success: true, message: '로그아웃되었습니다.' };
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw new AdminError('로그아웃에 실패했습니다.', error);
    }
  }

  /**
   * 인덱싱 실행
   */
  async runIndexing() {
    try {
      const response = await apiClient.post('/admin/indexing/run');
      return response;
    } catch (error) {
      console.error('인덱싱 실행 실패:', error);
      throw new AdminError('인덱싱 실행에 실패했습니다.', error);
    }
  }

  /**
   * 인덱싱 상태 조회
   */
  async getIndexingStatus() {
    try {
      const response = await apiClient.get('/admin/indexing/status');
      this.indexingStatus = response;
      return response;
    } catch (error) {
      console.error('인덱싱 상태 조회 실패:', error);
      return this.indexingStatus; // 캐시된 상태 반환
    }
  }

  /**
   * 백업 생성
   */
  async createBackup(tagName = null, name = null, body = null) {
    try {
      const response = await apiClient.post('/admin/backup/create', {
        tag_name: tagName || `backup-${Date.now()}`,
        name: name || `Like-Opt Backup ${new Date().toLocaleString()}`,
        body: body || 'Automated backup created from admin panel'
      });
      return response;
    } catch (error) {
      console.error('백업 생성 실패:', error);
      throw new AdminError('백업 생성에 실패했습니다.', error);
    }
  }

  /**
   * 백업 목록 조회
   */
  async listBackups() {
    try {
      const response = await apiClient.get('/admin/backup/list');
      this.backupList = response;
      return response;
    } catch (error) {
      console.error('백업 목록 조회 실패:', error);
      return this.backupList; // 캐시된 목록 반환
    }
  }

  /**
   * 백업 복원
   */
  async restoreBackup(releaseId, assetName) {
    try {
      const response = await apiClient.post('/admin/backup/restore', {
        release_id: releaseId,
        asset_name: assetName
      });
      return response;
    } catch (error) {
      console.error('백업 복원 실패:', error);
      throw new AdminError('백업 복원에 실패했습니다.', error);
    }
  }

  /**
   * 인증 상태 확인
   */
  isLoggedIn() {
    return this.isAuthenticated;
  }

  /**
   * 현재 상태 반환
   */
  getState() {
    return {
      isAuthenticated: this.isAuthenticated,
      indexingStatus: this.indexingStatus,
      backupList: this.backupList,
      systemLogs: this.systemLogs
    };
  }
}

/**
 * 관리자 에러 클래스
 */
export class AdminError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'AdminError';
    this.originalError = originalError;
  }
}

// 전역 관리자 서비스 인스턴스
export const adminService = new AdminService();