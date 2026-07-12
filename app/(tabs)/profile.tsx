import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { User, Hexagon, Calendar, Smartphone, Clock, Heart, ChevronRight, LogOut } from 'lucide-react-native';

const formatEspanishDate = (d: Date) => {
    const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
    return `${String(d.getDate()).padStart(2, '0')} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

export default function ProfileScreen() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    if (loading) return <View style={s.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    if (!user) {
        return (
            <View style={s.noAuth}>
                <User size={48} color="rgba(255,255,255,0.1)" />
                <Text style={s.noAuthTitle}>Iniciá sesión</Text>
                <Text style={s.noAuthSub}>Accedé a tu perfil, favoritos e historial.</Text>
                <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/(auth)/login' as any)}>
                    <Text style={s.loginBtnText}>Iniciar Sesión</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const endUser = user.endUserAccount;
    const totalDays = endUser?.plan?.durationDays || 0;
    const endDateObj = endUser?.endDate ? new Date(endUser.endDate) : null;
    const remainingDays = endDateObj ? Math.max(0, Math.ceil((endDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
    const usedDays = Math.max(0, totalDays - remainingDays);
    const progressPercent = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;

    return (
        <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 140 : 160 }} showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View style={s.heroContainer}>
                <View style={s.avatar}>
                    <Text style={s.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
                </View>
                <Text style={s.userName}>{user.name}</Text>
                <View style={s.roleBadge}>
                    <Hexagon size={14} color="#9CA3AF" />
                    <Text style={s.roleText}>USUARIO</Text>
                </View>
            </View>

            {/* Plan Activo Section */}
            {endUser?.plan && (
                <>
                    <View style={s.planCard}>
                        <View style={s.planHeaderRow}>
                            <View>
                                <Text style={s.planLabel}>PLAN ACTIVO</Text>
                                <Text style={s.planName}>{endUser.plan.name}</Text>
                            </View>
                            <View style={s.activeBadge}>
                                <View style={s.activeDot} />
                                <Text style={s.activeText}>Activo</Text>
                            </View>
                        </View>

                        <View style={s.progressRowTop}>
                            <Text style={s.daysUsed}>{usedDays}D USADOS</Text>
                            <Text style={s.daysRemaining}>{remainingDays}d restantes</Text>
                        </View>
                        
                        <View style={s.progressBarBg}>
                            <View style={[s.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>

                        <View style={s.progressRowBottom}>
                            <Text style={s.progressMuted}>Inicio</Text>
                            <Text style={s.progressMuted}>{totalDays}d total</Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={s.statsRow}>
                        <View style={s.statCard}>
                            <Calendar size={22} color={Colors.primary} style={{marginBottom: 10}} />
                            <Text style={s.statValue}>{endDateObj ? formatEspanishDate(endDateObj) : 'N/A'}</Text>
                            <Text style={s.statLabel}>VENCIMIENTO</Text>
                        </View>
                        <View style={s.statCard}>
                            <Smartphone size={22} color="#FF6B00" style={{marginBottom: 10}} />
                            <Text style={[s.statValue, {color: '#FF6B00'}]}>{endUser.maxDevices}</Text>
                            <Text style={s.statLabel}>DISPOSITIVOS</Text>
                        </View>
                    </View>
                </>
            )}

            {/* Mi Cuenta Section */}
            <View style={s.sectionContainer}>
                <Text style={s.sectionTitle}>MI CUENTA</Text>
                <View style={s.menuCard}>
                    <TouchableOpacity style={s.menuItem} onPress={() => router.push('/history' as any)}>
                        <View style={s.iconWrapperCyan}>
                            <Clock size={20} color={Colors.primary} />
                        </View>
                        <View style={s.menuItemTexts}>
                            <Text style={s.menuItemTitle}>Historial</Text>
                            <Text style={s.menuItemSub}>Contenido visto recientemente</Text>
                        </View>
                        <ChevronRight size={18} color="#4B5563" />
                    </TouchableOpacity>
                    
                    <View style={s.menuDivider} />

                    <TouchableOpacity style={s.menuItem} onPress={() => router.push('/favorites' as any)}>
                        <View style={s.iconWrapperPink}>
                            <Heart size={20} color="#EC4899" />
                        </View>
                        <View style={s.menuItemTexts}>
                            <Text style={s.menuItemTitle}>Favoritos</Text>
                            <Text style={s.menuItemSub}>Tu contenido guardado</Text>
                        </View>
                        <ChevronRight size={18} color="#4B5563" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace('/(tabs)' as any); }}>
                <LogOut size={18} color="#EF4444" />
                <Text style={s.logoutText}>CERRAR SESIÓN</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#030712', paddingTop: 60 },
    loader: { flex: 1, backgroundColor: '#030712', justifyContent: 'center', alignItems: 'center' },
    noAuth: { flex: 1, backgroundColor: '#030712', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    noAuthTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, marginTop: 16 },
    noAuthSub: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
    loginBtn: { marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    loginBtnText: { fontSize: 15, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
    
    heroContainer: { alignItems: 'center', marginBottom: 32 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarText: { fontSize: 36, fontWeight: '900', color: Colors.black },
    userName: { fontSize: 24, fontWeight: '900', color: Colors.white, marginBottom: 16 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#1F2937', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24 },
    roleText: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, textTransform: 'uppercase' },
    
    planCard: { marginHorizontal: 16, marginBottom: 16, padding: 20, backgroundColor: '#0B1120', borderWidth: 1, borderColor: '#1E293B', borderRadius: 20 },
    planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    planLabel: { fontSize: 11, fontWeight: '800', color: '#6B7280', letterSpacing: 1, marginBottom: 6 },
    planName: { fontSize: 24, fontWeight: '900', color: Colors.primary },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    activeText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
    
    progressRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    daysUsed: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 0.5 },
    daysRemaining: { fontSize: 12, fontWeight: '800', color: '#10B981' },
    progressBarBg: { height: 6, backgroundColor: '#1F2937', borderRadius: 3, marginBottom: 8 },
    progressBarFill: { height: 6, backgroundColor: '#10B981', borderRadius: 3 },
    progressRowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    progressMuted: { fontSize: 11, color: '#4B5563' },
    
    statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 32 },
    statCard: { flex: 1, backgroundColor: '#0B1120', borderWidth: 1, borderColor: '#1E293B', borderRadius: 20, padding: 20, alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: '900', color: Colors.primary, marginBottom: 6 },
    statLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', letterSpacing: 1 },
    
    sectionContainer: { marginHorizontal: 16, marginBottom: 24 },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    menuCard: { backgroundColor: '#0B1120', borderWidth: 1, borderColor: '#1E293B', borderRadius: 20 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    iconWrapperCyan: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(0, 212, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    iconWrapperPink: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(236, 72, 153, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuItemTexts: { flex: 1 },
    menuItemTitle: { fontSize: 16, fontWeight: '800', color: Colors.white, marginBottom: 2 },
    menuItemSub: { fontSize: 12, color: '#6B7280' },
    menuDivider: { height: 1, backgroundColor: '#1E293B', marginLeft: 76, marginRight: 16 },
    
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginHorizontal: 16, marginTop: 8, paddingVertical: 18, borderRadius: 20, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.15)' },
    logoutText: { fontSize: 14, fontWeight: '900', color: '#EF4444', letterSpacing: 1 },
});
