"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSESSMENT_QUESTIONS = void 0;
exports.getAssessmentQuestions = getAssessmentQuestions;
exports.calculateAssessmentScore = calculateAssessmentScore;
exports.getMotivationalMessage = getMotivationalMessage;
exports.simulateScenario = simulateScenario;
exports.ASSESSMENT_QUESTIONS = [
    {
        id: 'q1',
        question: 'Apakah Anda mengetahui zona evakuasi terdekat dari rumah Anda?',
        category: 'general',
        options: [
            { text: 'Ya, saya sudah pernah kesana', points: 5 },
            { text: 'Tahu lokasinya tetapi belum pernah', points: 3 },
            { text: 'Tidak tahu', points: 0 }
        ]
    },
    {
        id: 'q2',
        question: 'Apakah rumah Anda memiliki jalur evakuasi yang jelas?',
        category: 'general',
        options: [
            { text: 'Ya, sudah direncanakan dengan matang', points: 5 },
            { text: 'Agak jelas tetapi belum terstruktur', points: 3 },
            { text: 'Tidak ada jalur khusus', points: 0 }
        ]
    },
    {
        id: 'q3',
        question: 'Apakah keluarga Anda memiliki rencana berkumpul darurat?',
        category: 'general',
        options: [
            { text: 'Ya, kami sudah memiliki meeting point', points: 5 },
            { text: 'Punya ide tapi belum dibicarakan formal', points: 2 },
            { text: 'Belum ada', points: 0 }
        ]
    },
    {
        id: 'q4',
        question: 'Bagaimana pengetahuan Anda tentang teknik drop, cover, hold on saat gempa?',
        category: 'earthquake',
        options: [
            { text: 'Sangat tahu dan pernah praktik', points: 5 },
            { text: 'Tahu teorinya saja', points: 3 },
            { text: 'Tidak tahu', points: 0 }
        ]
    },
    {
        id: 'q5',
        question: 'Apakah di rumah Anda ada katalog barang yang bisa bergerak saat gempa?',
        category: 'earthquake',
        options: [
            { text: 'Ya, sudah dikawatkan atau diamankan', points: 5 },
            { text: 'Tahu risikonya tapi belum diamankan', points: 2 },
            { text: 'Tidak pernah dipikirkan', points: 0 }
        ]
    },
    {
        id: 'q6',
        question: 'Apakah Anda punya perlengkapan P3K atau kotak pertolongan pertama?',
        category: 'earthquake',
        options: [
            { text: 'Ya, lengkap dan mudah diakses', points: 5 },
            { text: 'Ada tetapi tidak lengkap atau tersembunyi', points: 2 },
            { text: 'Tidak memiliki', points: 0 }
        ]
    },
    {
        id: 'q7',
        question: 'Berapa lama Anda bisa tahan tanpa air bersih sebelum panik?',
        category: 'general',
        options: [
            { text: '> 3 hari (ada persiapan cadangan)', points: 5 },
            { text: '1-3 hari (pernah panik)', points: 2 },
            { text: 'Kurang dari 1 hari', points: 0 }
        ]
    },
    {
        id: 'q8',
        question: 'Apakah rumah Anda berada di area rawan banjir?',
        category: 'flood',
        options: [
            { text: 'Tidak, area aman dari genangan', points: 5 },
            { text: 'Pernah banjir tapi jarang', points: 3 },
            { text: 'Sering terkena banjir tahunan', points: 0 }
        ]
    },
    {
        id: 'q9',
        question: 'Apakah Anda tahu cara mengoperasikan pompa listrik atau manual jika banjir?',
        category: 'flood',
        options: [
            { text: 'Ya, sudah pernah praktik', points: 5 },
            { text: 'Tahu teorinya, belum praktik', points: 2 },
            { text: 'Tidak tahu', points: 0 }
        ]
    },
    {
        id: 'q10',
        question: 'Seberapa sering Anda memeriksa saluran drainase di sekitar rumah?',
        category: 'flood',
        options: [
            { text: 'Setiap bulan atau rutin', points: 5 },
            { text: 'Sesekali saat musim hujan', points: 2 },
            { text: 'Tidak pernah', points: 0 }
        ]
    },
    {
        id: 'q11',
        question: 'Apakah Anda tahu panduan evakuasi jika banjir sudah untuk tangga rumah?',
        category: 'flood',
        options: [
            { text: 'Ya, sudah ada rencana naik ke lantai atas/atap', points: 5 },
            { text: 'Punya ide tanpa rencana matang', points: 2 },
            { text: 'Tidak pernah dipikirkan', points: 0 }
        ]
    },
    {
        id: 'q12',
        question: 'Apakah Anda memiliki backup dokumen penting (KTP, sertifikat, dll)?',
        category: 'general',
        options: [
            { text: 'Ya, ada copy fisik dan digital tersimpan aman', points: 5 },
            { text: 'Ada copy tapi tidak terorganisir', points: 2 },
            { text: 'Hanya original saja', points: 0 }
        ]
    }
];
function getAssessmentQuestions() {
    return exports.ASSESSMENT_QUESTIONS;
}
function calculateAssessmentScore(answers) {
    let earthquakeScore = 0;
    let floodScore = 0;
    let generalScore = 0;
    let earthquakeTotal = 0;
    let floodTotal = 0;
    let generalTotal = 0;
    exports.ASSESSMENT_QUESTIONS.forEach((q) => {
        const points = answers[q.id] || 0;
        if (q.category === 'earthquake') {
            earthquakeScore += points;
            earthquakeTotal += 5;
        }
        else if (q.category === 'flood') {
            floodScore += points;
            floodTotal += 5;
        }
        else {
            generalScore += points;
            generalTotal += 5;
        }
    });
    const earthquakeReadiness = Math.round((earthquakeScore / earthquakeTotal) * 100);
    const floodReadiness = Math.round((floodScore / floodTotal) * 100);
    const overallReadiness = Math.round(((earthquakeScore + floodScore + generalScore) / (earthquakeTotal + floodTotal + generalTotal)) * 100);
    const recommendations = generateRecommendations(earthquakeReadiness, floodReadiness);
    return {
        earthquakeReadiness,
        floodReadiness,
        overallReadiness,
        recommendations,
        generatedAt: new Date().toISOString()
    };
}
function generateRecommendations(earthquakeScore, floodScore) {
    const recommendations = [];
    if (earthquakeScore < 60) {
        recommendations.push('🏠 Tingkatkan kesiapan gempa: Amankan barang-barang yang bisa bergerak dan pelajari teknik drop, cover, hold on.');
    }
    if (floodScore < 60) {
        recommendations.push('💧 Tingkatkan kesiapan banjir: Periksa saluran drainase dan siapkan rencana evakuasi vertikal.');
    }
    if (earthquakeScore >= 80 && floodScore >= 80) {
        recommendations.push('⭐ Luar biasa! Anda sudah sangat siap. Bantu keluarga dan tetangga untuk meningkatkan kesiapan mereka.');
    }
    if (earthquakeScore < 40 && floodScore < 40) {
        recommendations.push('🚨 PRIORITAS: Segera ikuti pelatihan kesiapsiagaan resmi dari BNPB atau Tagana terdekat!');
    }
    recommendations.push('📱 Install aplikasi SiagaMate AI untuk mendapat peringatan dini bencana real-time.');
    return recommendations;
}
function getMotivationalMessage(score) {
    if (score >= 90)
        return '🌟 Anda adalah rela siaga bencana! Terus jaga kesiapan ini.';
    if (score >= 80)
        return '✅ Sangat baik! Beberapa hal kecil masih bisa ditingkatkan.';
    if (score >= 70)
        return '👍 Cukup baik. Terus belajar dan berlatih.';
    if (score >= 60)
        return '⚠️ Perlu lebih banyak persiapan. Jangan tunda lagi!';
    if (score >= 40)
        return '🔴 Kesiapan masih rendah. Mulai persiapan sekarang!';
    return '🚨 Sangat kritis! Butuh bantuan profesional dari BNPB Terdekat.';
}
// Legacy scenario simulation for backward compatibility
function simulateScenario({ type, lat, lng }) {
    const templates = {
        banjir: {
            title: 'Simulasi Banjir 6 Jam Hujan Ekstrem',
            assumptions: ['Curah hujan > 100 mm/hari', 'Drainase lokal tersumbat'],
            phases: [
                'Jam 0-1: Air mulai naik di titik rendah.',
                'Jam 2-3: Akses jalan utama mulai tergenang.',
                'Jam 4-6: Evakuasi prioritas balita, lansia, dan difabel.'
            ]
        },
        'gempa-bumi': {
            title: 'Simulasi Gempa M 5.9 Dekat Permukiman',
            assumptions: ['Durasi guncangan 20-30 detik', 'Potensi aftershock dalam 24 jam'],
            phases: [
                'Detik 0-30: Drop, Cover, Hold.',
                'Menit 1-10: Evakuasi terarah dari gedung bertingkat.',
                'Menit 10-60: Triase luka dan pendataan warga.'
            ]
        }
    };
    const template = templates[type] || templates.banjir;
    return {
        scenarioType: type,
        location: { lat, lng },
        ...template,
        aiRecommendations: [
            'Tentukan Incident Commander per RT/RW.',
            'Gunakan grup komunikasi tunggal untuk menghindari miskomunikasi.',
            'Dokumentasikan kebutuhan logistik setiap 30 menit.'
        ],
        generatedAt: new Date().toISOString()
    };
}
