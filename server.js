import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = process.env.PORT || 3000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[환경오류] .env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const app = express();
app.use(cors());
app.use(express.json());

// 정적파일 제공 (agk.html 서빙)
app.use(express.static('.'));

// 헬스체크
app.get('/health', (_, res) => {
  res.json({ status: 'OK', time: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[AGK] 서버 실행중 => http://localhost:${PORT}`);
});
