import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  Linking,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../constants/colors';
import { useGangStore } from '../../store/gangStore';
import { GangMember, GangMemberStatus } from '../../types';
import { useTheme } from '../../hooks/useTheme';

const STATUS_CONFIG: Record<GangMemberStatus, { label: string; color: string; icon: string }> = {
  recherché: { label: 'Recherché', color: '#FF4500', icon: 'alert-circle' },
  actif: { label: 'Actif', color: '#FF0000', icon: 'radio-button-on' },
  arrêté: { label: 'Arrêté', color: '#22C55E', icon: 'lock-closed' },
  décédé: { label: 'Décédé', color: '#8892B0', icon: 'skull' },
};

const DANGER_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#FF8C00',
  3: '#FF4500',
  4: '#FF0000',
};

const DANGER_LABELS: Record<number, string> = {
  1: 'Faible',
  2: 'Modéré',
  3: 'Élevé',
  4: 'Extrême',
};

const STATUS_FILTERS: { key: GangMemberStatus | null; label: string }[] = [
  { key: null, label: 'Tous' },
  { key: 'recherché', label: 'Recherchés' },
  { key: 'actif', label: 'Actifs' },
  { key: 'arrêté', label: 'Arrêtés' },
  { key: 'décédé', label: 'Décédés' },
];

export default function GangsTab() {
  const { search, statusFilter, setSearch, setStatusFilter, getFiltered } = useGangStore();
  const [selected, setSelected] = useState<GangMember | null>(null);
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);

  const filtered = getFiltered();

  return (
    <View style={styles.container}>
      {/* Warning banner */}
      <View style={styles.warningBanner}>
        <Ionicons name="shield-checkmark" size={14} color={C.warning} />
        <Text style={styles.warningText}>
          Informations issues de sources publiques et rapports officiels
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Alias, vrai nom, gang, zone…"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          const cfg = f.key ? STATUS_CONFIG[f.key] : null;
          return (
            <TouchableOpacity
              key={String(f.key)}
              style={[styles.filterChip, active && { backgroundColor: cfg?.color ?? C.primary, borderColor: cfg?.color ?? C.primary }]}
              onPress={() => setStatusFilter(active ? null : f.key)}
            >
              {cfg && <Ionicons name={cfg.icon as any} size={11} color={active ? '#fff' : cfg.color} />}
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count */}
      <Text style={styles.countLabel}>
        {filtered.length} membre{filtered.length !== 1 ? 's' : ''} répertorié{filtered.length !== 1 ? 's' : ''}
      </Text>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MemberCard member={item} onPress={() => setSelected(item)} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={C.textMuted} />
            <Text style={styles.emptyText}>Aucun résultat</Text>
          </View>
        }
      />

      {/* Detail modal */}
      {selected && (
        <MemberDetailModal member={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

function MemberCard({ member, onPress }: { member: GangMember; onPress: () => void }) {
  const C = useTheme();
  const styles = useMemo(() => makeMemberCardStyles(C), [C]);
  const statusCfg = STATUS_CONFIG[member.status];
  const dangerColor = DANGER_COLORS[member.dangerLevel];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardStripe, { backgroundColor: dangerColor }]} />
      <View style={styles.cardBody}>
        <View style={[styles.avatar, { borderColor: dangerColor }]}>
          {member.photoUris?.[0] || member.photoUri ? (
            <Image
              source={{ uri: (member.photoUris?.[0] ?? member.photoUri)! }}
              style={styles.avatarPhoto}
            />
          ) : (
            <Ionicons name="person" size={24} color={dangerColor} />
          )}
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardTopRow}>
            <Text style={styles.alias}>{member.alias}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${statusCfg.color}25`, borderColor: statusCfg.color }]}>
              <Ionicons name={statusCfg.icon as any} size={10} color={statusCfg.color} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>
          {member.realName && <Text style={styles.realName}>{member.realName}</Text>}
          <View style={styles.gangRow}>
            <Text style={styles.gangName}>{member.gang}</Text>
            {member.dcpjRef && (
              <View style={styles.dcpjPill}>
                <Ionicons name="shield-checkmark" size={10} color="#00BFFF" />
                <Text style={styles.dcpjPillText}>DCPJ</Text>
              </View>
            )}
          </View>
          <View style={styles.cardBottomRow}>
            <View style={[styles.dangerBadge, { backgroundColor: `${dangerColor}20` }]}>
              <Text style={[styles.dangerText, { color: dangerColor }]}>
                Danger {DANGER_LABELS[member.dangerLevel]}
              </Text>
            </View>
            <View style={styles.territoryRow}>
              <Ionicons name="location-outline" size={11} color={C.textMuted} />
              <Text style={styles.territory} numberOfLines={1}>
                {member.territory.slice(0, 2).join(', ')}
                {member.territory.length > 2 ? '…' : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function MemberDetailModal({ member, onClose }: { member: GangMember; onClose: () => void }) {
  const C = useTheme();
  const styles = useMemo(() => makeModalStyles(C), [C]);
  const statusCfg = STATUS_CONFIG[member.status];
  const dangerColor = DANGER_COLORS[member.dangerLevel];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const photos: string[] = member.photoUris?.length
    ? member.photoUris
    : member.photoUri
    ? [member.photoUri]
    : [];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Ionicons name="close" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Fiche d'identité</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Lightbox */}
        {lightboxIndex !== null && (
          <Modal visible transparent animationType="fade" onRequestClose={() => setLightboxIndex(null)}>
            <View style={styles.lightboxOverlay}>
              <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxIndex(null)}>
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: lightboxIndex * SCREEN_WIDTH, y: 0 }}
              >
                {photos.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={styles.lightboxImage}
                    resizeMode="contain"
                  />
                ))}
              </ScrollView>
              {photos.length > 1 && (
                <Text style={styles.lightboxCounter}>
                  {lightboxIndex + 1} / {photos.length}
                </Text>
              )}
            </View>
          </Modal>
        )}

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.profileHeader, { borderColor: dangerColor }]}>
            {photos.length > 0 ? (
              <View style={styles.photoGallery}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                  {photos.map((uri, i) => (
                    <TouchableOpacity key={i} onPress={() => setLightboxIndex(i)} activeOpacity={0.85}>
                      <Image
                        source={{ uri }}
                        style={[styles.photoThumb, i === 0 && { borderColor: dangerColor, borderWidth: 2 }]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {photos.length > 1 && (
                  <Text style={styles.photoCount}>
                    <Ionicons name="images-outline" size={11} color={C.textMuted} /> {photos.length} photos
                  </Text>
                )}
              </View>
            ) : (
              <View style={[styles.avatarLarge, { borderColor: dangerColor, backgroundColor: `${dangerColor}15` }]}>
                <Ionicons name="person" size={48} color={dangerColor} />
              </View>
            )}
            <Text style={styles.modalAlias}>{member.alias}</Text>
            {member.realName && <Text style={styles.modalRealName}>{member.realName}</Text>}
            <View style={styles.modalPillRow}>
              <View style={[styles.statusPill, { backgroundColor: `${statusCfg.color}25`, borderColor: statusCfg.color }]}>
                <Ionicons name={statusCfg.icon as any} size={12} color={statusCfg.color} />
                <Text style={[styles.statusText, { color: statusCfg.color, fontSize: 13 }]}>{statusCfg.label}</Text>
              </View>
              <View style={[styles.dangerBadge, { backgroundColor: `${dangerColor}20`, paddingHorizontal: 12, paddingVertical: 5 }]}>
                <Text style={[styles.dangerText, { color: dangerColor, fontSize: 13 }]}>
                  Danger {DANGER_LABELS[member.dangerLevel]}
                </Text>
              </View>
            </View>
          </View>

          {member.dcpjRef && (
            <TouchableOpacity
              style={styles.dcpjButton}
              onPress={() => Linking.openURL(member.dcpjRef!)}
              activeOpacity={0.75}
            >
              <Ionicons name="shield-checkmark" size={16} color="#00BFFF" />
              <Text style={styles.dcpjButtonText}>Fiche officielle DCPJ</Text>
              <Ionicons name="open-outline" size={14} color="#00BFFF" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          <DetailSection icon="people" label="Gang" color={C.primary} styles={styles}>
            <Text style={styles.detailValue}>{member.gang}</Text>
          </DetailSection>

          <DetailSection icon="map" label="Territoire" color={C.warning} styles={styles}>
            <View style={styles.tagRow}>
              {member.territory.map((t) => (
                <View key={t} style={styles.tag}>
                  <Ionicons name="location-outline" size={11} color={C.textMuted} />
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </DetailSection>

          <DetailSection icon="document-text" label="Chefs d'accusation" color={C.danger} styles={styles}>
            {member.charges.map((c) => (
              <View key={c} style={styles.chargeRow}>
                <View style={styles.chargeDot} />
                <Text style={styles.chargeText}>{c}</Text>
              </View>
            ))}
          </DetailSection>

          {member.lastSeen && (
            <DetailSection icon="time" label="Dernière localisation connue" color={C.textMuted} styles={styles}>
              <Text style={styles.detailValue}>
                {new Date(member.lastSeen).toLocaleDateString('fr-FR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </Text>
            </DetailSection>
          )}

          <DetailSection icon="information-circle" label="Contexte" color={C.textSecondary} styles={styles}>
            <Text style={[styles.detailValue, { lineHeight: 20 }]}>{member.description}</Text>
          </DetailSection>

          <View style={styles.legalNote}>
            <Ionicons name="shield-outline" size={14} color={C.textMuted} />
            <Text style={styles.legalText}>
              Ces informations sont issues de sources journalistiques et rapports officiels. Ne pas harceler, accuser sans preuve, ni se faire justice soi-même.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DetailSection({
  icon, label, color, children, styles,
}: {
  icon: string;
  label: string;
  color: string;
  children: React.ReactNode;
  styles: ReturnType<typeof makeModalStyles>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={15} color={color} />
        <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.black },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: `${C.warning}15`,
      borderBottomWidth: 1,
      borderBottomColor: `${C.warning}30`,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    warningText: { color: C.warning, fontSize: 11, flex: 1, lineHeight: 15 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      margin: 12,
      backgroundColor: C.surface,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    searchInput: { flex: 1, color: C.text, fontSize: 14 },
    filterRow: { maxHeight: 38 },
    filterContent: { paddingHorizontal: 12, gap: 6, alignItems: 'center' },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.dark,
    },
    filterChipText: { color: C.textMuted, fontSize: 12, fontWeight: '500' },
    filterChipTextActive: { color: '#fff', fontWeight: '700' },
    countLabel: { color: C.textMuted, fontSize: 11, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
    list: { paddingHorizontal: 12, paddingBottom: 30, gap: 10, paddingTop: 6 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { color: C.textMuted, fontSize: 14 },
  });
}

function makeMemberCardStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.dark,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.border,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    cardStripe: { width: 4 },
    cardBody: { flex: 1, flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
    avatar: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: C.surface, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarPhoto: { width: 52, height: 52, borderRadius: 26 },
    cardInfo: { flex: 1, gap: 3 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    alias: { color: C.text, fontSize: 16, fontWeight: '800', flex: 1 },
    realName: { color: C.textSecondary, fontSize: 12 },
    gangRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    gangName: { color: C.primary, fontSize: 13, fontWeight: '600' },
    dcpjPill: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: 'rgba(0,191,255,0.12)', borderRadius: 6,
      paddingHorizontal: 5, paddingVertical: 2,
      borderWidth: 1, borderColor: 'rgba(0,191,255,0.35)',
    },
    dcpjPillText: { color: '#00BFFF', fontSize: 10, fontWeight: '700' },
    cardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' },
    dangerBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    dangerText: { fontSize: 11, fontWeight: '700' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
    statusText: { fontSize: 11, fontWeight: '700' },
    territoryRow: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
    territory: { color: C.textMuted, fontSize: 11, flex: 1 },
  });
}

function makeModalStyles(C: ThemeColors) {
  return StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: C.black },
    modalHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: C.border,
    },
    modalClose: { padding: 2 },
    modalTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
    modalContent: { padding: 16, gap: 16, paddingBottom: 40 },
    profileHeader: {
      alignItems: 'center', gap: 8, paddingVertical: 20,
      borderWidth: 1, borderRadius: 16, backgroundColor: C.dark,
    },
    avatarLarge: {
      width: 88, height: 88, borderRadius: 44, borderWidth: 3,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    modalAlias: { color: C.text, fontSize: 24, fontWeight: '900' },
    modalRealName: { color: C.textSecondary, fontSize: 14 },
    modalPillRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
    statusText: { fontSize: 11, fontWeight: '700' },
    dangerBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    dangerText: { fontSize: 11, fontWeight: '700' },
    section: {
      backgroundColor: C.dark, borderRadius: 12, borderWidth: 1,
      borderColor: C.border, padding: 14, gap: 10,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionBody: { gap: 6 },
    detailValue: { color: C.text, fontSize: 14 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: C.surface, borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 4,
      borderWidth: 1, borderColor: C.border,
    },
    tagText: { color: C.textSecondary, fontSize: 12 },
    chargeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    chargeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.danger },
    chargeText: { color: C.text, fontSize: 13 },
    dcpjButton: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: 'rgba(0,191,255,0.08)',
      borderWidth: 1, borderColor: 'rgba(0,191,255,0.35)',
      borderRadius: 12, padding: 14,
    },
    dcpjButtonText: { color: '#00BFFF', fontSize: 14, fontWeight: '700', flex: 1 },
    legalNote: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: C.surface, borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: C.border,
    },
    legalText: { color: C.textMuted, fontSize: 11, flex: 1, lineHeight: 16 },
    photoGallery: { alignItems: 'center', gap: 6, width: '100%' },
    photoRow: { paddingHorizontal: 8, gap: 8, alignItems: 'center' },
    photoThumb: {
      width: 80, height: 80, borderRadius: 10,
      backgroundColor: C.surface,
    },
    photoCount: { color: C.textMuted, fontSize: 11 },
    lightboxOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
      justifyContent: 'center',
    },
    lightboxClose: {
      position: 'absolute', top: 48, right: 16, zIndex: 10,
    },
    lightboxImage: {
      width: SCREEN_WIDTH,
      height: SCREEN_WIDTH,
    },
    lightboxCounter: {
      position: 'absolute', bottom: 48, alignSelf: 'center',
      color: 'rgba(255,255,255,0.7)', fontSize: 13,
    },
  });
}
