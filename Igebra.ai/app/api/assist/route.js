export const runtime = 'nodejs';

function retrieve(question, material) {
  const terms = question.toLowerCase().split(/\W+/).filter(term => term.length > 2);
  const chunks = material.split(/\n\s*\n/).filter(Boolean);
  return chunks.map(text => ({ text, score: terms.reduce((n, term) => n + (text.toLowerCase().includes(term) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score)[0];
}

export async function POST(request) {
  try {
    const { question, material } = await request.json();
    if (typeof question !== 'string' || typeof material !== 'string' || !question.trim() || !material.trim()) return Response.json({ error: 'A question and study material are required.' }, { status: 400 });
    const passage = retrieve(question, material);
    if (!passage?.score) return Response.json({ answer: 'I could not find relevant information in your uploaded material. Add a relevant note or ask about a topic covered by your source.', citation: null });
    const citation = passage.text.match(/\((Chapter|Section)[^)]*\)/i)?.[0]?.replace(/[()]/g, '') || 'Uploaded material';
    const key = process.env.GROQ_API_KEY;
    if (!key) return Response.json({ answer: passage.text.replace(/^\s*\d+[.)]\s*/, '').slice(0, 1000) + '\n\nThis answer uses only the retrieved passage from your material.', citation });
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.2, messages: [
        { role: 'system', content: 'Answer the student using only the supplied source excerpt. If it does not contain the answer, say so. Do not add outside facts. Keep the answer concise and explain in student-friendly language.' },
        { role: 'user', content: `Question: ${question}\n\nSource excerpt [${citation}]:\n${passage.text}` }
      ] })
    });
    if (!upstream.ok) return Response.json({ answer: passage.text + '\n\n(Showing the retrieved source passage; AI explanation is temporarily unavailable.)', citation });
    const data = await upstream.json();
    return Response.json({ answer: data.choices?.[0]?.message?.content || passage.text, citation });
  } catch { return Response.json({ error: 'Could not process this request.' }, { status: 500 }); }
}
