import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export async function askAI(question: string, context?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'الخدمة غير متاحة حالياً. يرجى التواصل مع أحد خبرائنا مباشرةً.';
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `أنت مساعد ذكي على منصة "مستشاري" للاستشارات المهنية العربية. 
    مهمتك هي تقديم إجابات مفيدة ومختصرة باللغة العربية الفصيحة.
    توجّه المستخدمين دائماً نحو الخبراء المتخصصين في المجالات التالية: القانون، الطب، التقنية، الأعمال، التعليم، الصحة النفسية.
    كن لطيفاً ومحترفاً، وابدأ إجاباتك دائماً باللغة العربية.
    ${context ? `سياق إضافي: ${context}` : ''}
    `;

    const result = await model.generateContent(`${systemPrompt}\n\nالسؤال: ${question}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'عذراً، حدث خطأ في الاتصال بالخدمة. يرجى المحاولة لاحقاً أو التواصل مع أحد خبرائنا.';
  }
}
