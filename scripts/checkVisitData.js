// 檢查來店記錄數據
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWHq-dtPxKZRfCDzH_iSPxlNmRHMpgz9A",
  authDomain: "spa-admin-firebase.firebaseapp.com",
  projectId: "spa-admin-firebase",
  storageBucket: "spa-admin-firebase.firebasestorage.app",
  messagingSenderId: "423434667697",
  appId: "1:423434667697:web:4dbfd51a900ea3d4d3e11c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkVisit() {
  try {
    const q = query(
      collection(db, 'visits'),
      where('customerName', '==', '蔣柏霳')
    );

    const snapshot = await getDocs(q);

    console.log('找到', snapshot.size, '筆記錄\n');

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('記錄 ID:', doc.id);
      console.log('客戶:', data.customerName);
      console.log('療程:', data.serviceName);
      console.log('originalPrice:', data.originalPrice);
      console.log('finalPrice:', data.finalPrice);
      console.log('price:', data.price);
      console.log('discount:', data.discount);
      console.log('membershipType:', data.membershipType);
      console.log('---');
    });
  } catch (error) {
    console.error('錯誤:', error);
  }
  process.exit(0);
}

checkVisit();
