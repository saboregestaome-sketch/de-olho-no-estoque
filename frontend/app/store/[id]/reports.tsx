import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useAppStore } from '@/src/store/appStore';
import { Footer } from '@/src/components/Footer';

export default function Reports() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { analytics, isLoading, loadAnalytics } = useAppStore();
  
  const [selectedTab, setSelectedTab] = useState<'overview' | 'abc' | 'groups'>('overview');

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    if (id) {
      loadAnalytics(id, currentMonth, currentYear);
    }
  }, [id]);

  if (isLoading || !analytics) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Relatórios</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5f2a" />
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Visão Geral', icon: 'analytics' },
    { key: 'abc', label: 'Curva ABC', icon: 'podium' },
    { key: 'groups', label: 'Por Grupo', icon: 'pie-chart' },
  ];

  // Prepare data for charts
  const groupData = Object.entries(analytics.consumption_by_group)
    .map(([name, value], index) => ({
      value: value,
      label: name.substring(0, 8),
      frontColor: ['#1a5f2a', '#2196F3', '#ff9800', '#9c27b0', '#e53935', '#607d8b'][index % 6],
    }))
    .sort((a, b) => b.value - a.value);

  const pieData = Object.entries(analytics.consumption_by_group)
    .map(([name, value], index) => ({
      value: value,
      color: ['#1a5f2a', '#2196F3', '#ff9800', '#9c27b0', '#e53935', '#607d8b'][index % 6],
      text: name,
    }))
    .filter(item => item.value > 0);

  const abcData = [
    { value: analytics.abc_curve.A.length, label: 'Classe A', frontColor: '#e53935' },
    { value: analytics.abc_curve.B.length, label: 'Classe B', frontColor: '#ff9800' },
    { value: analytics.abc_curve.C.length, label: 'Classe C', frontColor: '#4caf50' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatórios</Text>
        <TouchableOpacity onPress={() => loadAnalytics(id!, currentMonth, currentYear)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={selectedTab === tab.key ? '#1a5f2a' : '#999'} 
            />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {selectedTab === 'overview' && (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="cube" size={24} color="#1a5f2a" />
                <Text style={styles.summaryValue}>R$ {analytics.total_stock_value.toFixed(2)}</Text>
                <Text style={styles.summaryLabel}>Valor em Estoque</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="trending-down" size={24} color="#ff9800" />
                <Text style={styles.summaryValue}>R$ {analytics.total_consumption_value.toFixed(2)}</Text>
                <Text style={styles.summaryLabel}>Consumo Estimado</Text>
              </View>
            </View>

            {/* Alerts */}
            {analytics.products_below_min.length > 0 && (
              <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Ionicons name="warning" size={20} color="#dc3545" />
                  <Text style={styles.alertTitle}>Itens Abaixo do Mínimo ({analytics.products_below_min.length})</Text>
                </View>
                {analytics.products_below_min.slice(0, 5).map((product) => (
                  <View key={product.id} style={styles.alertItem}>
                    <Text style={styles.alertItemName}>{product.name}</Text>
                    <Text style={styles.alertItemValue}>
                      {product.current_stock.toFixed(1)} / {product.min_stock.toFixed(1)} {product.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {analytics.products_above_max.length > 0 && (
              <View style={[styles.alertCard, { borderLeftColor: '#ff9800' }]}>
                <View style={styles.alertHeader}>
                  <Ionicons name="arrow-up-circle" size={20} color="#ff9800" />
                  <Text style={[styles.alertTitle, { color: '#ff9800' }]}>
                    Itens Acima do Máximo ({analytics.products_above_max.length})
                  </Text>
                </View>
                {analytics.products_above_max.slice(0, 5).map((product) => (
                  <View key={product.id} style={styles.alertItem}>
                    <Text style={styles.alertItemName}>{product.name}</Text>
                    <Text style={styles.alertItemValue}>
                      {product.current_stock.toFixed(1)} / {product.max_stock.toFixed(1)} {product.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Purchase Suggestions */}
            {analytics.purchase_suggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sugestões de Compra</Text>
                {analytics.purchase_suggestions.slice(0, 10).map((product) => (
                  <View key={product.id} style={styles.suggestionItem}>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{product.name}</Text>
                      <Text style={styles.suggestionQty}>
                        Comprar: {product.suggested_quantity?.toFixed(1)} {product.unit}
                      </Text>
                    </View>
                    <Text style={styles.suggestionCost}>
                      R$ {product.estimated_cost?.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Low Turnover */}
            {analytics.low_turnover_products.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Produtos com Baixo Giro</Text>
                {analytics.low_turnover_products.slice(0, 5).map((product) => (
                  <View key={product.id} style={styles.lowTurnoverItem}>
                    <Ionicons name="time-outline" size={18} color="#999" />
                    <Text style={styles.lowTurnoverText}>{product.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {selectedTab === 'abc' && (
          <>
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Distribuição Curva ABC</Text>
              <Text style={styles.chartSubtitle}>Número de produtos por classe</Text>
              <View style={styles.chartContainer}>
                <BarChart
                  data={abcData}
                  barWidth={60}
                  spacing={40}
                  roundedTop
                  roundedBottom
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: '#999' }}
                  noOfSections={5}
                  maxValue={Math.max(...abcData.map(d => d.value)) * 1.2 || 10}
                />
              </View>
            </View>

            {/* ABC Lists */}
            <View style={styles.abcSection}>
              <View style={[styles.abcCard, { borderLeftColor: '#e53935' }]}>
                <Text style={styles.abcCardTitle}>Classe A - Alto Impacto</Text>
                <Text style={styles.abcCardSubtitle}>80% do valor de consumo</Text>
                {analytics.abc_curve.A.slice(0, 5).map((p) => (
                  <Text key={p.id} style={styles.abcItem}>
                    • {p.name} - R$ {p.consumption_value.toFixed(2)}
                  </Text>
                ))}
                {analytics.abc_curve.A.length === 0 && (
                  <Text style={styles.abcEmpty}>Nenhum produto</Text>
                )}
              </View>

              <View style={[styles.abcCard, { borderLeftColor: '#ff9800' }]}>
                <Text style={styles.abcCardTitle}>Classe B - Médio Impacto</Text>
                <Text style={styles.abcCardSubtitle}>15% do valor de consumo</Text>
                {analytics.abc_curve.B.slice(0, 5).map((p) => (
                  <Text key={p.id} style={styles.abcItem}>
                    • {p.name} - R$ {p.consumption_value.toFixed(2)}
                  </Text>
                ))}
                {analytics.abc_curve.B.length === 0 && (
                  <Text style={styles.abcEmpty}>Nenhum produto</Text>
                )}
              </View>

              <View style={[styles.abcCard, { borderLeftColor: '#4caf50' }]}>
                <Text style={styles.abcCardTitle}>Classe C - Baixo Impacto</Text>
                <Text style={styles.abcCardSubtitle}>5% do valor de consumo</Text>
                {analytics.abc_curve.C.slice(0, 5).map((p) => (
                  <Text key={p.id} style={styles.abcItem}>
                    • {p.name} - R$ {p.consumption_value.toFixed(2)}
                  </Text>
                ))}
                {analytics.abc_curve.C.length === 0 && (
                  <Text style={styles.abcEmpty}>Nenhum produto</Text>
                )}
              </View>
            </View>
          </>
        )}

        {selectedTab === 'groups' && (
          <>
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Consumo por Grupo</Text>
              <Text style={styles.chartSubtitle}>Valor em R$</Text>
              {groupData.length > 0 ? (
                <View style={styles.chartContainer}>
                  <BarChart
                    data={groupData}
                    barWidth={40}
                    spacing={24}
                    roundedTop
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: '#999' }}
                    noOfSections={5}
                    maxValue={Math.max(...groupData.map(d => d.value)) * 1.2 || 100}
                    labelWidth={60}
                    xAxisLabelTextStyle={{ fontSize: 10, color: '#666' }}
                  />
                </View>
              ) : (
                <Text style={styles.noData}>Sem dados de consumo</Text>
              )}
            </View>

            {/* Group Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalhes por Grupo</Text>
              {Object.entries(analytics.consumption_by_group)
                .sort((a, b) => b[1] - a[1])
                .map(([group, value], index) => (
                  <View key={group} style={styles.groupItem}>
                    <View style={[styles.groupColor, { backgroundColor: ['#1a5f2a', '#2196F3', '#ff9800', '#9c27b0', '#e53935', '#607d8b'][index % 6] }]} />
                    <Text style={styles.groupName}>{group}</Text>
                    <Text style={styles.groupValue}>R$ {value.toFixed(2)}</Text>
                  </View>
                ))}
            </View>
          </>
        )}
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a5f2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1a5f2a',
  },
  tabText: {
    fontSize: 13,
    color: '#999',
  },
  tabTextActive: {
    color: '#1a5f2a',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc3545',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertItemName: {
    fontSize: 14,
    color: '#333',
  },
  alertItemValue: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  suggestionQty: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  suggestionCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f2a',
  },
  lowTurnoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  lowTurnoverText: {
    fontSize: 14,
    color: '#666',
  },
  chartSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 40,
  },
  abcSection: {
    gap: 12,
  },
  abcCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  abcCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  abcCardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
  },
  abcItem: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 4,
  },
  abcEmpty: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  groupName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  groupValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f2a',
  },
});
