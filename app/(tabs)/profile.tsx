import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { User, Calendar, Smartphone, Clock, Heart, ChevronRight, LogOut, Sparkles, Shield, Zap } from 'lucide-react-native';
import { FuturisticBackground } from '../../components/ui/FuturisticBackground';
import { scale } from '../../lib/responsive';

const formatEspanishDate = (d: Date) => {
    const months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
    return `${String(d.getDate()).padStart(2, '0')} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
};

export default function ProfileScreen() {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    if (loading) {
        return (
            <FuturisticBackground style={s.loader}>
                <ActivityIndicator size="large" color="#D946EF" />
            </FuturisticBackground>
        );
    }

    if (!user) {
        return (
            <FuturisticBackground showOrbs={true}>
                <View style={s.noAuth}>
                    <View style={s.cyberCard}>
                        <View style={s.noAuthInner}>
                            <View style={s.iconHex}>
                                <User size={48} color="#D946EF" />
                            </View>
                            <Text style={s.noAuthTitle}>IDENTIFICACIÓN REQUERIDA</Text>
                            <Text style={s.noAuthSub}>Conéctate con los administradores de Nuba para gestionar tu membresía.</Text>
                            <TouchableOpacity style={s.loginBtn} onPress={() => router.push('/(auth)/login' as any)}>
                                <Text style={s.loginBtnText}>CONECTAR AHORA</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </FuturisticBackground>
        );
    }

    const endUser = user.endUserAccount;
    const totalDays = endUser?.plan?.durationDays || 0;
    const endDateObj = endUser?.endDate ? new Date(endUser.endDate) : null;
    const remainingDays = endDateObj ? Math.max(0, Math.ceil((endDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
    const usedDays = Math.max(0, totalDays - remainingDays);
    const progressPercent = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;

    return (
        <FuturisticBackground showOrbs={true}>
            <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 120 : 140 }} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={[s.heroContainer, { paddingTop: insets.top + 16 }]}>
                    <View style={s.avatarWrap}>
                        <View style={s.avatarCyber}>
                            <Text style={s.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text>
                            <View style={s.avatarGlowDot} />
                        </View>
                    </View>
                    <Text style={s.userName}>{user.name}</Text>
                    <View style={s.roleBadge}>
                        <Zap size={14} color="#00FF9D" />
                        <Text style={s.roleText}>USUARIO </Text>
                    </View>
                </View>

                {/* Plan Activo Section */}
                {endUser?.plan && (
                    <>
                        <View style={s.cardWrapper}>
                            <View style={s.cyberCard}>
                                <View style={s.planInner}>
                                    <View style={s.planHeaderRow}>
                                        <View>
                                            <Text style={s.planLabel}>MEMBRESÍA ACTIVA // ID</Text>
                                            <Text style={s.planName}>{endUser.plan.name}</Text>
                                        </View>
                                        <View style={s.activeBadge}>
                                            <View style={s.activeDot} />
                                            <Text style={s.activeText}>ONLINE</Text>
                                        </View>
                                    </View>

                                    <View style={s.progressRowTop}>
                                        <Text style={s.daysUsed}>{usedDays}d transcurridos</Text>
                                        <Text style={s.daysRemaining}>{remainingDays}d restantes</Text>
                                    </View>
                                    
                                    <View style={s.progressBarBg}>
                                        <View style={[s.progressBarFill, { width: `${progressPercent}%` }]} />
                                    </View>

                                    <View style={s.progressRowBottom}>
                                        <Text style={s.progressMuted}>Inicio de ciclo</Text>
                                        <Text style={s.progressMuted}>{totalDays} días totales</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Stats Row */}
                        <View style={s.statsRow}>
                            <View style={s.statCol}>
                                <View style={[s.cyberCardSmall, { borderColor: 'rgba(217, 70, 239, 0.5)' }]}>
                                    <View style={s.statInner}>
                                        <Calendar size={22} color="#D946EF" style={{marginBottom: 8}} />
                                        <Text style={s.statValue}>{endDateObj ? formatEspanishDate(endDateObj) : 'N/A'}</Text>
                                        <Text style={s.statLabel}>VENCIMIENTO</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={s.statCol}>
                                <View style={[s.cyberCardSmall, { borderColor: 'rgba(0, 255, 157, 0.5)' }]}>
                                    <View style={s.statInner}>
                                        <Smartphone size={22} color="#00FF9D" style={{marginBottom: 8}} />
                                        <Text style={[s.statValue, {color: '#00FF9D'}]}>{endUser.maxDevices}</Text>
                                        <Text style={s.statLabel}>DISPOSITIVOS</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Mi Cuenta Section */}
                <View style={s.sectionContainer}>
                    <Text style={s.sectionTitle}>SISTEMA DE ARCHIVOS</Text>
                    <View style={s.cyberCard}>
                        <View>
                            <TouchableOpacity style={s.menuItem} onPress={() => router.push('/history' as any)}>
                                <View style={s.iconWrapperCyan}>
                                    <Clock size={20} color="#00FF9D" />
                                </View>
                                <View style={s.menuItemTexts}>
                                    <Text style={s.menuItemTitle}>Historial de Reproducción</Text>
                                   
                                </View>
                                <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                            
                            <View style={s.menuDivider} />

                            <TouchableOpacity style={s.menuItem} onPress={() => router.push('/favorites' as any)}>
                                <View style={s.iconWrapperPink}>
                                    <Heart size={20} color="#D946EF" />
                                </View>
                                <View style={s.menuItemTexts}>
                                    <Text style={s.menuItemTitle}>Mis Favoritos</Text>
                                    
                                </View>
                                <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Logout */}
                <View style={s.logoutWrapper}>
                    <View style={[s.cyberCardSmall, { borderColor: 'rgba(255, 51, 102, 0.4)' }]}>
                        <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace('/(tabs)' as any); }}>
                            <LogOut size={18} color="#FF3366" />
                            <Text style={s.logoutText}>CERRAR SESIÓN</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </FuturisticBackground>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    noAuth: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    noAuthInner: { padding: 32, alignItems: 'center', justifyContent: 'center' },
    iconHex: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(217, 70, 239, 0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#D946EF', marginBottom: 12 },
    noAuthTitle: { fontSize: scale(20), fontWeight: '900', color: Colors.white, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' },
    noAuthSub: { fontSize: scale(13), color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 22 },
    loginBtn: { marginTop: 24, backgroundColor: '#D946EF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, shadowColor: '#D946EF', shadowRadius: 10, shadowOpacity: 0.8, elevation: 6 },
    loginBtnText: { fontSize: scale(14), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1.5 },
    
    heroContainer: { alignItems: 'center', marginBottom: 28 },
    avatarWrap: { marginBottom: 16 },
    avatarCyber: { width: 96, height: 96, borderTopLeftRadius: 36, borderBottomRightRadius: 36, borderTopRightRadius: 14, borderBottomLeftRadius: 14, backgroundColor: '#0F0826', borderWidth: 2.5, borderColor: '#D946EF', justifyContent: 'center', alignItems: 'center', shadowColor: '#D946EF', shadowRadius: 16, shadowOpacity: 0.6, elevation: 8 },
    avatarText: { fontSize: scale(40), fontWeight: '900', color: '#D946EF' },
    avatarGlowDot: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: 5, backgroundColor: '#00FF9D' },
    userName: { fontSize: scale(26), fontWeight: '900', color: Colors.white, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#00FF9D', backgroundColor: 'rgba(0, 255, 157, 0.15)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    roleText: { fontSize: scale(11), fontWeight: '900', color: '#00FF9D', letterSpacing: 2, textTransform: 'uppercase' },
    
    cardWrapper: { marginHorizontal: 16, marginBottom: 16 },
    cyberCard: { width: '100%', backgroundColor: '#0F0826', borderTopLeftRadius: 36, borderBottomRightRadius: 36, borderTopRightRadius: 14, borderBottomLeftRadius: 14, borderWidth: 1.5, borderColor: '#D946EF', overflow: 'hidden', shadowColor: '#D946EF', shadowRadius: 12, shadowOpacity: 0.4, elevation: 6 },
    cyberCardSmall: { width: '100%', backgroundColor: '#0F0826', borderTopLeftRadius: 24, borderBottomRightRadius: 24, borderTopRightRadius: 8, borderBottomLeftRadius: 8, borderWidth: 1.5, overflow: 'hidden' },
    
    planInner: { padding: 22 },
    planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
    planLabel: { fontSize: scale(11), fontWeight: '900', color: '#00FF9D', letterSpacing: 1.5, marginBottom: 4 },
    planName: { fontSize: scale(24), fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 1 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#00FF9D', backgroundColor: 'rgba(0, 255, 157, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FF9D', shadowColor: '#00FF9D', shadowRadius: 6, shadowOpacity: 1 },
    activeText: { color: '#00FF9D', fontSize: scale(12), fontWeight: '900', letterSpacing: 1 },
    
    progressRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    daysUsed: { fontSize: scale(12), fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.5 },
    daysRemaining: { fontSize: scale(12), fontWeight: '900', color: '#00FF9D' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, marginBottom: 10, overflow: 'hidden' },
    progressBarFill: { height: 8, backgroundColor: '#00FF9D', borderRadius: 4, shadowColor: '#00FF9D', shadowRadius: 6, shadowOpacity: 1 },
    progressRowBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    progressMuted: { fontSize: scale(11), color: Colors.textMuted },
    
    statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 28 },
    statCol: { flex: 1 },
    statInner: { padding: 16, alignItems: 'center' },
    statValue: { fontSize: scale(15), fontWeight: '900', color: '#D946EF', marginBottom: 4, textAlign: 'center' },
    statLabel: { fontSize: scale(10), fontWeight: '900', color: Colors.textMuted, letterSpacing: 1.2 },
    
    sectionContainer: { marginHorizontal: 16, marginBottom: 24 },
    sectionTitle: { fontSize: scale(12), fontWeight: '900', color: '#00FF9D', letterSpacing: 1.5, marginBottom: 12, marginLeft: 6 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
    iconWrapperCyan: { width: 44, height: 44, borderTopLeftRadius: 16, borderBottomRightRadius: 16, borderTopRightRadius: 6, borderBottomLeftRadius: 6, backgroundColor: 'rgba(0, 255, 157, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#00FF9D' },
    iconWrapperPink: { width: 44, height: 44, borderTopLeftRadius: 16, borderBottomRightRadius: 16, borderTopRightRadius: 6, borderBottomLeftRadius: 6, backgroundColor: 'rgba(217, 70, 239, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#D946EF' },
    menuItemTexts: { flex: 1 },
    menuItemTitle: { fontSize: scale(16), fontWeight: '800', color: Colors.white, marginBottom: 2 },
    menuItemSub: { fontSize: scale(12), color: Colors.textMuted },
    menuDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginLeft: 78, marginRight: 18 },
    
    logoutWrapper: { marginHorizontal: 16, marginTop: 4 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
    logoutText: { fontSize: scale(14), fontWeight: '900', color: '#FF3366', letterSpacing: 1.5 },
});
