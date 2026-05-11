import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Crown, Zap } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

interface Plan {
  id: string; name: string; description?: string; price: string;
  durationDays: number; maxDevices: number; hasHd: boolean;
  has4k: boolean; allowDownload: boolean; noAds: boolean;
}

export default function PlanCards({ plans, whatsappNumber }: { plans: Plan[]; whatsappNumber?: string }) {
  if (plans.length === 0) return null;

  const openWhatsApp = (plan: Plan) => {
    const msg = encodeURIComponent(`Hola! Me interesa el plan ${plan.name} ($${plan.price}/mes)`);
    const url = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${msg}` : '#';
    Linking.openURL(url);
  };

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>Planes</Text>
      <Text style={s.sectionSub}>Elegí el plan que mejor se adapte a vos</Text>
      {plans.map((plan, i) => {
        const isPremium = i === 1;
        return (
          <View key={plan.id} style={[s.card, isPremium && s.cardPremium]}>
            {isPremium && (
              <LinearGradient colors={['rgba(0,229,255,0.1)', 'transparent']} style={s.premiumGlow} />
            )}
            <View style={s.cardHeader}>
              {isPremium && <Crown size={16} color={Colors.primary} />}
              <Text style={[s.planName, isPremium && s.planNamePremium]}>{plan.name}</Text>
            </View>
            {plan.description && <Text style={s.planDesc}>{plan.description}</Text>}
            <View style={s.priceRow}>
              <Text style={s.price}>${plan.price}</Text>
              <Text style={s.priceUnit}>/mes</Text>
            </View>
            <View style={s.features}>
              <Feature label={`${plan.maxDevices} dispositivo${plan.maxDevices > 1 ? 's' : ''}`} />
              {plan.hasHd && <Feature label="Calidad HD" />}
              {plan.has4k && <Feature label="Calidad 4K Ultra HD" />}
              {plan.allowDownload && <Feature label="Descargas offline" />}
              {plan.noAds && <Feature label="Sin publicidad" />}
            </View>
            <TouchableOpacity style={[s.btn, isPremium && s.btnPremium]} onPress={() => openWhatsApp(plan)} activeOpacity={0.8}>
              <Zap size={16} color={isPremium ? Colors.black : Colors.primary} />
              <Text style={[s.btnText, isPremium && s.btnTextPremium]}>Suscribirse</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <View style={s.featureRow}>
      <Check size={14} color={Colors.primary} />
      <Text style={s.featureText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: Colors.white, textTransform: 'uppercase', marginBottom: 4 },
  sectionSub: { fontSize: 13, color: Colors.textMuted, marginBottom: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 20, padding: 24, marginBottom: 12, position: 'relative', overflow: 'hidden' },
  cardPremium: { borderColor: Colors.primaryBorder },
  premiumGlow: { ...StyleSheet.absoluteFillObject },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: '900', color: Colors.white, textTransform: 'uppercase' },
  planNamePremium: { color: Colors.primary },
  planDesc: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16 },
  price: { fontSize: 36, fontWeight: '900', color: Colors.white },
  priceUnit: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  features: { gap: 8, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.primaryBorder, backgroundColor: 'rgba(0,229,255,0.05)' },
  btnPremium: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  btnText: { fontSize: 14, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  btnTextPremium: { color: Colors.black },
});
