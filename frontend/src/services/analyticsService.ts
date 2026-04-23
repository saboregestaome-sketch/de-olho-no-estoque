import { Product, StockCount, StoreAnalytics, ProductAnalytics } from '../types';

class AnalyticsService {
  calculateStoreAnalytics(products: Product[], stockCounts: StockCount[]): StoreAnalytics {
    // Build product map
    const productMap: Record<string, Product> = {};
    products.forEach(p => {
      productMap[p.id] = p;
    });

    // Group stock counts by product
    const productCounts: Record<string, StockCount[]> = {};
    stockCounts.forEach(count => {
      if (!productCounts[count.product_id]) {
        productCounts[count.product_id] = [];
      }
      productCounts[count.product_id].push(count);
    });

    const analytics: StoreAnalytics = {
      total_stock_value: 0,
      total_consumption_value: 0,
      products_below_min: [],
      products_above_max: [],
      low_turnover_products: [],
      high_cost_products: [],
      purchase_suggestions: [],
      abc_curve: { A: [], B: [], C: [] },
      consumption_by_group: {},
      product_analytics: []
    };

    const productConsumptions: { id: string, value: number, data: ProductAnalytics }[] = [];

    Object.keys(productMap).forEach(pid => {
      const product = productMap[pid];
      const counts = productCounts[pid] || [];

      // Sort by week/month/year
      counts.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return a.week_number - b.week_number;
      });

      const currentStock = counts.length > 0 ? counts[counts.length - 1].quantity : 0;
      const lastPrice = product.last_purchase_price || 0;
      const minStock = product.min_stock || 0;
      const maxStock = product.max_stock || 0;
      const group = product.group || 'Outros';

      // Calculate consumption
      let totalConsumption = 0;
      if (counts.length >= 2) {
        for (let i = 1; i < counts.length; i++) {
          const prevQty = counts[i - 1].quantity;
          const currQty = counts[i].quantity;
          if (currQty < prevQty) {
            totalConsumption += (prevQty - currQty);
          }
        }
      }

      const avgConsumption = totalConsumption / Math.max(counts.length - 1, 1);
      const consumptionValue = totalConsumption * lastPrice;
      const stockValue = currentStock * lastPrice;

      analytics.total_stock_value += stockValue;
      analytics.total_consumption_value += consumptionValue;

      if (!analytics.consumption_by_group[group]) {
        analytics.consumption_by_group[group] = 0;
      }
      analytics.consumption_by_group[group] += consumptionValue;

      const productData: ProductAnalytics = {
        id: pid,
        name: product.name,
        group: group,
        unit: product.unit,
        current_stock: currentStock,
        min_stock: minStock,
        max_stock: maxStock,
        last_price: lastPrice,
        total_consumption: totalConsumption,
        avg_consumption: avgConsumption,
        consumption_value: consumptionValue,
        stock_value: stockValue
      };

      analytics.product_analytics.push(productData);
      productConsumptions.push({ id: pid, value: consumptionValue, data: productData });

      // Check stock levels
      if (currentStock < minStock) {
        analytics.products_below_min.push(productData);
        const suggestedQty = maxStock - currentStock;
        analytics.purchase_suggestions.push({
          ...productData,
          suggested_quantity: suggestedQty,
          estimated_cost: suggestedQty * lastPrice
        });
      }

      if (maxStock > 0 && currentStock > maxStock) {
        analytics.products_above_max.push(productData);
      }

      // Low turnover
      if (currentStock > 0 && avg_consumption > 0) {
        const turnoverRate = avg_consumption / currentStock;
        if (turnoverRate < 0.1) {
          analytics.low_turnover_products.push(productData);
        }
      }
    });

    // ABC Curve
    productConsumptions.sort((a, b) => b.value - a.value);
    const totalVal = analytics.total_consumption_value;
    if (totalVal > 0) {
      let cumulative = 0;
      productConsumptions.forEach(item => {
        cumulative += item.value;
        const percentage = (cumulative / totalVal) * 100;
        if (percentage <= 80) {
          analytics.abc_curve.A.push(item.data);
          analytics.high_cost_products.push(item.data);
        } else if (percentage <= 95) {
          analytics.abc_curve.B.push(item.data);
        } else {
          analytics.abc_curve.C.push(item.data);
        }
      });
    }

    analytics.high_cost_products = analytics.high_cost_products.slice(0, 10);
    return analytics;
  }

  generateWeeklyReportMessage(storeName: string, analytics: StoreAnalytics, week: number, month: number, year: number): string {
    const reportLines = [
      "📦 *Relatório de Estoque - Contagem Semanal*",
      "",
      `🏪 *Loja:* ${storeName}`,
      `📅 *Semana:* ${week} | Mês: ${month}/${year}`,
      "",
      "📊 *Resumo:*",
      `• Valor total em estoque: R$ ${analytics.total_stock_value.toFixed(2)}`,
      `• Consumo estimado: R$ ${analytics.total_consumption_value.toFixed(2)}`,
      ""
    ];

    if (analytics.products_below_min.length > 0) {
      reportLines.push("⚠️ *Itens abaixo do mínimo:*");
      analytics.products_below_min.slice(0, 10).forEach(p => {
        reportLines.push(`• ${p.name}: ${p.current_stock.toFixed(1)} ${p.unit} (mín: ${p.min_stock.toFixed(1)})`);
      });
      reportLines.push("");
    }

    if (analytics.purchase_suggestions.length > 0) {
      reportLines.push("📦 *Sugestão de compra:*");
      analytics.purchase_suggestions.slice(0, 10).forEach(p => {
        reportLines.push(`• ${p.name}: ${p.suggested_quantity?.toFixed(1)} ${p.unit} (R$ ${p.estimated_cost?.toFixed(2)})`);
      });
      reportLines.push("");
    }

    if (analytics.low_turnover_products.length > 0) {
      reportLines.push("📉 *Itens com baixo giro:*");
      analytics.low_turnover_products.slice(0, 5).forEach(p => {
        reportLines.push(`• ${p.name}`);
      });
      reportLines.push("");
    }

    if (analytics.abc_curve.A.length > 0) {
      reportLines.push("🔴 *Produtos mais caros (Classe A):*");
      analytics.abc_curve.A.slice(0, 5).forEach(p => {
        reportLines.push(`• ${p.name}: R$ ${p.consumption_value.toFixed(2)}`);
      });
      reportLines.push("");
    }

    // Top group
    const groups = Object.entries(analytics.consumption_by_group);
    if (groups.length > 0) {
      const topGroup = groups.reduce((a, b) => a[1] > b[1] ? a : b);
      reportLines.push(`📊 *Grupo com maior custo:* ${topGroup[0]} (R$ ${topGroup[1].toFixed(2)})`);
      reportLines.push("");
    }

    const observations = [];
    if (analytics.products_below_min.length > 0) observations.push(`⚠️ ${analytics.products_below_min.length} produto(s) precisam de reposição urgente`);
    if (analytics.products_above_max.length > 0) observations.push(`📈 ${analytics.products_above_max.length} produto(s) com estoque acima do máximo`);
    if (analytics.low_turnover_products.length > 0) observations.push(`📉 ${analytics.low_turnover_products.length} produto(s) com baixo giro - avaliar necessidade`);

    if (observations.length > 0) {
      reportLines.push("✔️ *Observações automáticas:*");
      observations.forEach(obs => reportLines.push(obs));
    }

    reportLines.push("");
    reportLines.push("👨‍🍳 *Chef Felipe Matias*");

    return reportLines.join('\n');
  }
}

export const analyticsService = new AnalyticsService();
