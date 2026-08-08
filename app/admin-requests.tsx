import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FuturisticBackground } from '../components/ui/FuturisticBackground';
import { Colors } from '../theme/colors';
import { scale } from '../lib/responsive';
import { ChevronLeft, Check, X, ShieldAlert } from 'lucide-react-native';
import { Image } from 'expo-image';
import { fetchApi } from '../lib/api-client';
import { API_ROUTES, resolveImageUrl } from '../lib/api-routes';
import { useAuth } from '../context/AuthContext';

export default function AdminRequestsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await fetchApi<any>(API_ROUTES.REQUESTS.ADMIN_LIST);
            if (res.success) {
                setRequests(res.data.requests || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await fetchApi(API_ROUTES.REQUESTS.ADMIN_STATUS(id), {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            // Update local state without full reload
            setRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo actualizar el estado.');
        } finally {
            setUpdatingId(null);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={s.card}>
            <View style={s.cardHeader}>
                <View style={[s.badge, item.type === 'REQUEST' ? s.badgeBlue : s.badgeRed]}>
                    <Text style={[s.badgeText, item.type === 'REQUEST' ? s.badgeTextBlue : s.badgeTextRed]}>
                        {item.type === 'REQUEST' ? 'SOLICITUD' : 'REPORTE'}
                    </Text>
                </View>
                <Text style={s.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>

            <View style={s.userInfo}>
                <Text style={s.userName}>{item.user?.name || item.user?.username || 'Usuario Desconocido'}</Text>
            </View>

            <View style={s.contentRow}>
                {item.tmdbPoster ? (
                    <Image source={{ uri: resolveImageUrl(item.tmdbPoster) }} style={s.poster} contentFit="cover" />
                ) : (
                    <View style={s.posterPlaceholder} />
                )}
                <View style={s.contentInfo}>
                    <Text style={s.contentTitle} numberOfLines={2}>{item.tmdbTitle || item.content?.title || 'Sin Título'}</Text>
                    {item.tmdbType && <Text style={s.contentType}>{item.tmdbType}</Text>}
                </View>
            </View>

            {item.message ? (
                <View style={s.messageBox}>
                    <Text style={s.messageText}>{item.message}</Text>
                </View>
            ) : null}

            <View style={s.footer}>
                <View style={[s.statusBadge, 
                    item.status === 'RESOLVED' ? s.statusGreen : 
                    item.status === 'REJECTED' ? s.statusRed : 
                    s.statusYellow
                ]}>
                    <Text style={[s.statusText, 
                        item.status === 'RESOLVED' ? s.statusTextGreen : 
                        item.status === 'REJECTED' ? s.statusTextRed : 
                        s.statusTextYellow
                    ]}>{item.status}</Text>
                </View>

                {item.status === 'PENDING' && (
                    <View style={s.actions}>
                        {updatingId === item.id ? (
                            <ActivityIndicator size="small" color="#00D4FF" />
                        ) : (
                            <>
                                <TouchableOpacity style={s.actionBtnGreen} onPress={() => updateStatus(item.id, 'RESOLVED')}>
                                    <Check size={18} color="#00FF9D" />
                                </TouchableOpacity>
                                <TouchableOpacity style={s.actionBtnRed} onPress={() => updateStatus(item.id, 'REJECTED')}>
                                    <X size={18} color="#FF3366" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <FuturisticBackground>
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={28} color={Colors.white} />
                </TouchableOpacity>
                <View style={s.headerTitleWrap}>
                    <ShieldAlert size={20} color="#FFD700" style={{ marginRight: 8 }} />
                    <Text style={s.headerTitle}>Gestión Admin</Text>
                </View>
                <View style={{ width: 28 }} />
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#00D4FF" />
                    <Text style={s.loadingText}>Cargando registros...</Text>
                </View>
            ) : (
                <FlatList 
                    data={requests}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
                    ListEmptyComponent={<Text style={s.emptyText}>No hay solicitudes ni reportes pendientes.</Text>}
                />
            )}
        </FuturisticBackground>
    );
}

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitleWrap: { flexDirection: 'row', alignItems: 'center' },
    headerTitle: { fontSize: scale(18), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1 },
    
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#00D4FF', marginTop: 12, fontSize: scale(14), fontWeight: '800', letterSpacing: 1 },
    emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: scale(14) },

    card: { backgroundColor: '#081026', borderRadius: 20, marginBottom: 20, padding: 20, borderWidth: 1.5, borderColor: 'rgba(0, 212, 255, 0.25)', shadowColor: '#00D4FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    badgeBlue: { backgroundColor: 'rgba(0, 212, 255, 0.15)', borderColor: 'rgba(0, 212, 255, 0.4)' },
    badgeRed: { backgroundColor: 'rgba(255, 51, 102, 0.15)', borderColor: 'rgba(255, 51, 102, 0.4)' },
    badgeText: { fontSize: scale(10), fontWeight: '900', letterSpacing: 1.5 },
    badgeTextBlue: { color: '#00D4FF' },
    badgeTextRed: { color: '#FF3366' },
    dateText: { color: Colors.textMuted, fontSize: scale(12), fontWeight: '600' },

    userInfo: { marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    userName: { color: Colors.white, fontSize: scale(15), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

    contentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    poster: { width: 44, height: 66, borderRadius: 8 },
    posterPlaceholder: { width: 44, height: 66, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
    contentInfo: { flex: 1, marginLeft: 16 },
    contentTitle: { color: Colors.white, fontSize: scale(16), fontWeight: '900', marginBottom: 6 },
    contentType: { color: Colors.textMuted, fontSize: scale(11), fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },

    messageBox: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    messageText: { color: 'rgba(255,255,255,0.9)', fontSize: scale(14), lineHeight: 22, fontStyle: 'italic' },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    statusGreen: { backgroundColor: 'rgba(0, 255, 157, 0.15)' },
    statusRed: { backgroundColor: 'rgba(255, 51, 102, 0.15)' },
    statusYellow: { backgroundColor: 'rgba(255, 215, 0, 0.15)' },
    statusText: { fontSize: scale(11), fontWeight: '900', letterSpacing: 1.5 },
    statusTextGreen: { color: '#00FF9D' },
    statusTextRed: { color: '#FF3366' },
    statusTextYellow: { color: '#FFD700' },

    actions: { flexDirection: 'row', gap: 12 },
    actionBtnGreen: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0, 255, 157, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(0, 255, 157, 0.4)' },
    actionBtnRed: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255, 51, 102, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255, 51, 102, 0.4)' },
});
