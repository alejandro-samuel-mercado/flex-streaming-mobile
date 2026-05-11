import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

interface FAQItem { question: string; answer: string; }

export default function FAQSection({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <HelpCircle size={18} color={Colors.primary} />
        <Text style={s.title}>Preguntas Frecuentes</Text>
      </View>
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <TouchableOpacity key={i} style={[s.item, open && s.itemOpen]} onPress={() => setOpenIndex(open ? null : i)} activeOpacity={0.7}>
            <View style={s.qRow}>
              <Text style={[s.q, open && s.qOpen]}>{item.question}</Text>
              {open ? <ChevronUp size={18} color={Colors.primary} /> : <ChevronDown size={18} color={Colors.textMuted} />}
            </View>
            {open && <Text style={s.a}>{item.answer}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.white, textTransform: 'uppercase' },
  item: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: Colors.borderLight, borderRadius: 16, padding: 20, marginBottom: 8 },
  itemOpen: { borderColor: Colors.primaryBorder, backgroundColor: 'rgba(0,229,255,0.03)' },
  qRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  q: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, flex: 1, marginRight: 12 },
  qOpen: { color: Colors.white },
  a: { fontSize: 14, fontWeight: '500', color: Colors.textMuted, lineHeight: 22, marginTop: 12 },
});
