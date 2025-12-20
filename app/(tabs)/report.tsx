import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { diaryService, EmotionReport } from '@/services/api';
import { Palette, FontSize, FontWeight, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HIDE_BANNER_KEY = 'hideDataBannerUntil';

// 감정별 색상
const EMOTION_COLORS: Record<string, string> = {
    happy: '#FFD54F',
    sad: '#64B5F6',
    angry: '#EF5350',
    anxious: '#BA68C8',
    peaceful: '#81C784',
    excited: '#FF7043',
    tired: '#90A4AE',
    love: '#EC407A',
};

const EMOTION_EMOJIS: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😡',
    anxious: '😰',
    peaceful: '😌',
    excited: '🥳',
    tired: '😴',
    love: '🥰',
};

export default function ReportScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [period, setPeriod] = useState<'week' | 'month'>('week');
    const [report, setReport] = useState<EmotionReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBanner, setShowBanner] = useState(true);

    // 배너 숨김 상태 확인
    const checkBannerVisibility = useCallback(async () => {
        try {
            const hideUntil = await AsyncStorage.getItem(HIDE_BANNER_KEY);
            if (hideUntil) {
                const hideDate = new Date(hideUntil);
                if (new Date() < hideDate) {
                    setShowBanner(false);
                } else {
                    await AsyncStorage.removeItem(HIDE_BANNER_KEY);
                    setShowBanner(true);
                }
            }
        } catch (error) {
            console.error('Failed to check banner visibility:', error);
        }
    }, []);

    // 1주일 숨김 처리
    const hideBannerForWeek = async () => {
        try {
            const hideDate = new Date();
            hideDate.setDate(hideDate.getDate() + 7);
            await AsyncStorage.setItem(HIDE_BANNER_KEY, hideDate.toISOString());
            setShowBanner(false);
        } catch (error) {
            console.error('Failed to hide banner:', error);
        }
    };

    // 리포트 조회
    const fetchReport = useCallback(async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const data = await diaryService.getReport(period);
            setReport(data);
        } catch (error) {
            console.error('Failed to fetch report:', error);
        } finally {
            setLoading(false);
        }
    }, [period, isAuthenticated]);

    useEffect(() => {
        checkBannerVisibility();
        fetchReport();
    }, [checkBannerVisibility, fetchReport]);

    if (!isAuthenticated) {
        return (
            <LinearGradient
                colors={['#F5E6FF', '#FFF5F3', '#E6F0FF']}
                style={styles.container}
            >
                <View style={styles.notAuthContainer}>
                    <Text style={styles.notAuthEmoji}>📊</Text>
                    <Text style={styles.notAuthTitle}>감정 리포트</Text>
                    <Text style={styles.notAuthSubtitle}>
                        로그인하여 나의 감정 분석을{'\n'}확인해보세요
                    </Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push('/login' as any)}
                    >
                        <Text style={styles.loginButtonText}>로그인하기</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Palette.secondary[500]} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>감정 리포트</Text>
                <Text style={styles.headerSubtitle}>AI가 분석한 나의 감정</Text>
            </View>

            {/* 기간 선택 */}
            <View style={styles.periodSelector}>
                <TouchableOpacity
                    style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
                    onPress={() => setPeriod('week')}
                >
                    <Text style={[styles.periodButtonText, period === 'week' && styles.periodButtonTextActive]}>
                        일주일
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
                    onPress={() => setPeriod('month')}
                >
                    <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
                        한 달
                    </Text>
                </TouchableOpacity>
            </View>

            {/* 데이터 부족 안내 배너 */}
            {showBanner && report && !report.data_sufficient && (
                <View style={styles.dataBanner}>
                    <Text style={styles.dataBannerTitle}>
                        더 많은 일기가 더 정확한 분석을 만들어요
                    </Text>
                    <Text style={styles.dataBannerText}>
                        현재 데이터: {report.total_diaries}개 | 권장: {report.recommended_count}개 이상{'\n'}
                        꾸준히 기록할수록 AI가 당신을 더 잘 이해해요
                    </Text>
                    <TouchableOpacity style={styles.hideBannerButton} onPress={hideBannerForWeek}>
                        <View style={styles.checkbox} />
                        <Text style={styles.hideBannerText}>1주일 동안 보지 않음</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 인사이트 카드 */}
            {report && report.dominant_emotion && (
                <LinearGradient
                    colors={[
                        EMOTION_COLORS[report.dominant_emotion.emotion] + '20',
                        EMOTION_COLORS[report.dominant_emotion.emotion] + '10',
                    ]}
                    style={styles.insightCard}
                >
                    <Text style={styles.insightEmoji}>
                        {EMOTION_EMOJIS[report.dominant_emotion.emotion]}
                    </Text>
                    <Text style={styles.insightText}>{report.insight}</Text>
                    <Text style={styles.insightCount}>
                        총 {report.total_diaries}개의 일기 분석
                    </Text>
                </LinearGradient>
            )}

            {/* 감정 통계 */}
            {report && report.emotion_stats.length > 0 ? (
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>감정 분포</Text>

                    {report.emotion_stats.map((stat) => (
                        <View key={stat.emotion} style={styles.statRow}>
                            <View style={styles.statInfo}>
                                <Text style={styles.statEmoji}>{EMOTION_EMOJIS[stat.emotion]}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                                <Text style={styles.statCount}>{stat.count}회</Text>
                            </View>
                            <View style={styles.statBarContainer}>
                                <View
                                    style={[
                                        styles.statBar,
                                        {
                                            width: `${stat.percentage}%`,
                                            backgroundColor: EMOTION_COLORS[stat.emotion],
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.statPercentage}>{stat.percentage}%</Text>
                        </View>
                    ))}
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>📝</Text>
                    <Text style={styles.emptyTitle}>아직 분석할 일기가 없어요</Text>
                    <Text style={styles.emptySubtitle}>
                        일기를 작성하면 AI가{'\n'}감정을 분석해드려요
                    </Text>
                    <TouchableOpacity
                        style={styles.writeButton}
                        onPress={() => router.push('/diary/create' as any)}
                    >
                        <Text style={styles.writeButtonText}>일기 작성하기</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFBFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFBFA',
    },
    notAuthContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    notAuthEmoji: {
        fontSize: 64,
        marginBottom: Spacing.lg,
    },
    notAuthTitle: {
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.bold,
        color: Palette.neutral[900],
        marginBottom: Spacing.sm,
    },
    notAuthSubtitle: {
        fontSize: FontSize.lg,
        color: Palette.neutral[600],
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: Spacing.xl,
    },
    loginButton: {
        backgroundColor: Palette.secondary[500],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.full,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
    },

    // 헤더
    header: {
        paddingTop: 60,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
    },
    headerTitle: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Palette.neutral[900],
    },
    headerSubtitle: {
        fontSize: FontSize.md,
        color: Palette.neutral[500],
        marginTop: Spacing.xs,
    },

    // 기간 선택
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        backgroundColor: Palette.neutral[100],
        borderRadius: BorderRadius.full,
        padding: 4,
        marginBottom: Spacing.lg,
    },
    periodButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: BorderRadius.full,
    },
    periodButtonActive: {
        backgroundColor: '#fff',
        ...Shadows.sm,
    },
    periodButtonText: {
        fontSize: FontSize.md,
        color: Palette.neutral[500],
        fontWeight: FontWeight.medium,
    },
    periodButtonTextActive: {
        color: Palette.neutral[900],
        fontWeight: FontWeight.semibold,
    },

    // 데이터 부족 배너
    dataBanner: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        backgroundColor: '#FFF8E1',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    dataBannerTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Palette.neutral[900],
        marginBottom: Spacing.sm,
    },
    dataBannerText: {
        fontSize: FontSize.sm,
        color: Palette.neutral[700],
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    hideBannerButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Palette.neutral[400],
        marginRight: Spacing.sm,
    },
    hideBannerText: {
        fontSize: FontSize.sm,
        color: Palette.neutral[600],
    },

    // 인사이트 카드
    insightCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    insightEmoji: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    insightText: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Palette.neutral[900],
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    insightCount: {
        fontSize: FontSize.sm,
        color: Palette.neutral[500],
    },

    // 통계
    statsContainer: {
        marginHorizontal: Spacing.lg,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
    },
    sectionTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Palette.neutral[900],
        marginBottom: Spacing.lg,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    statInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
    },
    statEmoji: {
        fontSize: 20,
        marginRight: Spacing.xs,
    },
    statLabel: {
        fontSize: FontSize.sm,
        color: Palette.neutral[700],
        marginRight: Spacing.xs,
    },
    statCount: {
        fontSize: FontSize.xs,
        color: Palette.neutral[400],
    },
    statBarContainer: {
        flex: 1,
        height: 12,
        backgroundColor: Palette.neutral[100],
        borderRadius: 6,
        marginHorizontal: Spacing.sm,
        overflow: 'hidden',
    },
    statBar: {
        height: '100%',
        borderRadius: 6,
    },
    statPercentage: {
        width: 40,
        textAlign: 'right',
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Palette.neutral[700],
    },

    // 빈 상태
    emptyContainer: {
        alignItems: 'center',
        padding: Spacing.xxl,
    },
    emptyEmoji: {
        fontSize: 56,
        marginBottom: Spacing.lg,
    },
    emptyTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.semibold,
        color: Palette.neutral[800],
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        fontSize: FontSize.md,
        color: Palette.neutral[500],
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.xl,
    },
    writeButton: {
        backgroundColor: Palette.secondary[500],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
    },
    writeButtonText: {
        color: '#fff',
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
});
