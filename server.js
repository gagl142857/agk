
import express from "express";
import cors from "cors";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PORT = process.env.PORT || 3000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[환경오류] .env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "agk.html"));
});

app.get("/health", (_, res) => {
  res.json({ status: "OK", time: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[AGK] 서버 실행중 => http://localhost:${PORT}`);
});

app.post("/register", async (req, res) => {
  try {
    const { 아이디, 비밀번호 } = req.body;

    if (!아이디 || !비밀번호) {
      return res.status(400).json({ 오류: "아이디와 비밀번호가 필요합니다." });
    }

    // ① 중복 확인
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("유저아이디", 아이디)
      .maybeSingle();

    if (checkError) {
      console.error("DB 조회 오류:", checkError);
      return res.status(500).json({ 오류: "DB 조회 실패" });
    }
    if (existing) {
      return res.status(400).json({ 오류: "이미 사용중인 아이디입니다." });
    }

    // ② Auth 계정 생성
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email: `${아이디}@agk.com`,
      password: 비밀번호,
      email_confirm: true
    });

    if (authError) {
      console.error("Auth 생성 오류:", authError);
      return res.status(400).json({ 오류: authError.message });
    }

    // ③ users 테이블에 저장 (id는 자동 생성, 유저UID 따로 저장)
    const { error: dbError } = await supabase.from("users").insert({
      유저아이디: 아이디,
      유저UID: user.user.id   // 새로 만든 컬럼에 Auth UID 저장
    });

    if (dbError) {
      console.error("DB 저장 오류:", dbError);
      return res.status(500).json({ 오류: dbError.message });
    }

    res.json({ 성공: true, 유저UID: user.user.id, 유저아이디: 아이디 });

  } catch (err) {
    console.error("서버 오류:", err);
    res.status(500).json({ 오류: "서버 오류 발생" });
  }
});








/*

git add . && git commit -m "배포" && git push origin main

nodemon server.js

*/