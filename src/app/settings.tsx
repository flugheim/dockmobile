import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { useSettings } from '../state/SettingsContext';
import { colors, radius } from '../theme';

export default function SettingsScreen() {
  const { settings, environments, selectEnvironment, disconnect, client } = useSettings();
  const [testing, setTesting] = useState(false);

  async function testConnection() {
    if (!client) return;
    setTesting(true);
    try {
      const envs = await client.getEnvironments();
      Alert.alert(
        'Tilkobling OK',
        envs.length === 1
          ? `Tilkoblet ${settings?.baseUrl} (${envs[0].name}).`
          : `Tilkoblet ${settings?.baseUrl} – ${envs.length} miljøer.`,
      );
    } catch (e) {
      Alert.alert('Tilkobling feilet', e instanceof Error ? e.message : String(e));
    } finally {
      setTesting(false);
    }
  }

  function confirmDisconnect() {
    Alert.alert(
      'Fjerne tilkobling?',
      'Token og adresse slettes fra telefonen.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Fjern', style: 'destructive', onPress: () => void disconnect() },
      ],
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.groupTitle}>Tilkobling</Text>
      <View style={styles.card}>
        <Row label="Server" value={settings?.baseUrl ?? '–'} />
        <Row label="Miljø" value={settings?.envName ?? '–'} />
        <Row label="Token" value={'dh_…' + (settings?.token?.slice(-4) ?? '')} />
        <Button
          label="Test tilkobling"
          variant="secondary"
          loading={testing}
          onPress={() => void testConnection()}
          style={{ marginTop: 10 }}
        />
      </View>

      {environments.length > 1 ? (
        <>
          <Text style={styles.groupTitle}>Bytt miljø</Text>
          <View style={styles.card}>
            {environments.map((env) => (
              <Button
                key={env.id}
                label={env.id === settings?.envId ? `✓ ${env.name}` : env.name}
                variant={env.id === settings?.envId ? 'primary' : 'secondary'}
                onPress={() => void selectEnvironment(env)}
                style={{ marginTop: 8 }}
              />
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.groupTitle}>Om appen</Text>
      <View style={styles.card}>
        <Text style={styles.about}>
          Dockhand-mobil er en uavhengig klient for Dockhand. All kommunikasjon går direkte fra
          telefonen til din egen server – ingen data sendes til tredjepart.
        </Text>
        <Text style={styles.about}>
          Bruker du et selvsignert sertifikat, åpne serveren én gang i nettleseren på telefonen og
          godta det, eller kjør Dockhand bak en https-proxy.
        </Text>
      </View>

      <Button
        label="Fjern tilkobling"
        variant="danger"
        onPress={confirmDisconnect}
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 48 },
  groupTitle: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    gap: 10,
  },
  row: { gap: 2 },
  rowLabel: { color: colors.textDim, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  rowValue: { color: colors.text, fontSize: 14 },
  about: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
});
