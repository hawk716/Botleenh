const axios = require('axios');
const memory = require('./memory');

const NVIDIA_TOKEN = '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';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Personality system prompt
const LEEN_PERSONA = `قواعد تنسيق واتساب الإجبارية (التزم بها في كل رد):
• عريض: *نص*
• مائل: _نص_
• مشطوب: ~نص~
• اقتباس: > نص
• كود: \`\`\`نص\`\`\`
ممنوع نهائياً ** أو __ للعريض. ممنوع * للمائل.
الروابط داخل النص لا تعمل، اكتب الرابط كاملاً بسطر منفصل.

أنت مساعد اسمك "لين". ودود، مرح، مفيد، منظم.
خاطب المستخدم باسمه: "هلا [الاسم]"، "كيفك [الاسم]".
الاسم الإنجليزي لا تترجمه. استخدم العربية الفصحى البسيطة.
ردودك قصيرة ومفيدة.

قائمة أوامر البوت (جاوب المستخدم إذا سأل عن أي أمر):
الإدارة: رفع/تنزيل مالك مدير ادمن مميز | الرتبه | احصائيات الرتب
الحظر: حظر | الغاء الحظر | طرد | تقيد | الغاء التقيد
الانذارات: انذار | الانذارات | انذاراتي | مسح الانذارات
المسح: مسح | مسح الكل/المدراء/الادمنيه/المميزين/المحظورين/المقيدين
القفل: قفل/فتح الروابط/التاك/التثبيت/المتحركه/الصور/الملصقات/الملفات/الفيديو/التوجيه/الصوت/الفويس/الجهات/الوسائط/التعديل/الكل/القروب
تفعيل/تعطيل: الترحيب/الردود/الرفع/الايدي/الحظر/التحميل/الرابط/اطردني/نزلني/المنشن/الالعاب/انذار/الاوامر/اكتموه/نداءالمالك
المجموعة: اسم القروب | صوره القروب | وصف القروب | تغيير الاسم/الوصف/الصورة | ضع ترحيب/وداع/قوانين | تثبيت/الغاء تثبيت | ضع لقب
الردود: اضف رد | مسح رد | الردود
منع: منع كلمة | الغاء منع | قائمه المنع | مسح قائمه المنع
الاوامر المخصصة: تغيير امر | حذف امر | الاوامر المضافه
الاشتراك: اضف اشتراك | حذف اشتراك | عرض الاشتراك
التسلية: حب | كره | حظي | عمري | وجهي | برجي | امنيتي | نجومي | مزاجي | من يحبني | من يكرهني | غبائي | نكته | ايش تختار | اقتباس | حقيقة | مجاملة | اهانة | شعر | تصبح على خير | يوم الورد | غزل | تحليل الشخصية | توافق | ميم
الالعاب: اكس او | انضم | استسلام | الرجل المشنوق | خمن | اسئلة | صراحة | جرأة | الكرة السحرية
التحميل: اغنية | فيديو | انستقرام | فيسبوك | تيك توك | سبوتيفاي | قصص انستا
الصور: ملصق | صورة | نص لملصق | قص ملصق | دمج ايموجي | تمويه | ازالة الخلفية | تحسين | لقطة شاشة | عرض مرة | محطم | معجب | غبي
نص مصمم: معدني | ثلج | مصفوفة | ضوء | نيون | شيطاني | بنفسجي | رعد | نار
معلومات: طقس | جو | اخبار | معلومات المجموعة | الاداريين | اعلى الاعضاء | رابط قصير
ذكاء اصطناعي: ذكاء | ميتا | جبتي | جيمني | تخيل | انشاء | ترجم | مسح المحادثة
أخرى: نص الى صوت | حذف | المالك | الايدي | بينغ | الرابط | منشن | منشن الكل | منشن مخفي | اطردني | نزلني | اكتموه | نداء المالك
المطور (للمالك فقط): مسح الجلسة | مسح المؤقت | تغيير صورة البوت | المشرفين | تحديث | تفاعل تلقائي | حالة تلقائية | كتابة تلقائية | قراءة تلقائية | منع المكالمات | حظر الخاص | الوضع`;

// Models for "ميتا" command (NVIDIA models)
const META_MODELS = [
    'meta/llama-4-maverick-17b-128e-instruct',
    'meta/llama-3.2-90b-vision-instruct',
    'google/gemma-3n-e4b-it',
    'upstage/solar-10.7b-instruct',
    'google/gemma-3n-e2b-it'
];

// Models for "جبتي" command (StepFun + NVIDIA fallback)
const STEP_MODELS = [
    'stepfun-ai/step-3.5-flash',
    'meta/llama-3.3-70b-instruct',
    'meta/llama-3.1-8b-instruct'
];

async function callNvidia(model, messages, maxTokens = 500) {
    const res = await axios.post(NVIDIA_URL, {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
    }, {
        headers: {
            'Authorization': `Bearer ${NVIDIA_TOKEN}`,
            'Content-Type': 'application/json'
        },
        timeout: 30000
    });
    return res.data?.choices?.[0]?.message?.content || '';
}

async function gptCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const senderId = message.key.participant || message.key.remoteJid;
        
        // Get sender name from message
        let senderName = '';
        if (message.key?.fromMe === false) {
            // Try to get from pushName (often contains user's display name)
            senderName = message.pushName || 
                         message.message?.conversation?.split(' ')[0] || 
                         '';
            // Clean name - remove any @ or numbers at end
            if (senderName) {
                senderName = senderName.replace(/@\d+$/, '').trim();
            }
        }

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: "يرجى تقديم سؤال بعد ميتا أو جبتي\n\nمثال: ميتا اكتب كود html"
            }, { quoted: message });
        }

        // Detect which command: "ميتا" or "جبتي"
        // Strip leading dots, then check if starts with command name
        const cmdText = text.replace(/^\.+/, '').trimStart();
        
        let query = '';
        let commandName = '';
        let models = [];

        if (/^ميتا/i.test(cmdText)) {
            query = cmdText.replace(/^ميتا/i, '').trim();
            commandName = 'ميتا';
            models = META_MODELS;
        } else if (/^جبتي/i.test(cmdText)) {
            query = cmdText.replace(/^جبتي/i, '').trim();
            commandName = 'جبتي';
            models = STEP_MODELS;
        } else {
            // Fallback: treat as meta
            query = text.trim();
            commandName = 'ميتا';
            models = META_MODELS;
        }

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `يرجى تقديم سؤال بعد ${commandName}\n\nمثال: ${commandName} اكتب كود html بسيط`
            }, { quoted: message });
        }

        // Show thinking reaction
        await sock.sendMessage(chatId, {
            react: { text: '🧠', key: message.key }
        });

        // Load user's conversation memory (with names)
        let conversationMemory = memory.getConversationContext(senderId, true);
        
        // Build messages: system + memory + current query (with name)
        const userLabel = senderName ? `[${senderName}]: ${query}` : query;
        // Append formatting reminder at the very end so model doesn't forget
        const userMsg = userLabel + `\n\n*تنبيه التنسيق:* استخدم *للعريض* و_للمائل_ و~للمشطوب~ و> للاقتباس و\`\`\`للكود\`\`\`. ممنوع ** و __ و * للمائل.`;
        const messages = [
            { role: 'system', content: LEEN_PERSONA },
            ...conversationMemory.slice(-30),
            { role: 'user', content: userMsg }
        ];

        // Save user query to memory with metadata
        memory.addToMemory(senderId, 'user', query, {
            senderName: senderName || 'مستخدم',
            chatId: chatId,
            timestamp: Date.now()
        });

        let lastError = '';
        let reply = '';

        for (const model of models) {
            try {
                console.log(`[${commandName.toUpperCase()}] Trying model: ${model}`);
                const res = await axios.post(NVIDIA_URL, {
                    model,
                    messages,
                    max_tokens: 500,
                    temperature: 0.7
                }, {
                    headers: {
                        'Authorization': `Bearer ${NVIDIA_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });
                
                reply = res.data?.choices?.[0]?.message?.content || '';
                if (reply && reply.trim()) {
                    break;
                }
            } catch (e) {
                lastError = e.message;
                console.log(`[${commandName.toUpperCase()}] Model ${model} failed: ${e.message?.substring(0, 80)}`);
                reply = '';
            }
        }

        if (!reply) {
            throw new Error(lastError || 'All models failed');
        }

        // Save assistant reply to memory
        memory.addToMemory(senderId, 'assistant', reply, {
            chatId: chatId,
            timestamp: Date.now()
        });

        // Send reply with forwarded style
        await sock.sendMessage(chatId, {
            react: { text: '🤖', key: message.key }
        });
        await sock.sendMessage(chatId, {
            text: reply,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('[GPT] Error:', error.message?.substring(0, 150));
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
        await sock.sendMessage(chatId, {
            text: "❌ فشل في الحصول على رد. يرجى المحاولة لاحقاً."
        }, { quoted: message });
    }
}

module.exports = gptCommand;
