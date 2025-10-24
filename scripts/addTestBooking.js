// 新增測試預約資料
// 使用方式：node scripts/addTestBooking.js

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

// 測試預約資料
const testBooking = {
  name: "王小明",
  customerName: "王小明",
  phone: "0912345678",
  email: "wang@example.com",
  date: Timestamp.now(),
  bookingDate: Timestamp.now(),
  time: "14:00",
  bookingTime: "14:00",
  serviceName: "頭部理療",
  serviceId: "M02",
  duration: 60,
  status: "confirmed",
  notes: "測試預約資料",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

// 新增預約
async function addTestBooking() {
  try {
    console.log('正在新增測試預約資料...');

    const docRef = await addDoc(collection(db, 'appointments'), testBooking);

    console.log('✅ 測試預約已新增！');
    console.log('預約 ID:', docRef.id);
    console.log('客戶姓名:', testBooking.name);
    console.log('電話:', testBooking.phone);
    console.log('療程:', testBooking.serviceName);
    console.log('時間:', testBooking.time);

    process.exit(0);
  } catch (error) {
    console.error('❌ 新增失敗:', error);
    process.exit(1);
  }
}

addTestBooking();
