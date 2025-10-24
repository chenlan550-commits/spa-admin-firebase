// 新增測試報表資料
// 使用方式：node scripts/addTestReportData.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyCEWsKYjXTBD-k-zcKEmYeaQ6INxhhb08w",
  authDomain: "spa-admin-firebase.firebaseapp.com",
  projectId: "spa-admin-firebase",
  storageBucket: "spa-admin-firebase.firebasestorage.app",
  messagingSenderId: "12778948033",
  appId: "1:12778948033:web:94c0dfed597ddfc37c9b40"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 測試客戶資料
const testCustomers = [
  { name: "王小明", phone: "0912345678", email: "wang@example.com", membershipLevel: "regular" },
  { name: "李美麗", phone: "0923456789", email: "li@example.com", membershipLevel: "deposit_20k" },
  { name: "張大華", phone: "0934567890", email: "zhang@example.com", membershipLevel: "deposit_30k" },
  { name: "陳小芳", phone: "0945678901", email: "chen@example.com", membershipLevel: "deposit_50k" },
  { name: "林雅婷", phone: "0956789012", email: "lin@example.com", membershipLevel: "vip" },
  { name: "黃志明", phone: "0967890123", email: "huang@example.com", membershipLevel: "regular" },
  { name: "吳佳穎", phone: "0978901234", email: "wu@example.com", membershipLevel: "deposit_20k" },
  { name: "鄭淑芬", phone: "0989012345", email: "zheng@example.com", membershipLevel: "deposit_30k" }
];

// 測試療程
const testServices = [
  { id: "M01", name: "深層潔淨護理", price: 3800 },
  { id: "M02", name: "頭部理療", price: 2500 },
  { id: "M03", name: "身體按摩", price: 4500 },
  { id: "M04", name: "精油SPA", price: 5200 },
  { id: "M05", name: "美白護理", price: 4200 }
];

// 付款方式
const paymentMethods = ["cash", "card", "deposit"];

// 生成過去 30 天的隨機日期
function getRandomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 10) + 9); // 9:00 - 18:00
  date.setMinutes(0, 0, 0);
  return Timestamp.fromDate(date);
}

// 隨機選擇
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 新增測試客戶
async function addTestCustomers() {
  console.log('\n📝 新增測試客戶資料...');
  const customerIds = [];

  for (const customer of testCustomers) {
    try {
      const customerData = {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        membershipLevel: customer.membershipLevel,
        balance: customer.membershipLevel === 'regular' ? 0 : Math.floor(Math.random() * 50000),
        isVIP: customer.membershipLevel === 'vip',
        vipEndDate: customer.membershipLevel === 'vip' ?
          Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) : null,
        totalSpent: 0,
        visitCount: 0,
        recentAppointments: [],
        recentVisits: [],
        yearlyStats: {
          year: new Date().getFullYear(),
          visitCount: 0,
          totalSpent: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'customers'), customerData);
      customerIds.push({ id: docRef.id, ...customer });
      console.log(`  ✅ ${customer.name} (${customer.membershipLevel})`);
    } catch (error) {
      console.error(`  ❌ ${customer.name} 新增失敗:`, error.message);
    }
  }

  return customerIds;
}

// 新增測試來店記錄
async function addTestVisits(customers) {
  console.log('\n🏪 新增測試來店記錄...');
  let count = 0;

  // 每個客戶新增 3-8 筆來店記錄
  for (const customer of customers) {
    const visitCount = Math.floor(Math.random() * 6) + 3; // 3-8 筆

    for (let i = 0; i < visitCount; i++) {
      try {
        const service = randomChoice(testServices);
        const paymentMethod = randomChoice(paymentMethods);
        const visitDate = getRandomDate(30);

        // VIP 打 5 折
        const discount = customer.membershipLevel === 'vip' ? 0.5 : 1.0;
        const finalPrice = Math.round(service.price * discount);

        const visitData = {
          customerId: customer.id,
          customerName: customer.name,
          serviceId: service.id,
          serviceName: service.name,
          visitDate: visitDate,
          duration: 60,
          originalPrice: service.price,
          membershipType: customer.membershipLevel,
          discount: discount,
          finalPrice: finalPrice,
          paymentMethod: paymentMethod,
          notes: `測試來店記錄 ${i + 1}`,
          createdAt: visitDate,
          updatedAt: visitDate
        };

        await addDoc(collection(db, 'visits'), visitData);
        count++;
      } catch (error) {
        console.error(`  ❌ ${customer.name} 來店記錄新增失敗:`, error.message);
      }
    }

    console.log(`  ✅ ${customer.name}: ${visitCount} 筆來店記錄`);
  }

  console.log(`\n總計新增 ${count} 筆來店記錄`);
}

// 新增測試預約記錄
async function addTestBookings(customers) {
  console.log('\n📅 新增測試預約記錄...');
  let count = 0;

  // 每個客戶新增 1-3 筆預約
  for (const customer of customers) {
    const bookingCount = Math.floor(Math.random() * 3) + 1; // 1-3 筆

    for (let i = 0; i < bookingCount; i++) {
      try {
        const service = randomChoice(testServices);
        const bookingDate = getRandomDate(15); // 最近 15 天
        const status = randomChoice(['pending', 'confirmed', 'completed']);

        const bookingData = {
          customerName: customer.name,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          bookingDate: bookingDate,
          date: bookingDate,
          bookingTime: `${Math.floor(Math.random() * 9) + 9}:00`,
          time: `${Math.floor(Math.random() * 9) + 9}:00`,
          serviceName: service.name,
          serviceId: service.id,
          duration: 60,
          price: service.price,
          status: status,
          notes: `測試預約記錄 ${i + 1}`,
          customerId: customer.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await addDoc(collection(db, 'appointments'), bookingData);
        count++;
      } catch (error) {
        console.error(`  ❌ ${customer.name} 預約記錄新增失敗:`, error.message);
      }
    }

    console.log(`  ✅ ${customer.name}: ${bookingCount} 筆預約記錄`);
  }

  console.log(`\n總計新增 ${count} 筆預約記錄`);
}

// 新增聯絡訊息
async function addTestMessages() {
  console.log('\n💬 新增測試聯絡訊息...');

  const messages = [
    { name: "陳大明", email: "chen@example.com", phone: "0901234567", service: "深層潔淨護理", message: "請問這個療程需要多久時間？", status: "unread" },
    { name: "林小花", email: "lin@example.com", phone: "0912345678", service: "精油SPA", message: "想預約本週五下午的時段", status: "read" },
    { name: "王美美", email: "wang@example.com", phone: "0923456789", service: "身體按摩", message: "請問有會員優惠嗎？", status: "replied" }
  ];

  for (const msg of messages) {
    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...msg,
        language: 'zh',
        createdAt: getRandomDate(7),
        updatedAt: Timestamp.now()
      });
      console.log(`  ✅ ${msg.name} 的訊息`);
    } catch (error) {
      console.error(`  ❌ ${msg.name} 訊息新增失敗:`, error.message);
    }
  }
}

// 新增電子報訂閱
async function addTestSubscribers() {
  console.log('\n📧 新增測試電子報訂閱...');

  const subscribers = [
    { email: "subscriber1@example.com", language: "zh" },
    { email: "subscriber2@example.com", language: "en" },
    { email: "subscriber3@example.com", language: "ja" },
    { email: "subscriber4@example.com", language: "zh" },
    { email: "subscriber5@example.com", language: "zh" }
  ];

  for (const sub of subscribers) {
    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        ...sub,
        status: 'active',
        source: 'website',
        subscribedAt: getRandomDate(30),
        createdAt: Timestamp.now()
      });
      console.log(`  ✅ ${sub.email}`);
    } catch (error) {
      console.error(`  ❌ ${sub.email} 訂閱新增失敗:`, error.message);
    }
  }
}

// 主函數
async function main() {
  try {
    console.log('🚀 開始新增測試報表資料...\n');
    console.log('=' .repeat(50));

    // 1. 新增客戶
    const customers = await addTestCustomers();

    // 2. 新增來店記錄（用於營收報表）
    await addTestVisits(customers);

    // 3. 新增預約記錄
    await addTestBookings(customers);

    // 4. 新增聯絡訊息
    await addTestMessages();

    // 5. 新增電子報訂閱
    await addTestSubscribers();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有測試資料新增完成！');
    console.log('\n現在可以測試報表功能：');
    console.log('  1. 訪問 http://localhost:5173');
    console.log('  2. 登入後台');
    console.log('  3. 點擊「報表分析」標籤');
    console.log('  4. 查看各種報表數據\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 執行失敗:', error);
    process.exit(1);
  }
}

main();
