import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BAD_WORDS = ['fuck','shit','bitch','asshole','개새','씨발','좆'];
function clean(text: string) {
  let t = text;
  for (const w of BAD_WORDS) {
    const re = new RegExp(w, 'gi');
    t = t.replace(re, '*'.repeat(w.length));
  }
  return t;
}

export default function SpotReviews({ spotId }:{spotId:string}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (text.trim().length < 10) return alert('10자 이상 작성해주세요.');
    setLoading(true);
    try {
      await addDoc(collection(db, `spots/${spotId}/reviews`), {
        body: clean(text.trim()),
        createdAt: serverTimestamp()
      });
      setText('');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={e=>setText(e.target.value)} className="w-full border rounded-xl p-3" rows={4} />
      <button disabled={loading} onClick={submit} className="px-4 py-2 rounded-xl bg-black text-white">리뷰 등록</button>
    </div>
  );
}
