import axios from 'axios';

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
}

export interface UpdateDiaryRequest {
    title?: string;
    content?: string;
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

