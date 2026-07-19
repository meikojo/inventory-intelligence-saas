/**
 * MathEngine.js
 * Advanced Forecasting and Risk Management Engine for Inventory Intelligence V2
 */

// Calculate Interquartile Range (IQR) and filter outliers
const removeOutliersIQR = (dailySalesArray, sensitivity) => {
  if (dailySalesArray.length < 4) return dailySalesArray; // Not enough data for IQR
  
  const sorted = [...dailySalesArray].sort((a, b) => a - b);
  const q1 = sorted[Math.floor((sorted.length / 4))];
  const q3 = sorted[Math.floor((sorted.length * (3 / 4)))];
  const iqr = q3 - q1;
  
  let multiplier = 1.5; // Medium
  if (sensitivity === 'High') multiplier = 1.0; // Stricter, removes more
  if (sensitivity === 'Low') multiplier = 3.0; // Looser, removes less

  const upperBound = q3 + (multiplier * iqr);
  
  return dailySalesArray.filter(val => val <= upperBound);
};

// Calculate Exponential Weighted Moving Average (EWMA)
const calculateWeightedAverage = (salesRecords, lambda) => {
  if (salesRecords.length === 0) return 0;
  
  // Sort by date descending (newest first)
  const sortedRecords = [...salesRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  const today = new Date();
  
  let totalWeight = 0;
  let weightedSum = 0;

  sortedRecords.forEach(record => {
    const recordDate = new Date(record.date);
    const diffTime = Math.abs(today - recordDate);
    const daysAgo = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Weight decays exponentially based on lambda and days ago
    const weight = Math.exp(-lambda * daysAgo);
    
    weightedSum += record.units * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * Main Advanced Restock Calculator
 * @param {Array} storeSalesData - All sales rows for the store
 * @param {Array} inventoryData - Current inventory state
 * @param {Object} settings - Complex Math Engine settings
 * @returns {Array} List of restock recommendations with confidence, status, etc.
 */
export const runAdvancedAnalysis = (storeSalesData, inventoryData, settings) => {
  
  // 1. Calculate Global ADS (for Bayesian Shrinkage)
  let totalGlobalUnits = 0;
  let totalGlobalDays = new Set();
  storeSalesData.forEach(s => {
    totalGlobalUnits += Number(s.units || 0);
    totalGlobalDays.add(s.date);
  });
  const globalAds = totalGlobalDays.size > 0 ? totalGlobalUnits / totalGlobalDays.size : 0;

  // 2. Group Sales by SKU
  const skuSalesMap = {}; // { sku: [ {date, units, revenue} ] }
  storeSalesData.forEach(row => {
    if (!skuSalesMap[row.sku]) skuSalesMap[row.sku] = [];
    skuSalesMap[row.sku].push({
      date: row.date,
      units: Number(row.units || 0),
      revenue: Number(row.amount || 0)
    });
  });

  const recommendations = [];

  // 3. Process Each Inventory Item
  inventoryData.forEach(item => {
    const sku = item.sku;
    const currentStock = Number(item.quantity || 0);
    const salesRecords = skuSalesMap[sku] || [];
    
    // Derived Metrics
    let totalUnits = 0;
    let totalRevenue = 0;
    const uniqueDaysSet = new Set();

    salesRecords.forEach(r => {
      totalUnits += r.units;
      totalRevenue += r.revenue;
      uniqueDaysSet.add(r.date);
    });

    const daysSold = uniqueDaysSet.size;
    const dynamicPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    let baseAds = 0;
    let confidence = 0; // 0 to 100%

    if (daysSold > 0) {
      // Outlier Removal
      let cleanSalesUnits = salesRecords.map(r => r.units);
      if (settings.outlierSensitivity !== 'None') {
        cleanSalesUnits = removeOutliersIQR(cleanSalesUnits, settings.outlierSensitivity);
      }

      // Calculate Average (Simple or Weighted)
      if (settings.useWeightedRecency) {
        baseAds = calculateWeightedAverage(salesRecords, settings.recencyLambda || 0.1);
      } else {
        const sumClean = cleanSalesUnits.reduce((a, b) => a + b, 0);
        baseAds = sumClean / (settings.adsPeriod || 30); 
      }

      // Bayesian Shrinkage (Shrink towards global mean if low data points)
      if (settings.useBayesianShrinkage) {
        const C = 5; // Confidence threshold parameter (assume 5 days is minimum reliable data)
        baseAds = ((daysSold * baseAds) + (C * globalAds)) / (daysSold + C);
      }
      
      // Confidence Score based on data volume
      confidence = Math.min(100, Math.round((daysSold / (settings.adsPeriod || 30)) * 100));
    }

    // 4. Logistics Math
    const leadTime = settings.leadTime || 0;
    const safetyStock = settings.safetyStock || 0;
    const targetDays = settings.targetDays || 0;

    const reorderPoint = Math.ceil(baseAds * (leadTime + safetyStock));
    let needsRestock = false;
    let initialOrderQty = 0;
    let statusMsg = "آمن";

    if (currentStock <= reorderPoint && baseAds > 0) {
      needsRestock = true;
      statusMsg = "إعادة طلب";
      const targetStockLevel = Math.ceil(baseAds * targetDays);
      initialOrderQty = targetStockLevel - currentStock;
      if (initialOrderQty < 0) initialOrderQty = 0;
    } else if (currentStock === 0 && baseAds === 0) {
      statusMsg = "نفذ تماماً (غير نشط)";
    }

    // 5. Risk Controls & Budget
    let finalOrderQty = initialOrderQty;
    
    if (needsRestock && finalOrderQty > 0) {
      // Max Budget Per SKU Constraint
      if (settings.maxBudgetPerSku > 0 && dynamicPrice > 0) {
        const affordableQty = Math.floor(settings.maxBudgetPerSku / dynamicPrice);
        if (finalOrderQty > affordableQty) {
          finalOrderQty = affordableQty;
          statusMsg = "تم تقليل الكمية (تجاوز الميزانية)";
        }
      }

      // Minimum Quantities (Test Qty)
      if (settings.useTestQty && daysSold < 14) { // Treat as "New" if sold < 14 days
        const isHighPrice = dynamicPrice >= settings.highPriceThreshold;
        const minQty = isHighPrice ? settings.minQtyHigh : settings.minQtyLow;
        if (finalOrderQty < minQty) {
          finalOrderQty = minQty;
          statusMsg = "تطبيق حد التيست الأدنى";
        }
      }
    }

    recommendations.push({
      sku: sku,
      stock: currentStock,
      daysSold: daysSold,
      totalUnits: totalUnits,
      revenue: totalRevenue,
      price: dynamicPrice,
      ads: Number(baseAds.toFixed(2)),
      confidence: confidence,
      reorderPoint: reorderPoint,
      needsRestock: needsRestock,
      suggestedQty: initialOrderQty,
      finalQty: finalOrderQty,
      status: statusMsg,
      include: true // For checkbox in UI
    });
  });

  // Sort: Needs Restock first, then by highest finalQty
  recommendations.sort((a, b) => {
    if (a.needsRestock === b.needsRestock) return b.finalQty - a.finalQty;
    return a.needsRestock ? -1 : 1;
  });

  return recommendations;
};
