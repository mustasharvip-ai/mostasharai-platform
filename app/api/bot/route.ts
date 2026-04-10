import { NextRequest, NextResponse } from 'next/server';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  getDoc,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const BOT_TOKEN = process.env.ADMIN_TELEGRAM_BOT_TOKEN || '';
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID || '';

async function sendMessage(chatId: string | number, text: string): Promise<void> {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id?.toString();
    const text: string = message.text || '';

    // Security: only allow admin
    if (chatId !== ADMIN_CHAT_ID) {
      await sendMessage(chatId, '⛔ ليس لديك صلاحية استخدام هذا البوت.');
      return NextResponse.json({ ok: true });
    }

    const parts = text.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();

    // /help
    if (command === '/help') {
      await sendMessage(
        chatId,
        `🤖 <b>أوامر بوت مستشاري:</b>\n\n` +
          `/stats - إحصائيات المنصة\n` +
          `/ban [userId] - حظر مستخدم\n` +
          `/unban [userId] - رفع الحظر\n` +
          `/setBalance [userId] [amount] - تعيين رصيد\n` +
          `/approveBalance [requestId] - الموافقة على طلب شحن\n` +
          `/help - عرض هذه القائمة`
      );
      return NextResponse.json({ ok: true });
    }

    // /stats
    if (command === '/stats') {
      try {
        const [usersSnap, postsSnap, reqSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), limit(1000))),
          getDocs(query(collection(db, 'posts'), limit(1000))),
          getDocs(query(collection(db, 'balanceRequests'), limit(1000))),
        ]);
        const pendingReqs = reqSnap.docs.filter((d) => d.data().status === 'pending').length;

        await sendMessage(
          chatId,
          `📊 <b>إحصائيات منصة مستشاري:</b>\n\n` +
            `👥 المستخدمون: <b>${usersSnap.size}</b>\n` +
            `📝 المنشورات: <b>${postsSnap.size}</b>\n` +
            `💰 طلبات الشحن الكلية: <b>${reqSnap.size}</b>\n` +
            `⏳ طلبات قيد المراجعة: <b>${pendingReqs}</b>`
        );
      } catch {
        await sendMessage(chatId, '❌ حدث خطأ أثناء جلب الإحصائيات.');
      }
      return NextResponse.json({ ok: true });
    }

    // /ban [userId]
    if (command === '/ban') {
      const userId = parts[1];
      if (!userId) {
        await sendMessage(chatId, '⚠️ الاستخدام: /ban [userId]');
        return NextResponse.json({ ok: true });
      }
      try {
        await updateDoc(doc(db, 'users', userId), { banned: true });
        await sendMessage(chatId, `✅ تم حظر المستخدم <code>${userId}</code> بنجاح.`);
      } catch {
        await sendMessage(chatId, `❌ لم يتم العثور على المستخدم: <code>${userId}</code>`);
      }
      return NextResponse.json({ ok: true });
    }

    // /unban [userId]
    if (command === '/unban') {
      const userId = parts[1];
      if (!userId) {
        await sendMessage(chatId, '⚠️ الاستخدام: /unban [userId]');
        return NextResponse.json({ ok: true });
      }
      try {
        await updateDoc(doc(db, 'users', userId), { banned: false });
        await sendMessage(chatId, `✅ تم رفع الحظر عن المستخدم <code>${userId}</code>.`);
      } catch {
        await sendMessage(chatId, `❌ لم يتم العثور على المستخدم: <code>${userId}</code>`);
      }
      return NextResponse.json({ ok: true });
    }

    // /setBalance [userId] [amount]
    if (command === '/setbalance') {
      const userId = parts[1];
      const amount = parseFloat(parts[2]);
      if (!userId || isNaN(amount)) {
        await sendMessage(chatId, '⚠️ الاستخدام: /setBalance [userId] [amount]');
        return NextResponse.json({ ok: true });
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          await sendMessage(chatId, `❌ لم يتم العثور على المستخدم: <code>${userId}</code>`);
          return NextResponse.json({ ok: true });
        }
        const currentBalance = userDoc.data().balance || 0;
        await updateDoc(doc(db, 'users', userId), {
          balance: amount,
        });
        await sendMessage(
          chatId,
          `✅ تم تعيين رصيد المستخدم <code>${userId}</code>:\n` +
            `الرصيد السابق: <b>${currentBalance}</b> ريال\n` +
            `الرصيد الجديد: <b>${amount}</b> ريال`
        );
      } catch {
        await sendMessage(chatId, '❌ حدث خطأ أثناء تعيين الرصيد.');
      }
      return NextResponse.json({ ok: true });
    }

    // /approveBalance [requestId]
    if (command === '/approvebalance') {
      const requestId = parts[1];
      if (!requestId) {
        await sendMessage(chatId, '⚠️ الاستخدام: /approveBalance [requestId]');
        return NextResponse.json({ ok: true });
      }
      try {
        const reqDoc = await getDoc(doc(db, 'balanceRequests', requestId));
        if (!reqDoc.exists()) {
          await sendMessage(chatId, `❌ لم يتم العثور على الطلب: <code>${requestId}</code>`);
          return NextResponse.json({ ok: true });
        }
        const reqData = reqDoc.data();
        if (reqData.status !== 'pending') {
          await sendMessage(chatId, `⚠️ الطلب ليس قيد المراجعة. الحالة الحالية: ${reqData.status}`);
          return NextResponse.json({ ok: true });
        }
        await updateDoc(doc(db, 'balanceRequests', requestId), { status: 'approved' });
        await updateDoc(doc(db, 'users', reqData.userId), {
          balance: increment(reqData.amount),
        });
        await sendMessage(
          chatId,
          `✅ تمت الموافقة على طلب الشحن:\n` +
            `المستخدم: <b>${reqData.userName}</b>\n` +
            `المبلغ: <b>${reqData.amount}</b> ريال\n` +
            `رقم الطلب: <code>${requestId}</code>`
        );
      } catch {
        await sendMessage(chatId, '❌ حدث خطأ أثناء الموافقة على الطلب.');
      }
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendMessage(
      chatId,
      `❓ أمر غير معروف. اكتب /help لعرض قائمة الأوامر المتاحة.`
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram bot error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Mostasharai Telegram Bot is running ✅' });
}
