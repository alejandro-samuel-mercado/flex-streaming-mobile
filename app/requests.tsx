import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FuturisticBackground } from '../components/ui/FuturisticBackground';
import { Colors } from '../theme/colors';
import { scale } from '../lib/responsive';
import { ChevronLeft, Search, X, Send, ChevronRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { fetchApi } from '../lib/api-client';
import { API_ROUTES, resolveImageUrl } from '../lib/api-routes';

type Tab = 'REQUEST' | 'REPORT';

interface SearchResult {
    tmdbId?: string;
    id?: string;
    title: string;
    poster: string | null;
    type: string;
}

export default function RequestsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [activeTab, setActiveTab] = useState<Tab>('REQUEST');
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Debounce manual simple
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 600);
        return () => clearTimeout(handler);
    }, [query]);

    useEffect(() => {
        if (debouncedQuery.length < 3) {
            setResults([]);
            return;
        }
        performSearch();
    }, [debouncedQuery, activeTab]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const url = activeTab === 'REQUEST' 
                ? `${API_ROUTES.REQUESTS.TMDB_SEARCH}?q=${encodeURIComponent(debouncedQuery)}`
                : `${API_ROUTES.REQUESTS.DB_SEARCH}?q=${encodeURIComponent(debouncedQuery)}`;
            
            const data = await fetchApi<any>(url);
            if (data.success) {
                setResults(data.data);
            } else {
                setResults([]);
            }
        } catch (e) {
            console.error(e);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!selectedItem) return;
        if (activeTab === 'REPORT' && message.trim().length < 5) {
            Alert.alert('Error', 'Por favor detalla el reporte (mínimo 5 caracteres).');
            return;
        }

        setSending(true);
        try {
            const payload = {
                type: activeTab,
                message: message.trim(),
                tmdbId: selectedItem.tmdbId,
                tmdbTitle: selectedItem.title,
                tmdbType: selectedItem.type,
                tmdbPoster: selectedItem.poster,
                contentId: selectedItem.id
            };

            await fetchApi(API_ROUTES.REQUESTS.BASE, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            Alert.alert('Éxito', activeTab === 'REQUEST' ? 'Solicitud enviada correctamente' : 'Reporte enviado correctamente');
            setSelectedItem(null);
            setMessage('');
            setQuery('');
            setResults([]);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Error al enviar');
        } finally {
            setSending(false);
        }
    };

    const renderItem = ({ item }: { item: SearchResult }) => (
        <TouchableOpacity style={s.resultCard} onPress={() => setSelectedItem(item)}>
            <Image 
                source={{ uri: item.poster ? resolveImageUrl(item.poster) : 'https://via.placeholder.com/150x225/081026/00D4FF?text=No+Poster' }} 
                style={s.poster} 
                contentFit="cover" 
            />
            <View style={s.resultInfo}>
                <Text style={s.resultTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={s.resultType}>{item.type === 'movie' ? 'Película' : item.type === 'tv' || item.type === 'SERIES' ? 'Serie' : item.type}</Text>
            </View>
            <ChevronRight size={20} color="#00D4FF" />
        </TouchableOpacity>
    );

    return (
        <FuturisticBackground>
            <View style={[s.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <ChevronLeft size={28} color={Colors.white} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Soporte Nuba</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={s.tabs}>
                <TouchableOpacity style={[s.tab, activeTab === 'REQUEST' && s.activeTab]} onPress={() => { setActiveTab('REQUEST'); setQuery(''); }}>
                    <Text style={[s.tabText, activeTab === 'REQUEST' && s.activeTabText]}>SOLICITAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.tab, activeTab === 'REPORT' && s.activeTab]} onPress={() => { setActiveTab('REPORT'); setQuery(''); }}>
                    <Text style={[s.tabText, activeTab === 'REPORT' && s.activeTabText]}>REPORTAR FALLA</Text>
                </TouchableOpacity>
            </View>

            <View style={s.searchContainer}>
                <View style={s.searchInputWrap}>
                    <Search size={20} color={Colors.textMuted} style={s.searchIcon} />
                    <TextInput 
                        style={s.searchInput}
                        placeholder={activeTab === 'REQUEST' ? 'Buscar en TMDB (ej. Avengers)...' : 'Buscar en Nuba (ej. Breaking Bad)...'}
                        placeholderTextColor={Colors.textMuted}
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} style={s.clearBtn}>
                            <X size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#00FF9D" />
                    <Text style={s.loadingText}>Buscando...</Text>
                </View>
            ) : (
                <FlatList 
                    data={results}
                    keyExtractor={item => item.id || item.tmdbId || Math.random().toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
                    ListEmptyComponent={query.length > 2 ? <Text style={s.emptyText}>No se encontraron resultados.</Text> : null}
                />
            )}

            {/* Modal */}
            <Modal visible={!!selectedItem} transparent animationType="slide">
                <View style={s.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalWrapper}>
                        <View style={s.modalContent}>
                            <TouchableOpacity style={s.closeModal} onPress={() => setSelectedItem(null)}>
                                <X size={24} color={Colors.white} />
                            </TouchableOpacity>
                            
                            {selectedItem && (
                                <>
                                    <View style={s.modalHeader}>
                                        <Image source={{ uri: selectedItem.poster ? resolveImageUrl(selectedItem.poster) : 'https://via.placeholder.com/150' }} style={s.modalPoster} contentFit="cover" />
                                        <View style={s.modalHeaderInfo}>
                                            <Text style={s.modalTitle} numberOfLines={2}>{selectedItem.title}</Text>
                                            <Text style={s.modalType}>{activeTab === 'REQUEST' ? 'Solicitar Adición' : 'Reportar Falla'}</Text>
                                        </View>
                                    </View>

                                    <TextInput 
                                        style={s.textArea}
                                        placeholder={activeTab === 'REQUEST' ? 'Comentarios adicionales (Opcional)' : 'Describe la falla, error de audio, subtítulos, etc...'}
                                        placeholderTextColor={Colors.textMuted}
                                        multiline
                                        numberOfLines={4}
                                        value={message}
                                        onChangeText={setMessage}
                                    />

                                    <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending}>
                                        {sending ? (
                                            <ActivityIndicator color={Colors.bg} size="small" />
                                        ) : (
                                            <>
                                                <Send size={18} color={Colors.bg} />
                                                <Text style={s.sendBtnText}>ENVIAR {activeTab === 'REQUEST' ? 'SOLICITUD' : 'REPORTE'}</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </FuturisticBackground>
    );
}

const s = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
    backBtn: { padding: 8 },
    headerTitle: { fontSize: scale(18), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1 },
    
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: '#00D4FF' },
    tabText: { color: Colors.textSecondary, fontSize: scale(13), fontWeight: '800', letterSpacing: 1 },
    activeTabText: { color: Colors.bg, fontWeight: '900' },

    searchContainer: { paddingHorizontal: 16, marginBottom: 10 },
    searchInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, height: 50 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, color: Colors.white, fontSize: scale(14), fontWeight: '600' },
    clearBtn: { padding: 8 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#00FF9D', marginTop: 12, fontSize: scale(14), fontWeight: '800', letterSpacing: 1 },
    emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: scale(14) },

    resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, marginBottom: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    poster: { width: 60, height: 90, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
    resultInfo: { flex: 1, marginLeft: 16 },
    resultTitle: { color: Colors.white, fontSize: scale(15), fontWeight: '800', marginBottom: 6 },
    resultType: { color: '#00FF9D', fontSize: scale(12), fontWeight: '900', textTransform: 'uppercase' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalWrapper: { flex: 1, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#081026', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1.5, borderColor: '#00D4FF' },
    closeModal: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
    
    modalHeader: { flexDirection: 'row', marginBottom: 20 },
    modalPoster: { width: 70, height: 105, borderRadius: 12 },
    modalHeaderInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    modalTitle: { color: Colors.white, fontSize: scale(18), fontWeight: '900', marginBottom: 8 },
    modalType: { color: '#FFD700', fontSize: scale(12), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

    textArea: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', color: Colors.white, fontSize: scale(14), padding: 16, height: 120, textAlignVertical: 'top', marginBottom: 24 },
    
    sendBtn: { backgroundColor: '#00FF9D', borderRadius: 16, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    sendBtnText: { color: Colors.bg, fontSize: scale(14), fontWeight: '900', letterSpacing: 1.5 },
});
