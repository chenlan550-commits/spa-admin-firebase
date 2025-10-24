// 報表統計服務
import { getAllVisits, getVisitsByDateRange } from './visitService';
import { getAllCustomers } from './customerService';
import { getAllBookings } from './bookingService';

/**
 * 取得營收報表
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @returns {Promise<Object>} 營收統計
 */
export const getRevenueReport = async (startDate, endDate) => {
  try {
    const visits = await getVisitsByDateRange(startDate, endDate);

    // 按日期分組統計
    const dailyRevenue = {};
    const paymentMethodRevenue = {
      cash: 0,
      card: 0,
      deposit: 0
    };

    let totalRevenue = 0;
    let totalVisits = visits.length;

    visits.forEach(visit => {
      const visitDate = visit.visitDate?.toDate?.();
      if (!visitDate) return;

      const dateKey = visitDate.toLocaleDateString('zh-TW');
      const price = visit.finalPrice || visit.price || 0;

      // 每日營收累計
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = {
          date: dateKey,
          revenue: 0,
          visits: 0,
          cash: 0,
          card: 0,
          deposit: 0
        };
      }

      dailyRevenue[dateKey].revenue += price;
      dailyRevenue[dateKey].visits += 1;

      // 付款方式統計
      const paymentMethod = visit.paymentMethod || 'cash';
      dailyRevenue[dateKey][paymentMethod] += price;
      paymentMethodRevenue[paymentMethod] += price;

      totalRevenue += price;
    });

    // 轉換為陣列並排序
    const dailyRevenueArray = Object.values(dailyRevenue).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    // 計算平均值
    const avgDailyRevenue = dailyRevenueArray.length > 0
      ? totalRevenue / dailyRevenueArray.length
      : 0;

    const avgVisitsPerDay = dailyRevenueArray.length > 0
      ? totalVisits / dailyRevenueArray.length
      : 0;

    return {
      totalRevenue,
      totalVisits,
      avgDailyRevenue,
      avgVisitsPerDay,
      dailyRevenue: dailyRevenueArray,
      paymentMethodRevenue,
      startDate: startDate.toLocaleDateString('zh-TW'),
      endDate: endDate.toLocaleDateString('zh-TW')
    };
  } catch (error) {
    console.error('取得營收報表失敗:', error);
    throw error;
  }
};

/**
 * 取得客戶消費排行
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @param {number} limit - 顯示數量，預設 10
 * @returns {Promise<Array>} 客戶排行列表
 */
export const getCustomerRanking = async (startDate, endDate, limit = 10) => {
  try {
    const visits = await getVisitsByDateRange(startDate, endDate);
    const customers = await getAllCustomers();

    // 建立客戶消費統計
    const customerStats = {};

    visits.forEach(visit => {
      const customerId = visit.customerId;
      if (!customerId) return;

      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          customerId,
          customerName: visit.customerName,
          totalSpent: 0,
          visitCount: 0,
          services: new Set()
        };
      }

      const price = visit.finalPrice || visit.price || 0;
      customerStats[customerId].totalSpent += price;
      customerStats[customerId].visitCount += 1;
      if (visit.serviceName) {
        customerStats[customerId].services.add(visit.serviceName);
      }
    });

    // 加入客戶詳細資訊
    const ranking = Object.values(customerStats).map(stat => {
      const customer = customers.find(c => c.id === stat.customerId);
      return {
        ...stat,
        services: Array.from(stat.services),
        membershipLevel: customer?.membershipLevel || 'regular',
        phone: customer?.phone || '',
        email: customer?.email || ''
      };
    });

    // 按消費金額排序
    ranking.sort((a, b) => b.totalSpent - a.totalSpent);

    return ranking.slice(0, limit);
  } catch (error) {
    console.error('取得客戶排行失敗:', error);
    throw error;
  }
};

/**
 * 取得熱門療程分析
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @returns {Promise<Array>} 療程統計列表
 */
export const getPopularServices = async (startDate, endDate) => {
  try {
    const visits = await getVisitsByDateRange(startDate, endDate);
    const bookings = await getAllBookings();

    // 療程統計
    const serviceStats = {};

    // 統計來店記錄
    visits.forEach(visit => {
      const serviceName = visit.serviceName;
      if (!serviceName) return;

      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = {
          serviceName,
          visitCount: 0,
          bookingCount: 0,
          totalRevenue: 0,
          avgPrice: 0
        };
      }

      const price = visit.finalPrice || visit.price || 0;
      serviceStats[serviceName].visitCount += 1;
      serviceStats[serviceName].totalRevenue += price;
    });

    // 統計預約記錄（在日期範圍內）
    bookings.forEach(booking => {
      const bookingDate = booking.bookingDate?.toDate?.();
      if (!bookingDate || bookingDate < startDate || bookingDate > endDate) {
        return;
      }

      const serviceName = booking.serviceName;
      if (!serviceName) return;

      if (!serviceStats[serviceName]) {
        serviceStats[serviceName] = {
          serviceName,
          visitCount: 0,
          bookingCount: 0,
          totalRevenue: 0,
          avgPrice: 0
        };
      }

      serviceStats[serviceName].bookingCount += 1;
    });

    // 計算平均價格
    const result = Object.values(serviceStats).map(stat => ({
      ...stat,
      avgPrice: stat.visitCount > 0 ? stat.totalRevenue / stat.visitCount : 0,
      totalCount: stat.visitCount + stat.bookingCount
    }));

    // 按總次數排序
    result.sort((a, b) => b.totalCount - a.totalCount);

    return result;
  } catch (error) {
    console.error('取得熱門療程分析失敗:', error);
    throw error;
  }
};

/**
 * 取得會員等級分布
 * @returns {Promise<Object>} 會員統計
 */
export const getMembershipDistribution = async () => {
  try {
    const customers = await getAllCustomers();

    const distribution = {
      regular: { count: 0, totalBalance: 0, avgBalance: 0 },
      deposit_20k: { count: 0, totalBalance: 0, avgBalance: 0 },
      deposit_30k: { count: 0, totalBalance: 0, avgBalance: 0 },
      deposit_50k: { count: 0, totalBalance: 0, avgBalance: 0 },
      vip: { count: 0, totalBalance: 0, avgBalance: 0 }
    };

    let totalCustomers = customers.length;
    let totalBalance = 0;

    customers.forEach(customer => {
      const level = customer.membershipLevel || 'regular';
      const balance = customer.balance || 0;

      if (distribution[level]) {
        distribution[level].count += 1;
        distribution[level].totalBalance += balance;
        totalBalance += balance;
      }
    });

    // 計算平均餘額
    Object.keys(distribution).forEach(level => {
      const count = distribution[level].count;
      if (count > 0) {
        distribution[level].avgBalance = distribution[level].totalBalance / count;
      }
    });

    // VIP 統計
    const vipStats = {
      activeVIP: customers.filter(c => {
        if (!c.isVIP || !c.vipEndDate) return false;
        const endDate = c.vipEndDate.toDate ? c.vipEndDate.toDate() : new Date(c.vipEndDate);
        return endDate > new Date();
      }).length,
      expiredVIP: customers.filter(c => {
        if (!c.isVIP || !c.vipEndDate) return false;
        const endDate = c.vipEndDate.toDate ? c.vipEndDate.toDate() : new Date(c.vipEndDate);
        return endDate <= new Date();
      }).length,
      eligibleForVIP: customers.filter(c => c.vipEligible && !c.vipApproved).length
    };

    return {
      distribution,
      totalCustomers,
      totalBalance,
      avgBalance: totalCustomers > 0 ? totalBalance / totalCustomers : 0,
      vipStats
    };
  } catch (error) {
    console.error('取得會員分布失敗:', error);
    throw error;
  }
};

/**
 * 取得完整報表總覽
 * @param {Date} startDate - 開始日期
 * @param {Date} endDate - 結束日期
 * @returns {Promise<Object>} 完整報表數據
 */
export const getFullReport = async (startDate, endDate) => {
  try {
    const [revenue, customerRanking, services, membership] = await Promise.all([
      getRevenueReport(startDate, endDate),
      getCustomerRanking(startDate, endDate),
      getPopularServices(startDate, endDate),
      getMembershipDistribution()
    ]);

    return {
      revenue,
      customerRanking,
      services,
      membership,
      generatedAt: new Date().toLocaleString('zh-TW')
    };
  } catch (error) {
    console.error('取得完整報表失敗:', error);
    throw error;
  }
};

/**
 * 匯出報表為 CSV
 * @param {Object} reportData - 報表數據
 * @param {string} reportType - 報表類型
 * @returns {string} CSV 字串
 */
export const exportReportToCSV = (reportData, reportType) => {
  try {
    let headers = [];
    let rows = [];

    switch (reportType) {
      case 'revenue':
        headers = ['日期', '營收', '來店次數', '現金', '刷卡', '儲值'];
        rows = reportData.dailyRevenue.map(day => [
          day.date,
          day.revenue,
          day.visits,
          day.cash,
          day.card,
          day.deposit
        ]);
        break;

      case 'customerRanking':
        headers = ['排名', '客戶姓名', '電話', '會員等級', '消費金額', '來店次數', '常用療程'];
        rows = reportData.map((customer, index) => [
          index + 1,
          customer.customerName,
          customer.phone,
          getMembershipLabel(customer.membershipLevel),
          customer.totalSpent,
          customer.visitCount,
          customer.services.join(', ')
        ]);
        break;

      case 'services':
        headers = ['療程名稱', '來店次數', '預約次數', '總次數', '營收', '平均單價'];
        rows = reportData.map(service => [
          service.serviceName,
          service.visitCount,
          service.bookingCount,
          service.totalCount,
          service.totalRevenue,
          Math.round(service.avgPrice)
        ]);
        break;

      case 'membership':
        headers = ['會員等級', '人數', '總儲值餘額', '平均餘額'];
        rows = Object.entries(reportData.distribution).map(([level, data]) => [
          getMembershipLabel(level),
          data.count,
          data.totalBalance,
          Math.round(data.avgBalance)
        ]);
        break;

      default:
        throw new Error('未知的報表類型');
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return '\uFEFF' + csvContent; // 加入 BOM 支援中文
  } catch (error) {
    console.error('匯出 CSV 失敗:', error);
    throw error;
  }
};

/**
 * 下載 CSV 檔案
 * @param {string} csvContent - CSV 內容
 * @param {string} filename - 檔案名稱
 */
export const downloadCSV = (csvContent, filename) => {
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下載 CSV 失敗:', error);
    throw error;
  }
};

/**
 * 取得會員等級標籤
 * @param {string} level - 會員等級
 * @returns {string} 標籤
 */
const getMembershipLabel = (level) => {
  const labels = {
    regular: '普通會員',
    deposit_20k: '儲值會員 2萬',
    deposit_30k: '儲值會員 3萬',
    deposit_50k: '儲值會員 5萬',
    vip: 'VIP會員'
  };
  return labels[level] || level;
};

export default {
  getRevenueReport,
  getCustomerRanking,
  getPopularServices,
  getMembershipDistribution,
  getFullReport,
  exportReportToCSV,
  downloadCSV
};
