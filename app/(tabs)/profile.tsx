import React from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ranaColors, ranaRadius, ranaShadow, ranaSpacing } from '@/src/theme/ranaTheme';
import { LANGUAGES, useLanguage } from '@/src/context/LanguageContext';
import { useTravel } from '@/src/context/TravelContext';

export default function ProfileScreen() {
  const { t, langCode, setLanguage } = useLanguage();
  const { trips } = useTravel();

  const [fullName, setFullName] = React.useState('Joshua Fronda');
  const [email, setEmail] = React.useState('juan@example.com');
  const [phone, setPhone] = React.useState('+63 917 123 4567');
  const [dob, setDob] = React.useState('March 15, 1992');
  const [nationality, setNationality] = React.useState('Filipino (PH)');
  const [profileImageUri, setProfileImageUri] = React.useState<string | null>(null);

  const [editVisible, setEditVisible] = React.useState(false);
  const [draftName, setDraftName] = React.useState(fullName);
  const [draftEmail, setDraftEmail] = React.useState(email);
  const [draftPhone, setDraftPhone] = React.useState(phone);
  const [draftDob, setDraftDob] = React.useState(dob);
  const [draftNationality, setDraftNationality] = React.useState(nationality);

  const totalKm = trips.reduce((sum, trip) => sum + trip.distanceKm, 0);
  const countriesVisited = new Set(trips.map((trip) => trip.country.toLowerCase())).size;

  const openEdit = () => {
    setDraftName(fullName);
    setDraftEmail(email);
    setDraftPhone(phone);
    setDraftDob(dob);
    setDraftNationality(nationality);
    setEditVisible(true);
  };

  const saveEdit = () => {
    setFullName(draftName.trim() || fullName);
    setEmail(draftEmail.trim() || email);
    setPhone(draftPhone.trim() || phone);
    setDob(draftDob.trim() || dob);
    setNationality(draftNationality.trim() || nationality);
    setEditVisible(false);
  };

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to update your profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets.length > 0) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const onLogout = () => {
    Alert.alert('Logout', 'You have been logged out.');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This action is permanent. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Account deleted') },
      ]
    );
  };

  return (
    <LinearGradient colors={[ranaColors.backgroundTop, ranaColors.backgroundBottom]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar + edit image */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickProfileImage} activeOpacity={0.85}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={42} color={ranaColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarEditBadge} onPress={pickProfileImage} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={13} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.subtitle}>{t.travelerProfile}</Text>
        <Text style={styles.memberSince}>Member since Jan 2024 · #USR-00421</Text>

        <View style={styles.verifyRow}>
          <View style={styles.verifyChip}>
            <Ionicons name="mail-outline" size={13} color="#166534" />
            <Text style={styles.verifyText}>Email verified</Text>
          </View>
          <View style={styles.verifyChip}>
            <Ionicons name="card-outline" size={13} color="#166534" />
            <Text style={styles.verifyText}>ID verified</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="airplane" size={20} color={ranaColors.primary} />
            <Text style={styles.statValueText}>{trips.length}</Text>
            <Text style={styles.statLabel}>{t.totalTrips}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="flag" size={20} color={ranaColors.primary} />
            <Text style={styles.statValueText}>{countriesVisited}</Text>
            <Text style={styles.statLabel}>{t.countriesVisited}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="speedometer" size={20} color={ranaColors.primary} />
            <Text style={styles.statValueText}>{totalKm.toFixed(0)}</Text>
            <Text style={styles.statLabel}>{t.totalKmTraveled}</Text>
          </View>
        </View>

        {/* Personal info */}
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={16} color={ranaColors.textSecondary} />
          <Text style={styles.sectionTitle}>Personal info</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.personalHeaderRow}>
            <Text style={styles.settingLabel}>Personal info</Text>
            <TouchableOpacity onPress={openEdit} activeOpacity={0.8} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Full name</Text>
              <Text style={styles.infoValue}>{fullName}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{phone}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Date of birth</Text>
              <Text style={styles.infoValue}>{dob}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Nationality</Text>
              <Text style={styles.infoValue}>{nationality}</Text>
            </View>
          </View>
        </View>

        {/* Settings card */}
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={16} color={ranaColors.textSecondary} />
          <Text style={styles.sectionTitle}>{t.settings}</Text>
        </View>

        <View style={styles.card}>
          {/* Language setting */}
          <View style={styles.settingRow}>
            <Ionicons name="language" size={20} color={ranaColors.primary} />
            <Text style={styles.settingLabel}>{t.language}</Text>
          </View>

          {/* Language options */}
          <View style={styles.langList}>
            {LANGUAGES.map((lang, index) => {
              const selected = lang.code === langCode;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langItem,
                    selected && styles.langItemSelected,
                    index < LANGUAGES.length - 1 && styles.langItemBorder,
                  ]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <View>
                      <Text style={[styles.langName, selected && styles.langNameSelected]}>
                        {lang.nativeName}
                      </Text>
                      {lang.nativeName !== lang.label && (
                        <Text style={styles.langSub}>{lang.label}</Text>
                      )}
                    </View>
                  </View>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={ranaColors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Account actions */}
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-outline" size={16} color={ranaColors.textSecondary} />
          <Text style={styles.sectionTitle}>Account</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={onLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color={ranaColors.textPrimary} />
            <Text style={styles.actionText}>Logout</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionRow} onPress={onDeleteAccount} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={styles.actionDeleteText}>Delete account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Edit personal info modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit personal info</Text>

            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput style={styles.input} value={draftName} onChangeText={setDraftName} />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={styles.input} value={draftEmail} onChangeText={setDraftEmail} keyboardType="email-address" />

            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.input} value={draftPhone} onChangeText={setDraftPhone} keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>Date of birth</Text>
            <TextInput style={styles.input} value={draftDob} onChangeText={setDraftDob} />

            <Text style={styles.inputLabel}>Nationality</Text>
            <TextInput style={styles.input} value={draftNationality} onChangeText={setDraftNationality} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingTop: 72,
    paddingHorizontal: ranaSpacing.md,
    paddingBottom: 120,
  },

  // ── Avatar ──
  avatarContainer: {
    position: 'relative',
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...ranaShadow.card,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ranaColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    marginTop: ranaSpacing.sm,
    fontSize: 24,
    fontWeight: '800',
    color: ranaColors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: ranaColors.textSecondary,
  },
  memberSince: {
    marginTop: 6,
    fontSize: 12,
    color: ranaColors.textSecondary,
  },
  verifyRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  verifyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF3',
    borderRadius: ranaRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifyText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },

  // ── Stats row ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: ranaRadius.lg,
    marginTop: ranaSpacing.lg,
    width: '100%',
    paddingVertical: ranaSpacing.sm,
    ...ranaShadow.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: ranaColors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: ranaColors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: ranaColors.accent,
  },

  // ── Section header ──
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: ranaSpacing.lg,
    marginBottom: ranaSpacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Settings card ──
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: ranaRadius.lg,
    overflow: 'hidden',
    ...ranaShadow.soft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: ranaSpacing.md,
    paddingTop: ranaSpacing.sm,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: ranaColors.accent,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ranaColors.textPrimary,
  },
  personalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ranaSpacing.md,
    paddingTop: ranaSpacing.sm,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: ranaColors.accent,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ranaRadius.pill,
    backgroundColor: '#EDF4FF',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ranaColors.primary,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: ranaSpacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: ranaColors.textSecondary,
  },
  infoValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: ranaColors.textPrimary,
  },

  // ── Language list ──
  langList: {
    paddingHorizontal: 4,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ranaSpacing.sm,
    paddingVertical: 14,
    borderRadius: ranaRadius.md,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  langItemSelected: {
    backgroundColor: '#EDF4FF',
  },
  langItemBorder: {
    // subtle separation handled by margin
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langFlag: {
    fontSize: 26,
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
    color: ranaColors.textPrimary,
  },
  langNameSelected: {
    color: ranaColors.primary,
  },
  langSub: {
    fontSize: 12,
    color: ranaColors.textSecondary,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: ranaSpacing.md,
    paddingVertical: 14,
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#EEF2F8',
    marginHorizontal: ranaSpacing.md,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: ranaColors.textPrimary,
  },
  actionDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'center',
    paddingHorizontal: ranaSpacing.md,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: ranaRadius.lg,
    padding: ranaSpacing.md,
    ...ranaShadow.card,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: ranaColors.textPrimary,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: ranaColors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5E0F3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: ranaColors.textPrimary,
    backgroundColor: '#FAFCFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#EEF2F8',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ranaColors.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: ranaColors.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
});

