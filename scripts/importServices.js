// 批量匯入療程資料到 Firebase
// 使用方式：node scripts/importServices.js

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

// 療程資料
const services = [
  // 身體療程
  {
    id: 'B01',
    category: 'bodyspa',
    name: '顱沐淋巴舒壓',
    nameEn: 'Cranial Lymphatic Relief',
    nameJa: '頭蓋リンパ緩和',
    price: 2180,
    selfOilPrice: 1480,
    duration: 60,
    description: '舒緩頭部壓力，促進淋巴循環，改善頭痛與睡眠品質，讓大腦放鬆，思緒清晰。',
    descriptionEn: 'Relieve head pressure, promote lymphatic circulation, improve headaches and sleep quality, relax the brain and clear thoughts.',
    descriptionJa: '頭部の圧力を緩和し、リンパ循環を促進し、頭痛と睡眠の質を改善し、脳をリラックスさせ、思考を明晰にします。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 淋巴引流 → 頭部舒壓 → 頭肩頸SPA',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Lymphatic Drainage → Head Relief → Head, Shoulder & Neck SPA',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → リンパドレナージュ → 頭部緩和 → 頭肩首SPA',
    imageUrl: '',
    order: 1
  },
  {
    id: 'B02',
    category: 'bodyspa',
    name: '腿部輕迎煥新護理',
    nameEn: 'Leg Renewal Care',
    nameJa: '脚部軽やか再生ケア',
    price: 1880,
    selfOilPrice: 1280,
    duration: 60,
    description: '改善腿部水腫與疲勞，促進下肢循環，讓雙腿輕盈有活力，適合久站久坐族群。',
    descriptionEn: 'Improve leg swelling and fatigue, promote lower limb circulation, make legs light and energetic, suitable for people who stand or sit for long periods.',
    descriptionJa: '脚のむくみと疲労を改善し、下肢循環を促進し、脚を軽やかで活力あるものにし、長時間立ったり座ったりする人に適しています。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 腿部深層排導 → 足部按摩 → 腿部緊緻護理',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Deep Leg Drainage → Foot Massage → Leg Firming Care',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 脚部深層ドレナージュ → 足マッサージ → 脚部引き締めケア',
    imageUrl: '',
    order: 2
  },
  {
    id: 'B03',
    category: 'bodyspa',
    name: '輕奢課程',
    nameEn: 'Luxury Introductory Course',
    nameJa: 'ラグジュアリー入門コース',
    price: 2300,
    selfOilPrice: 1500,
    duration: 70,
    description: '全身舒壓入門體驗，適合初次嘗試芳療SPA，放鬆身心，感受精油的療癒力量。',
    descriptionEn: 'Full-body stress relief introductory experience, suitable for first-time aromatherapy SPA, relax body and mind, feel the healing power of essential oils.',
    descriptionJa: '全身ストレス緩和入門体験、初回アロマテラピーSPAに適し、心身をリラックスさせ、精油の癒しの力を感じます。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 全背舒壓 → 腿部排導 → 腹部疏通 → 頭肩頸SPA',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Full Back Relief → Leg Drainage → Abdominal Clearing → Head, Shoulder & Neck SPA',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 全背中緩和 → 脚部ドレナージュ → 腹部疏通 → 頭肩首SPA',
    imageUrl: '',
    order: 3
  },
  {
    id: 'B04',
    category: 'bodyspa',
    name: '盈纖緊緻雕塑',
    nameEn: 'Slimming Firming Sculpting',
    nameJa: 'スリム引き締め彫刻',
    price: 2200,
    selfOilPrice: 1600,
    duration: 90,
    description: '針對身體曲線雕塑，緊緻肌膚，改善橘皮組織，打造窈窕體態與彈潤膚質。',
    descriptionEn: 'Target body curve sculpting, firm skin, improve cellulite, create graceful figure and elastic skin texture.',
    descriptionJa: 'ボディカーブ彫刻をターゲットに、肌を引き締め、セルライトを改善し、しなやかな体型と弾力のある肌質を作ります。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 全背舒壓 → 腹部雕塑 → 腿部緊緻 → 臀部提拉 → 手臂塑型',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Full Back Relief → Abdominal Sculpting → Leg Firming → Hip Lifting → Arm Shaping',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 全背中緩和 → 腹部彫刻 → 脚部引き締め → ヒップリフト → 腕シェイピング',
    imageUrl: '',
    order: 4
  },
  {
    id: 'B05',
    category: 'bodyspa',
    name: '極緻舒活全身釋壓',
    nameEn: 'Ultimate Relaxation Full Body Release',
    nameJa: '極上リラックス全身解放',
    price: 2200,
    selfOilPrice: 1600,
    duration: 90,
    description: '提升活力與精神，適合忙碌現代人的能量補充，全方位深層放鬆，重啟身心平衡。',
    descriptionEn: 'Boost vitality and spirit, suitable for busy modern people\'s energy supplement, comprehensive deep relaxation, restart body and mind balance.',
    descriptionJa: '活力と精神を向上させ、忙しい現代人のエネルギー補給に適し、全方位深層リラクゼーション、心身バランスを再起動。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 全背舒壓 → 腿部排導 → 腹部疏通 → 胸部暢通 → 頭肩頸SPA',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Full Back Relief → Leg Drainage → Abdominal Clearing → Chest Opening → Head, Shoulder & Neck SPA',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 全背中緩和 → 脚部ドレナージュ → 腹部疏通 → 胸部開通 → 頭肩首SPA',
    options: JSON.stringify([
      { duration: 90, price: 2200, selfOilPrice: 1600 },
      { duration: 120, price: 2880, selfOilPrice: 2080 }
    ]),
    imageUrl: '',
    order: 5
  },
  {
    id: 'B06',
    category: 'bodyspa',
    name: '芳香溫灸',
    nameEn: 'Aromatic Moxibustion',
    nameJa: '芳香温灸',
    price: 2600,
    selfOilPrice: 1800,
    duration: 90,
    description: '結合溫熱能量與精油芳療，深層溫暖經絡，驅散寒氣，促進氣血循環，適合體質虛寒者。',
    descriptionEn: 'Combine warm energy with essential oil aromatherapy, deeply warm meridians, dispel cold, promote blood circulation, suitable for those with cold constitution.',
    descriptionJa: '温熱エネルギーと精油アロマテラピーを組み合わせ、経絡を深層温暖化し、寒気を払い、血行を促進し、寒性体質の方に適しています。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 全背溫灸 → 腹部溫灸 → 腿部溫灸 → 經絡疏通 → 溫熱放鬆',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Full Back Moxibustion → Abdominal Moxibustion → Leg Moxibustion → Meridian Clearing → Warm Relaxation',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 全背中温灸 → 腹部温灸 → 脚部温灸 → 経絡疏通 → 温熱リラクゼーション',
    imageUrl: '',
    order: 6
  },
  {
    id: 'B07',
    category: 'bodyspa',
    name: '淋巴芳香調理',
    nameEn: 'Lymphatic Aromatic Therapy',
    nameJa: 'リンパ芳香調理',
    price: 2200,
    selfOilPrice: 1600,
    duration: 90,
    description: '全身淋巴系統深層疏通，排除體內毒素與廢物，增強免疫力，改善水腫與疲勞感。',
    descriptionEn: 'Deep lymphatic system clearing throughout the body, eliminate toxins and waste, enhance immunity, improve swelling and fatigue.',
    descriptionJa: '全身リンパシステム深層疏通、体内毒素と老廃物を排除し、免疫力を向上させ、むくみと疲労感を改善します。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 全背淋巴排導 → 腿部淋巴疏通 → 腹部淋巴調理 → 手臂淋巴 → 頭肩頸SPA',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Full Back Lymphatic Drainage → Leg Lymphatic Clearing → Abdominal Lymphatic Therapy → Arm Lymphatic → Head, Shoulder & Neck SPA',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 全背中リンパドレナージュ → 脚部リンパ疏通 → 腹部リンパ調理 → 腕リンパ → 頭肩首SPA',
    imageUrl: '',
    order: 7
  },
  {
    id: 'B08',
    category: 'bodyspa',
    name: '舞風暖宮疏胸',
    nameEn: 'Feminine Warming & Chest Care',
    nameJa: '舞風温宮疏胸',
    price: 3200,
    selfOilPrice: 2400,
    duration: 120,
    description: '調理女性生殖系統，溫養子宮，疏通乳腺，改善經期不適，呵護女性健康與荷爾蒙平衡。',
    descriptionEn: 'Regulate female reproductive system, warm and nourish uterus, clear mammary glands, improve menstrual discomfort, care for women\'s health and hormonal balance.',
    descriptionJa: '女性生殖システムを調理し、子宮を温養し、乳腺を疏通し、生理不快を改善し、女性の健康とホルモンバランスをケアします。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 全背舒壓 → 腿部排導 → 暖宮疏胸 → 手部放鬆 → 頭肩頸SPA',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Full Back Relief → Leg Drainage → Uterine Warming & Chest Care → Hand Relaxation → Head, Shoulder & Neck SPA',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 全背中緩和 → 脚部ドレナージュ → 温宮疏胸 → 手部リラクゼーション → 頭肩首SPA',
    imageUrl: '',
    order: 8
  },
  {
    id: 'B09',
    category: 'bodyspa',
    name: '美胸窈窕纖盈',
    nameEn: 'Breast Enhancement & Body Sculpting',
    nameJa: '美胸しなやかスリム',
    price: 3400,
    selfOilPrice: 2400,
    duration: 130,
    description: '美胸護理結合全身塑型，提升胸部線條，雕塑腰腹曲線，打造優雅體態與自信美。',
    descriptionEn: 'Breast care combined with full body sculpting, enhance breast lines, sculpt waist and abdominal curves, create elegant posture and confident beauty.',
    descriptionJa: 'バストケアと全身シェイピングを組み合わせ、胸部ラインを向上させ、ウエスト腹部カーブを彫刻し、エレガントな体型と自信美を作ります。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 全背舒壓 → 腿部排導 → 腹部纖盈 → 美胸護理 → 手臂塑型 → 頭肩頸SPA',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Full Back Relief → Leg Drainage → Abdominal Slimming → Breast Care → Arm Shaping → Head, Shoulder & Neck SPA',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 全背中緩和 → 脚部ドレナージュ → 腹部スリム → バストケア → 腕シェイピング → 頭肩首SPA',
    imageUrl: '',
    order: 9
  },

  // 臉部護理
  {
    id: 'F01',
    category: 'facialspa',
    name: '晶亮雪肌嫩白',
    nameEn: 'Crystal Bright Snow Skin Whitening',
    nameJa: '晶亮雪肌美白',
    price: 4200,
    selfOilPrice: 1600,
    duration: 90,
    description: '深層淨化肌膚，改善暗沉與色素沉澱，提升肌膚透亮度，打造白皙透亮的水潤光澤肌。',
    descriptionEn: 'Deep skin purification, improve dullness and pigmentation, enhance skin brightness, create fair and radiant moisturized glowing skin.',
    descriptionJa: '肌膚深層浄化、くすみと色素沈着を改善し、肌の透明感を向上させ、白く透明で潤いのある輝く肌を作ります。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 深層清潔 → 臉部淋巴排導 → 美白精華導入 → 亮白面膜 → 保濕鎖水 → 頭肩頸放鬆',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Deep Cleansing → Facial Lymphatic Drainage → Whitening Essence Infusion → Brightening Mask → Moisturizing Lock → Head, Shoulder & Neck Relaxation',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 深層クレンジング → 顔面リンパドレナージュ → 美白エッセンス導入 → ブライトニングマスク → 保湿ロック → 頭肩首リラクゼーション',
    imageUrl: '',
    order: 10
  },
  {
    id: 'F02',
    category: 'facialspa',
    name: '清新亮妍臉部保養',
    nameEn: 'Fresh Radiant Facial Care',
    nameJa: '清新輝顔フェイシャルケア',
    price: 2400,
    selfOilPrice: 1600,
    duration: 90,
    description: '基礎臉部深層護理，平衡油水，改善粗糙與暗沉，恢復肌膚健康光采，適合各種膚質。',
    descriptionEn: 'Basic deep facial care, balance oil and water, improve roughness and dullness, restore healthy skin radiance, suitable for all skin types.',
    descriptionJa: '基礎的な顔面深層ケア、油水バランス、粗さとくすみを改善し、肌の健康的な輝きを回復、あらゆる肌質に適しています。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 溫和清潔 → 去角質 → 臉部按摩 → 保濕面膜 → 精華鎖水 → 頭肩頸舒壓',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Gentle Cleansing → Exfoliation → Facial Massage → Moisturizing Mask → Essence Lock → Head, Shoulder & Neck Relief',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 優しいクレンジング → 角質除去 → フェイシャルマッサージ → 保湿マスク → エッセンスロック → 頭肩首緩和',
    imageUrl: '',
    order: 11
  },
  {
    id: 'F03',
    category: 'facialspa',
    name: '晶緻亮眼肌活',
    nameEn: 'Crystal Bright Eye Revitalization',
    nameJa: '晶緻明眸肌活',
    price: 3200,
    selfOilPrice: 2400,
    duration: 130,
    description: '全臉深層保養搭配專業眼部護理，淡化細紋與黑眼圈，緊緻眼周肌膚，重現明亮有神雙眸。',
    descriptionEn: 'Full facial deep care combined with professional eye care, fade fine lines and dark circles, firm eye area skin, restore bright and radiant eyes.',
    descriptionJa: '全顔深層ケアと專門的なアイケアを組み合わせ、小じわとクマを薄くし、目元の肌を引き締め、明るく輝く瞳を取り戻します。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 深層清潔 → 去角質 → 全臉淋巴排導 → 眼部精華導入 → 眼周按摩 → 全臉精華按摩 → 眼膜敷護 → 臉部面膜 → 保濕鎖水 → 頭肩頸放鬆',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Deep Cleansing → Exfoliation → Full Face Lymphatic Drainage → Eye Essence Infusion → Eye Area Massage → Full Face Essence Massage → Eye Mask Treatment → Facial Mask → Moisturizing Lock → Head, Shoulder & Neck Relaxation',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 深層クレンジング → 角質除去 → 全顔リンパドレナージュ → アイエッセンス導入 → 目元マッサージ → 全顔エッセンスマッサージ → アイマスクケア → フェイシャルマスク → 保湿ロック → 頭肩首リラクゼーション',
    imageUrl: '',
    order: 12
  },

  // 加購課程
  {
    id: 'M01',
    category: 'minispa',
    name: '能量甦醒',
    nameEn: 'Energy Revival',
    nameJa: 'エネルギー蘇生',
    price: 500,
    duration: 20,
    description: '快速喚醒身心活力，提振精神，適合療程前後加強或短時間能量補充。',
    descriptionEn: 'Quickly awaken body and mind vitality, boost energy, suitable for pre/post treatment enhancement or short-term energy boost.',
    descriptionJa: '心身の活力を素早く目覚めさせ、精神を向上させ、トリートメント前後の強化や短時間のエネルギー補給に適しています。',
    imageUrl: '',
    order: 13
  },
  {
    id: 'M02',
    category: 'minispa',
    name: '頭部理療',
    nameEn: 'Head Therapy',
    nameJa: 'ヘッドセラピー',
    price: 500,
    duration: 20,
    description: '舒緩頭部緊繃與壓力，改善頭痛，促進頭部血液循環，讓思緒清晰放鬆。',
    descriptionEn: 'Relieve head tension and pressure, improve headaches, promote head blood circulation, clear and relax the mind.',
    descriptionJa: '頭部の緊張と圧力を緩和し、頭痛を改善し、頭部の血液循環を促進し、思考を明晰にリラックスさせます。',
    imageUrl: '',
    order: 14
  },
  {
    id: 'M03',
    category: 'minispa',
    name: '纖體釋放（腰、手、背）',
    nameEn: 'Body Release (Waist, Arms, Back)',
    nameJa: 'ボディリリース（腰・腕・背中）',
    price: 690,
    duration: 20,
    description: '針對局部緊繃部位深層放鬆，疏通經絡，緩解肌肉痠痛，適合加強特定部位護理。',
    descriptionEn: 'Deep relaxation for specific tense areas, clear meridians, relieve muscle soreness, suitable for targeted area care.',
    descriptionJa: '局部の緊張部位を深層リラックス、経絡を疏通し、筋肉の痛みを緩和し、特定部位のケア強化に適しています。',
    imageUrl: '',
    order: 15
  },
  {
    id: 'M04',
    category: 'minispa',
    name: '溫感淨化泥浴',
    nameEn: 'Warm Purifying Mud Bath',
    nameJa: '温感浄化泥浴',
    price: 1099,
    duration: 30,
    description: '深層排毒淨化，溫熱促進代謝，軟化角質，提升肌膚光滑細緻度，身心煥然一新。',
    descriptionEn: 'Deep detox purification, warm heat promotes metabolism, softens dead skin, enhances skin smoothness, body and mind renewal.',
    descriptionJa: '深層デトックス浄化、温熱で代謝を促進し、角質を軟化し、肌の滑らかさを向上させ、心身を一新します。',
    imageUrl: '',
    order: 16
  },
  {
    id: 'M05',
    category: 'minispa',
    name: '暖宮疏胸',
    nameEn: 'Uterine Warming & Chest Care',
    nameJa: '温宮疏胸',
    price: 800,
    duration: 40,
    description: '溫養子宮，疏通乳腺，改善經期不適與胸悶，適合女性單獨加購或搭配其他療程。',
    descriptionEn: 'Warm and nourish uterus, clear mammary glands, improve menstrual discomfort and chest tightness, suitable for women as standalone or combined treatment.',
    descriptionJa: '子宮を温養し、乳腺を疏通し、生理不快と胸の詰まりを改善し、女性の単独追加購入や他のトリートメントとの組み合わせに適しています。',
    imageUrl: '',
    order: 17
  },
  {
    id: 'M06',
    category: 'minispa',
    name: '加價課程',
    nameEn: 'Extension Service',
    nameJa: '追加料金コース',
    price: 600,
    duration: 30,
    description: '想要更深層的放鬆體驗？可將您的療程延長，享受更充裕的舒壓時光。',
    descriptionEn: 'Want a deeper relaxation experience? Extend your treatment time for more luxurious stress relief.',
    descriptionJa: 'より深いリラクゼーション体験をお望みですか？トリートメント時間を延長し、より充実したストレス解消時間をお楽しみください。',
    options: JSON.stringify([
      { duration: 30, price: 600 },
      { duration: 60, price: 1000 }
    ]),
    imageUrl: '',
    order: 18
  },

  // 孕婦專護
  {
    id: 'P01',
    category: 'pregnancyspa',
    name: '孕婦SPA',
    nameEn: 'Pregnancy SPA',
    nameJa: '妊婦SPA',
    subtitle: 'PREGNANT MASSAGE｜給媽咪安心好孕',
    subtitleEn: 'PREGNANT MASSAGE｜Safe & Comfortable Care for Mothers',
    subtitleJa: 'PREGNANT MASSAGE｜ママに安心で良い妊娠',
    price: 2400,
    duration: 90,
    description: '專為準媽咪量身打造的溫柔呵護療程，減輕孕期腰痠背痛與水腫不適，安撫身心、減緩壓力，幫助肌肉保持健康彈性，降低懷孕期間的身心負擔，讓您舒適安心地迎接新生命。',
    descriptionEn: 'Specially designed gentle care treatment for expectant mothers, relieving pregnancy-related back pain and swelling discomfort, soothing body and mind, reducing stress, helping muscles maintain healthy elasticity, reducing physical and mental burden during pregnancy, allowing you to comfortably and safely welcome new life.',
    descriptionJa: '妊婦さんのために特別に設計された優しいケアトリートメント、妊娠期の腰痛と浮腫の不快感を軽減し、心身を慰め、ストレスを緩和し、筋肉の健康的な弾力性を保ち、妊娠期間中の心身の負担を軽減し、快適で安心して新しい生命を迎えることができます。',
    process: '鬆筋放鬆 → 嗅吸活化 → 系統精油分層塗抹 → 側臥背部舒緩 → 腿部溫柔排導 → 足部按摩 → 肩頸放鬆 → 手臂舒壓 → 孕期專屬安撫手法',
    processEn: 'Muscle Relaxation → Aromatic Activation → Layered Essential Oil Application → Side-lying Back Relief → Gentle Leg Drainage → Foot Massage → Shoulder & Neck Relaxation → Arm Stress Relief → Pregnancy-specific Soothing Techniques',
    processJa: '筋肉リラクゼーション → 芳香活性化 → システム精油層塗布 → 側臥位背中緩和 → 脚部優しいドレナージュ → 足マッサージ → 肩首リラクゼーション → 腕ストレス解消 → 妊娠期専用慰撫手法',
    imageUrl: '',
    order: 19
  }
];

// 匯入函數
async function importServices() {
  console.log('開始匯入療程資料...');

  let successCount = 0;
  let errorCount = 0;

  for (const service of services) {
    try {
      const serviceData = {
        ...service,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'services'), serviceData);
      console.log(`✓ 成功匯入: ${service.name} (${service.id})`);
      successCount++;
    } catch (error) {
      console.error(`✗ 匯入失敗: ${service.name} (${service.id})`, error);
      errorCount++;
    }
  }

  console.log('\n匯入完成！');
  console.log(`成功: ${successCount} 筆`);
  console.log(`失敗: ${errorCount} 筆`);
  console.log(`總計: ${services.length} 筆`);
}

// 執行匯入
importServices()
  .then(() => {
    console.log('\n所有療程已成功匯入 Firebase！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n匯入過程發生錯誤:', error);
    process.exit(1);
  });
