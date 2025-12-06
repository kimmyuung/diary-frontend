import React, { useState } from 'react';
import { 
    View, 
    Text, 
    Button, 
    Alert, 
    StyleSheet, 
    ScrollView,
    Platform, // TypeScript 환경에서도 react-native에서 임포트합니다.
    TextInput
} from 'react-native';
import axios from 'axios';

// ⚠️ 중요: 실행 환경에 맞게 IP 주소를 다시 설정하세요!
// Android 에뮬레이터: 'http://10.0.2.2:8000'
// 실기기: 'http://192.168.X.X:8000' (컴퓨터의 내부 IP)
const API_BASE_URL = 'http://172.30.1.6:8000'; // 현재 설정: Android 에뮬레이터 기준

// Expo Router 환경에서는 이 컴포넌트가 default export 됩니다.
const ConnectionTestScreen: React.FC = () => {
    const [result, setResult] = useState<string>("아직 연결 테스트를 실행하지 않았습니다.");
    const [loading, setLoading] = useState<boolean>(false);

    const runConnectionTest = async () => {
        setLoading(true);
        setResult("연결 시도 중...");

        try {
            // Django 서버로 GET 요청 전송
            const response = await axios.get(`${API_BASE_URL}/api/test/connection/`);

            // 성공적으로 응답을 받은 경우 (HTTP 상태 코드 200)
            setResult(JSON.stringify(response.data, null, 2));
            Alert.alert("연결 성공!", response.data.message);

        } catch (error: any) { // TypeScript에서 에러 타입을 명시적으로 any로 처리
            let errorMessage = "네트워크 오류 또는 서버 접속 실패";
            
            if (error.response) {
                errorMessage = `서버 응답 오류: ${error.response.status}`;
            } else if (error.request) {
                errorMessage = "서버에 접근할 수 없습니다. IP 주소와 포트를 확인하세요.";
            }

            setResult(`연결 실패: ${errorMessage}\n\n${error.message}`);
            Alert.alert("연결 실패", errorMessage);
            console.error('API 호출 오류:', error);
            
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Django 백엔드 연결 테스트</Text>
            
            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    요청 주소: {API_BASE_URL}/api/test/connection/
                </Text>
            </View>

            <Button
                title={loading ? "테스트 중..." : "API 연결 테스트 실행 (GET 요청)"}
                onPress={runConnectionTest}
                disabled={loading}
            />
            
            <Text style={styles.resultHeader}>--- 응답 결과 ---</Text>
            <ScrollView style={styles.resultBox}>
                <Text style={styles.resultText}>
                    {result}
                </Text>
            </ScrollView>
        </View>
    );
};

// StyleSheet는 동일하게 유지합니다.
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    infoBox: { padding: 10, backgroundColor: '#e0f7fa', borderRadius: 5, marginBottom: 20 },
    infoText: { fontSize: 14, color: '#006064' },
    resultHeader: { marginTop: 30, marginBottom: 10, fontWeight: 'bold' },
    resultBox: { flex: 1, backgroundColor: '#f9f9f9', padding: 10, borderWidth: 1, borderColor: '#ccc' },
    resultText: { fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontSize: 12 },
});

export default ConnectionTestScreen; // Expo Router는 default export를 사용합니다.