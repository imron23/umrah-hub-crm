import { NextResponse } from "next/server";

const BYTEPLUS_API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"; // Standard Volcengine/Byteplus Ark Endpoint
const BYTEPLUS_API_KEY = "sk-_WZk981NpEyRqeApOT1f3A";
const MODEL_NAME = "seed-2-0-mini-free";

export async function POST(req: Request) {
    try {
        const { leadName, preference, score, age, family, emotion, lifeContext, notes } = await req.json();

        const systemPrompt = `Kamu adalah 'Umrah Hub AI Concierge' yang mewakili CS travel umrah premium. 
Tujuanmu: Buat draft pesan WhatsApp (maksimal 3-4 kalimat) yang sangat natural, empati, dan menyentuh emosi calon jamaah.
Aturan:
1. Sapa dengan "Assalamu'alaikum" tanpa berlebihan.
2. JANGAN menggunakan placeholder seperti [Nama Anda] atau [Link Brosur].
3. Jika usia jamaah > 50, tekankan bahwa fasilitas kami sangat aman dan nyaman untuk lansia.
4. Jika jamaah pergi dengan keluarga (contoh: 4 orang), tekankan promo atau fasilitas kamar family yang nyaman.
5. Gunakan bahasa Indonesia baku tapi luwes seperti Customer Service manusia yang profesional.
6. SESUAIKAN NADA BIARA DENGAN MOOD/EMOSI:
   - Happy: Berikan ucapan selamat & antusias.
   - Curious: Berikan penjelasan detail & yakinkan.
   - Skeptical: Berikan jaminan bukti testimoni/lisensi & sangat profesional.
   - Nervous: Berikan ketenangan, kata-kata sejuk & sangat empati.
   - Urgent: Beri respon cepat, solutif & to the point.

Data Leads:
- Nama: ${leadName || "Bapak/Ibu"}
- Preferensi (Apa yang mereka cari): ${preference || "Belum diketahui"}
- Usia: ${age || "Tidak diketahui"}
- Kategori Rombongan: ${family || "Tidak diketahui"}
- Status Emosi Saat Ini: ${emotion || "curious"}
- Konteks Hidup/Tujuan (PENTING): ${lifeContext || "Biasa"}
- Catatan Form & Aktivitas Terakhir: ${notes || "-"}
- Sentimen/Skor AI kami: ${score}/100`;

        const response = await fetch(BYTEPLUS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${BYTEPLUS_API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: "Buatkan draft pesan perkenalan & follow-up untuk saya kirimkan ke lead ini agar mereka terkesan dan balas chatnya." }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error("Byteplus Error:", errBody);
            throw new Error(`Byteplus API err: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "";

        return NextResponse.json({ result: reply });

    } catch (e: any) {
        console.error("AI Route Error:", e);
        return NextResponse.json({ error: "Failed to connect to Byteplus AI: " + e.message }, { status: 500 });
    }
}
