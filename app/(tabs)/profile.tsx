import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/colors';
import { User, CreditCard, LogOut, ChevronRight, Clock, Settings } from 'lucide-react-native';

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
    const remainingDays = endUser?.endDate
        ? Math.max(0, Math.ceil((new Date(endUser.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 80 : 100 }} showsVerticalScrollIndicator={false}>
            {/* Hero card */}
            <View style={s.heroCard}>
                <View style={s.avatar}><Text style={s.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</Text></View>
                <Text style={s.userName}>{user.name}</Text>
                <Text style={s.userEmail}>{user.email}</Text>
                <View style={s.roleBadge}><Text style={s.roleText}>{user.role}</Text></View>
            </View>

            {/* Plan card */}
            {endUser?.plan && (
                <View style={s.card}>
                    <View style={s.cardHeader}><CreditCard size={18} color={Colors.purple} /><Text style={s.cardTitle}>Suscripción</Text></View>
                    <Text style={s.planName}>{endUser.plan.name}</Text>
                    <Text style={s.planInfo}>Plan de {endUser.plan.durationDays} días</Text>
                    <View style={s.divider} />
                    <View style={s.planRow}><Text style={s.planLabel}>Días restantes</Text><Text style={s.planValue}>{remainingDays}</Text></View>
                    <View style={s.planRow}><Text style={s.planLabel}>Dispositivos</Text><Text style={s.planValue}>{endUser.maxDevices} Máx.</Text></View>
                </View>
            )}

            {/* Nav links */}
            <View style={s.card}>
                <NavLink icon={<Clock size={18} color={Colors.primary} />} label="Historial" onPress={() => router.push('/history' as any)} />

            </View>

            {/* Logout */}
            <TouchableOpacity style={s.logoutBtn} onPress={() => { logout(); router.replace('/(tabs)' as any); }}>
                <LogOut size={18} color={Colors.error} />
                <Text style={s.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function NavLink({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={s.navLink} onPress={onPress} activeOpacity={0.7}>
            {icon}
            <Text style={s.navLinkText}>{label}</Text>
            <ChevronRight size={16} color={Colors.textMuted} />
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: Colors.bg, paddingTop: 56 },
    loader: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
    noAuth: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    noAuthTitle: { fontSize: 22, fontWeight: '900', color: Colors.white, marginTop: 16 },
    noAuthSub: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
    loginBtn: { marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    loginBtnText: { fontSize: 15, fontWeight: '900', color: Colors.black, textTransform: 'uppercase' },
    heroCard: { marginHorizontal: 16, marginBottom: 16, padding: 24, backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center' },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: '900', color: Colors.black },
    userName: { fontSize: 22, fontWeight: '900', color: Colors.white, textTransform: 'uppercase' },
    userEmail: { fontSize: 13, color: Colors.textMuted, marginTop: 4, marginBottom: 12 },
    roleBadge: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    roleText: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, letterSpacing: 2, textTransform: 'uppercase' },
    card: { marginHorizontal: 16, marginBottom: 12, padding: 20, backgroundColor: 'rgba(10,15,36,0.6)', borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 20 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontSize: 13, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', letterSpacing: 2 },
    planName: { fontSize: 24, fontWeight: '900', color: Colors.primary },
    planInfo: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 12 },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginBottom: 12 },
    planRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    planLabel: { fontSize: 13, color: Colors.textMuted },
    planValue: { fontSize: 14, fontWeight: '800', color: Colors.white },
    navLink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    navLinkText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.white },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
    logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
