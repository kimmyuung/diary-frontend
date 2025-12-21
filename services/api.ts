import axios from 'axios';
import { logError, isAuthError } from '@/utils/errorHandler';

// API 기본 URL 설정
// 개발 환경에서는 로컬 서버 주소 사용
export const API_BASE_URL = 'http://localhost:8000';

// Axios 인스턴스 생성
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
    (config) => {
        // 토큰은 AuthContext에서 설정되므로 여기서는 로깅만
        if (__DEV__) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => {
        logError(error, 'Request Interceptor');
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
    (response) => {
        // 성공 응답 로깅 (개발 환경에서만)
        if (__DEV__) {
            console.log(`[API Response] ${response.status} ${response.config.url}`);
        }
        return response;
    },
    async (error) => {
        // 에러 로깅
        logError(error, 'Response Interceptor');

        // 인증 에러 처리 (401)
        if (isAuthError(error)) {
            // 토큰 갱신 로직 (추후 구현 가능)
            // 현재는 AuthContext에서 처리
        }

        return Promise.reject(error);
    }
);

// 토큰 설정 함수 (AuthContext에서 사용)
export const setAuthToken = (token: string | null) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common['Authorization'];
    }
};

// API 인스턴스 export
export { api };

// 타입 정의
export interface Diary {
    id: number;
    user: number;
    title: string;
    content: string;
    images: DiaryImage[];
    emotion: string | null;
    emotion_score: number | null;
    emotion_emoji: string | null;
    emotion_analyzed_at: string | null;
    location_name: string | null;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
}

export interface DiaryImage {
    id: number;
    image_url: string;
    ai_prompt: string;
    created_at: string;
}

export interface CreateDiaryRequest {
    title: string;
    content: string;
    location_name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface UpdateDiaryRequest {
    title?: string;
    content?: string;
    location_name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

export interface EmotionStat {
    emotion: string;
    label: string;
    count: number;
    percentage: number;
}

export interface EmotionReport {
    period: string;
    period_label: string;
    total_diaries: number;
    data_sufficient: boolean;
    recommended_count: number;
    emotion_stats: EmotionStat[];
    dominant_emotion: { emotion: string; label: string } | null;
    insight: string;
}

// 일기 API 서비스
export const diaryService = {
    // 일기 목록 조회
    async getAll(): Promise<Diary[]> {
        const response = await api.get('/api/diaries/');
        return response.data;
    },

    // 일기 검색 (필터 포함)
    async search(filters: {
        search?: string;           // 제목 검색
        contentSearch?: string;    // 본문 검색
        q?: string;                // 통합 검색 (제목+본문)
        emotion?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<Diary[]> {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.contentSearch) params.append('content_search', filters.contentSearch);
        if (filters.q) params.append('q', filters.q);
        if (filters.emotion) params.append('emotion', filters.emotion);
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);

        const queryString = params.toString();
        const url = queryString ? `/api/diaries/?${queryString}` : '/api/diaries/';
        const response = await api.get(url);
        // 페이지네이션 응답 처리
        return response.data.results ?? response.data;
    },

    // 일기 상세 조회
    async getById(id: number): Promise<Diary> {
        const response = await api.get(`/api/diaries/${id}/`);
        return response.data;
    },

    // 일기 작성
    async create(data: CreateDiaryRequest): Promise<Diary> {
        const response = await api.post('/api/diaries/', data);
        return response.data;
    },

    // 일기 수정
    async update(id: number, data: UpdateDiaryRequest): Promise<Diary> {
        const response = await api.put(`/api/diaries/${id}/`, data);
        return response.data;
    },

    // 일기 삭제
    async delete(id: number): Promise<void> {
        await api.delete(`/api/diaries/${id}/`);
    },

    // AI 이미지 생성
    async generateImage(id: number): Promise<DiaryImage> {
        const response = await api.post(`/api/diaries/${id}/generate-image/`);
        return response.data;
    },

    // 감정 리포트 조회
    async getReport(period: 'week' | 'month' = 'week'): Promise<EmotionReport> {
        const response = await api.get(`/api/diaries/report/?period=${period}`);
        return response.data;
    },

    // 캘린더 월별 요약 조회
    async getCalendar(year: number, month: number): Promise<{
        year: number;
        month: number;
        days: Record<string, { count: number; emotion: string | null; emoji: string; diary_ids: number[] }>;
    }> {
        const response = await api.get(`/api/diaries/calendar/?year=${year}&month=${month}`);
        return response.data;
    },

    // 특정 날짜 일기 검색
    async getByDate(date: string): Promise<Diary[]> {
        const response = await api.get(`/api/diaries/?start_date=${date}&end_date=${date}`);
        return response.data;
    },

    // 연간 리포트
    async getAnnualReport(year: number): Promise<{
        year: number;
        total_diaries: number;
        monthly_stats: { month: number; count: number; dominant_emotion: string | null }[];
        emotion_stats: { emotion: string; label: string; count: number; percentage: number }[];
    }> {
        const response = await api.get(`/api/diaries/annual-report/?year=${year}`);
        return response.data;
    },

    // 이미지 갤러리
    async getGallery(): Promise<{
        total_images: number;
        images: { id: number; image_url: string; ai_prompt: string; created_at: string; diary_id: number; diary_title: string; diary_date: string }[];
    }> {
        const response = await api.get('/api/diaries/gallery/');
        return response.data;
    },

    // 일기 내보내기 (JSON)
    async exportDiaries(): Promise<{
        exported_at: string;
        total_diaries: number;
        diaries: Diary[];
    }> {
        const response = await api.get('/api/diaries/export/');
        return response.data;
    },

    // 일기 내보내기 (PDF) - Blob 반환
    async exportPdf(): Promise<Blob> {
        const response = await api.get('/api/diaries/export-pdf/', {
            responseType: 'blob',
        });
        return response.data;
    },

    // 위치 정보 일기 목록
    async getLocations(): Promise<{
        total_locations: number;
        locations: { id: number; title: string; location_name: string; latitude: number; longitude: number; emotion: string | null; emotion_emoji: string; created_at: string }[];
    }> {
        const response = await api.get('/api/diaries/locations/');
        return response.data;
    },
};

// 음성-텍스트 변환 API 서비스
export const speechService = {
    // 음성을 텍스트로 변환
    async transcribe(audioFile: FormData, language: string = 'ko'): Promise<{ text: string; language: string }> {
        audioFile.append('language', language);
        const response = await api.post('/api/transcribe/', audioFile, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // 지원 언어 목록
    async getSupportedLanguages(): Promise<{ languages: Record<string, string>; note: string }> {
        const response = await api.get('/api/supported-languages/');
        return response.data;
    },
};

export default api;

