
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
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const app = express();
app.use(cors());
app.use(express.json());

// 차단아이피관리
const 차단된IP목록 = ["",];

app.use(async (req, res, next) => {
  const clientIP = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
    .toString()
    .split(",")[0]
    .trim();

  // 1. 아이피 차단
  if (차단된IP목록.includes(clientIP)) {
    return res.status(403).send(`<html>접속이 차단된 IP입니다</html>`);
  }

  // try {
  //   const { data: 전체유저, error } = await supabase
  //     .from("users")
  //     .select("id, 스탯");

  //   if (error) {
  //     console.error(error);
  //     return res.status(500).json({ 오류: "유저 조회 실패" });
  //   }

  //   전체유저.sort((a, b) => (b.스탯.전투력 || 0) - (a.스탯.전투력 || 0));

  //   await Promise.all(
  //     전체유저.map((u, i) => {
  //       u.스탯.전장 = u.스탯.전장 || {};
  //       u.스탯.전장.순위 = i + 1;

  //       return supabase
  //         .from("users")
  //         .update({ 스탯: u.스탯 })
  //         .eq("id", u.id);
  //     })
  //   );

  // } catch (err) {
  //   console.error("", err);
  // }

  // try {
  //   const { data: 전체유저, error } = await supabase
  //     .from("users")
  //     .select("id, 스탯");

  //   if (!error && 전체유저) {
  //     for (let i = 0; i < 전체유저.length; i++) {
  //       if (!전체유저[i].스탯.던전) {
  //         전체유저[i].스탯.던전 = {};
  //       }
  //       if (!전체유저[i].스탯.던전.로쿠규) {
  //         전체유저[i].스탯.던전.로쿠규 = { 레벨: 1, 열쇠: 4 };

  //         await supabase
  //           .from("users")
  //           .update({ 스탯: 전체유저[i].스탯 })
  //           .eq("id", 전체유저[i].id);
  //       }
  //     }
  //   }
  // } catch (err) {
  //   console.error("던전 로쿠규 셋팅 오류:", err);
  // }


  next();
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "agk.html"));
});


// 회원가입하기
app.post("/register", async (req, res) => {
  try {
    const { 아이디, 비밀번호, 서버 } = req.body;
    if (!아이디 || !비밀번호) {
      return res.status(400).json({ 오류: "아이디와 비밀번호가 필요합니다." });
    }

    const email = `${아이디}@agk.com`;

    // Auth 계정 생성
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: 비밀번호,
        email_confirm: true
      });

    if (authError) {
      console.error("Auth 생성 오류:", authError);
      return res.status(400).json({ 오류: "아이디가 존재합니다" });
    }

    const id = authData.user.id; // Supabase Auth UID

    const now = new Date();

    const clientIP = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .toString()
      .split(",")[0]
      .trim();


    //신규유저
    const 기본스탯 = {
      생성시각: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }), //"2025. 8. 26. 오후 4:37:00",
      생성요일: now.toLocaleDateString("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" }), //"화요일"
      접속시각: Math.floor(now.getTime() / 3600000), // 478520,
      접속요일: now.toLocaleDateString("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" }), //"화요일"
      계정: {
        유저아이디: 아이디,
        유저닉네임: 아이디,
        레벨: 1,
        현재경험치: 0,
        다음경험치: 350,
        HP: 1000,
        공격력: 60,
        방어력: 20,
        공속: 1,
        치명피해: 200,
        치명저항: 100,
        일반공격계수: 100,
        콤보계수: 100,
        반격계수: 100,
        스킬치명피해: 100,
        스킬피해: 100,
        동료피해: 100,
        치유량: 0.2,
      },
      램프: {
        레벨: 1,
        현재골드: 0,
        다음골드: 6000,
        수량: 200,
        가루: 0,
      },
      다이아: 0,
      낙엽: 0,
      서버: 서버,
      서버점검: 0,
      최초IP: clientIP,
      접속IP: clientIP,
      기기ID: req.body.기기ID || null,
      버전: 3,
      우편함: [
        {
          이름: "램프",
          수량: 200,
          시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
          메모: "신규유저 보상",
        },
      ],
      주인장인가: 아이디 === "codl" ? 1 : 0,
      던전: {
        지니: { 레벨: 1, 열쇠: 4 },
        로쿠규: { 레벨: 1, 열쇠: 4 },
        락골렘: { 레벨: 1, 열쇠: 4 },
      },
      민원: {

      },
      전장: {
        순위: 0,
        티켓: 4,
      },
      탈것: {
        HP보너스: 0,
        공격력보너스: 0,
        방어력보너스: 0,
        레벨: 0,
      }
    };

    const { error: dbError } = await supabase
      .from("users")
      .insert({
        id,
        스탯: 기본스탯
      });

    if (dbError) {
      console.error("DB 저장 오류:", dbError);
      return res.status(500).json({ 오류: "저장실패" });
    }

    res.json({ 성공: true });
  } catch (err) {
    console.error("서버 오류:", err);
    res.status(500).json({ 오류: "서버 오류 발생" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { 아이디, 비밀번호, 기기ID } = req.body;
    let data;

    if (아이디 && 비밀번호) {
      const email = `${아이디}@agk.com`;
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password: 비밀번호 });
      if (authError || !authData.user) {
        return res.status(400).json({ 오류: "아이디 또는 비밀번호가 올바르지 않습니다" });
      }
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();
      if (error || !userData) return res.status(404).json({ 오류: "유저 데이터 없음" });
      data = userData;
    } else if (기기ID) {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("스탯->>기기ID", 기기ID)
        .single();
      if (error || !userData) return res.status(404).json({ 오류: "agk에 찾아와주셔서 감사합니다" });
      data = userData;
    } else {
      return res.status(400).json({ 오류: "아이디/비밀번호 또는 기기ID 필요" });
    }

    const 오늘요일 = new Date().toLocaleDateString("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" });
    if (data.스탯.접속요일 !== 오늘요일) {
      data.스탯.접속요일 = 오늘요일;
      if (data.스탯.던전.지니.열쇠 < 4) data.스탯.던전.지니.열쇠 = 4;
      if (data.스탯.던전.로쿠규.열쇠 < 4) data.스탯.던전.로쿠규.열쇠 = 4;
      if (data.스탯.전장.티켓 < 4) data.스탯.전장.티켓 = 4;
    }

    const clientIP = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .toString().split(",")[0].trim();

    const now = new Date();
    const 현재접속 = Math.floor(now.getTime() / 3600000);
    const 이전접속 = data.스탯?.접속시각 || 현재접속;
    const 시간차 = Math.min(현재접속 - 이전접속, 24);

    if (시간차 > 0) {
      const 램프보상 = {
        이름: "램프",
        수량: 시간차 * 40,
        시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
        메모: `${시간차}시간 방치보상`,
      };

      const 다이아보상 = {
        이름: "다이아",
        수량: 시간차 * 40,
        시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
        메모: `${시간차}시간 방치보상`,
      };

      if (!data.스탯.우편함) data.스탯.우편함 = [];
      data.스탯.우편함.unshift(램프보상);
      data.스탯.우편함.unshift(다이아보상);

      data.스탯.접속시각 = 현재접속;
    }

    //기존유저
    if (!data.스탯.던전.락골렘) {
      data.스탯.던전.락골렘 = { 레벨: 1, 열쇠: 4 };
    }
    if (!data.스탯.스톤) {
      data.스탯.스톤 = 0;
    }

    if (기기ID) data.스탯.기기ID = 기기ID;
    data.스탯.접속IP = clientIP;
    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    const 스탯 = data.스탯;

    const { error: updateError } = await supabase.from("users").update({ 스탯 }).eq("id", data.id);
    if (updateError) return res.status(500).json({ 오류: "DB저장 실패" });

    await supabase.from("로그기록").insert({
      스탯: data.스탯,
      유저아이디: data.스탯.계정.유저아이디,
      유저닉네임: data.스탯.계정.유저닉네임,
      내용: (아이디 && 비밀번호) ? `로그인 / +${시간차 * (data.스탯.램프.레벨 * 2)}` : `자동로그인 / +${시간차 * (data.스탯.램프.레벨 * 2)}`
    });

    res.json(data);
  } catch (err) {
    console.error("로그인 오류:", err);
    res.status(500).json({ 오류: "로그인 처리 실패" });
  }
});


//회원탈퇴하기
app.post("/delete-user", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ 오류: "id 필요" });
    }

    // ① 유저 스탯 먼저 조회
    const { data, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      return res.status(404).json({ 오류: "유저 조회 실패" });
    }

    // ② 로그 먼저 기록
    await supabase
      .from("로그기록")
      .insert({
        스탯: data.스탯,
        유저아이디: data.스탯.계정.유저아이디,
        유저닉네임: data.스탯.계정.유저닉네임,
        내용: `회원탈퇴`,
      });

    // ① users 테이블에서 삭제
    const { error: dbError } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) {
      return res.status(500).json({ 오류: "DB 삭제 실패" });
    }

    // ② Auth 계정 삭제
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      return res.status(500).json({ 오류: "Auth 삭제 실패" });
    }

    res.json({ 성공: true });
  } catch (err) {
    res.status(500).json({ 오류: "서버 오류 발생" });
  }
});

app.post("/logout", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ 오류: "id 필요" });
    }

    // ① 유저 스탯 먼저 조회
    const { data, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !data) {
      return res.status(404).json({ 오류: "유저 조회 실패" });
    }

    // ② 로그 먼저 기록
    await supabase
      .from("로그기록")
      .insert({
        스탯: data.스탯,
        유저아이디: data.스탯.계정.유저아이디,
        유저닉네임: data.스탯.계정.유저닉네임,
        내용: `로그아웃`,
      });

    data.스탯.기기ID = null;

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    const 스탯 = data.스탯;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);

  } catch (err) {
    res.status(500).json({ 오류: "서버 오류 발생" });
  }
});

app.post("/main", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "스탯 조회 실패" });
    }

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    const 스탯 = data.스탯;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "스탯 저장 실패" });
    }


    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/lamp", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(500).json({ 오류: "조회 실패" });

    if (data.스탯?.드랍 && Object.keys(data.스탯.드랍).length > 0) {
      return res.status(400).json({ 오류: "드랍장비 있음" });
    }

    if (!data.스탯?.램프 || data.스탯.램프.수량 < 1) {
      return res.status(400).json({ 오류: "램프 부족" });
    }


    const 현재전투력 = 최종스탯계산(data.스탯).전투력;


    const 계정레벨 = data.스탯.계정.레벨 || 1;
    const 현재경험치 = data.스탯.계정.현재경험치 || 0;
    const 램프레벨 = data.스탯.램프.레벨 || 1;

    const 후보 = Array.from(
      { length: (5 + 5) + 1 }, // 총 11개 (-5 ~ +5)
      (_, i) => 계정레벨 - 5 + i
    ).filter(lv => lv >= 1);
    const 장비레벨 = 후보[Math.floor(Math.random() * 후보.length)];

    // 등급 결정
    const 확률표 = 드랍확률표[램프레벨];
    const 뽑기 = Math.random() * 100;
    let 누적 = 0, 선택등급 = "D";
    for (const [등급, 확률] of Object.entries(확률표)) {
      누적 += 확률;
      if (뽑기 <= 누적) {
        선택등급 = 등급;
        break;
      }
    }

    const idx = 등급순서.indexOf(선택등급);

    const 옵션후보 = [...특수옵션];
    const 선택된옵션 = [];
    for (let i = 0; i < 2; i++) {
      const idx2 = Math.floor(Math.random() * 옵션후보.length);
      선택된옵션.push(옵션후보.splice(idx2, 1)[0]);
    }

    const HP = Math.floor((100 + (30 * idx)) * 장비레벨 * (0.8 + Math.random() * 0.3));
    const 공격력 = Math.floor((5 + (2 * idx)) * 장비레벨 * (0.8 + Math.random() * 0.3));
    const 방어력 = Math.floor((2 + (1 * idx)) * 장비레벨 * (0.8 + Math.random() * 0.3));

    const 공속원본 = (0.001 + (0.001 * idx)) * 장비레벨 * (0.8 + Math.random() * 0.3);
    const 공속 = Math.floor(공속원본 * 1000) / 1000;

    const [최소, 최대] = 특수옵션범위[선택등급];

    const 옵션값1 = Math.floor((Math.random() * (최대 - 최소) + 최소) * 100) / 100;
    const 옵션값2 = Math.floor((Math.random() * (최대 - 최소) + 최소) * 100) / 100;

    const 드랍 = {
      이름: 드랍장비이름[Math.floor(Math.random() * 드랍장비이름.length)],
      레벨: 장비레벨,
      등급: 선택등급,
      HP,
      공격력,
      방어력,
      공속,

    };

    드랍[선택된옵션[0]] = Number(옵션값1);
    드랍[선택된옵션[1]] = Number(옵션값2);



    data.스탯.드랍 = 드랍;
    data.스탯.램프.수량 = Math.max(0, data.스탯.램프.수량 - 1);

    const 스탯 = data.스탯;


    let 비교스탯 = JSON.parse(JSON.stringify(data.스탯));
    const 장착장비 = data.스탯[data.스탯.드랍.이름];
    const 드랍장비 = data.스탯.드랍;

    비교스탯[드랍장비.이름] = 드랍장비;

    비교스탯 = { ...비교스탯, ...최종스탯계산(비교스탯) };

    const 전투력차이 = Math.trunc(비교스탯.전투력 - 현재전투력);


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "스탯 저장 실패" });
    }


    // await supabase
    //   .from("로그기록")
    //   .insert({
    //     스탯: data.스탯,
    //     유저아이디: data.스탯.계정.유저아이디,
    //     유저닉네임: data.스탯.계정.유저닉네임,
    //     내용: `장비뽑기`,
    //   });

    res.json({ ...data, 전투력차이 });


  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});


app.post("/equip", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (!data.스탯.드랍 || !data.스탯.드랍.이름) {
      return res.status(400).json({ 오류: "드랍 없음" });
    }

    const 교체전전투력 = 최종스탯계산(data.스탯).전투력;

    const 장착장비 = data.스탯[data.스탯.드랍.이름];
    const 드랍장비 = data.스탯.드랍;

    // 교체 로직
    if (data.스탯[data.스탯.드랍.이름]) {
      data.스탯[data.스탯.드랍.이름] = 드랍장비;
      data.스탯.드랍 = 장착장비;
    } else {
      data.스탯[data.스탯.드랍.이름] = 드랍장비;
      data.스탯.드랍 = null;
    }

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    const 스탯 = data.스탯;

    const 교체후전투력 = data.스탯.전투력;

    // 차이 (상승이면 양수, 하락이면 음수)
    const 전투력차이 = Math.trunc(교체전전투력 - 교체후전투력);


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // await supabase
    //   .from("로그기록")
    //   .insert({
    //     스탯: data.스탯,
    //     유저아이디: data.스탯.계정.유저아이디,
    //     유저닉네임: data.스탯.계정.유저닉네임,
    //     내용: `장비장착`,
    //   });

    res.json({ ...data, 전투력차이 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/sell", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (!data.스탯.드랍 || !data.스탯.드랍.이름) {
      return res.status(400).json({ 오류: "드랍 없음" });
    }

    const idx = 등급순서.indexOf(data.스탯.드랍.등급);

    data.스탯.계정.현재경험치 = Math.floor((data.스탯.계정.현재경험치 || 0) + (100 + (20 * idx)) * (0.8 + Math.random() * 0.3));
    data.스탯.램프.현재골드 = Math.floor((data.스탯.램프.현재골드 || 0) + (50 + (10 * idx)) * (0.8 + Math.random() * 0.3));
    data.스탯.드랍 = {};
    data.스탯.램프.가루 = (data.스탯.램프.가루 || 0) + 10;

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    const 스탯 = data.스탯;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // await supabase
    //   .from("로그기록")
    //   .insert({
    //     스탯: data.스탯,
    //     유저아이디: data.스탯.계정.유저아이디,
    //     유저닉네임: data.스탯.계정.유저닉네임,
    //     내용: `장비판매`,
    //   });

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/mailbox", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    const 스탯 = data.스탯;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/receive-all-mail", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (!data.스탯.우편함 || data.스탯.우편함.length === 0) {
      return res.status(400).json({ 오류: "받을 우편 없음" });
    }

    for (let i = data.스탯.우편함.length - 1; i >= 0; i--) {
      const mail = data.스탯.우편함[i];
      if (mail.이름 === "램프") {
        data.스탯.램프.수량 += mail.수량;
      } else if (mail.이름 === "다이아") {
        data.스탯.다이아 += mail.수량;
      } else {
        await supabase.from("로그기록").insert({
          스탯: data.스탯,
          유저아이디: data.스탯.계정.유저아이디,
          유저닉네임: data.스탯.계정.유저닉네임,
          내용: `잘못된 우편 삭제(${mail.이름})`,
        });
      }
      data.스탯.우편함.splice(i, 1);
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/receive-mail", async (req, res) => {
  try {
    const { id, index } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (!data.스탯.우편함[index]) {
      return res.status(400).json({ 오류: "해당 우편 없음" });
    }

    if (data.스탯.우편함[index].이름 === "램프") {
      data.스탯.램프.수량 += data.스탯.우편함[index].수량;
      data.스탯.우편함.splice(index, 1);

    } else if (data.스탯.우편함[index].이름 === "다이아") {
      data.스탯.다이아 += data.스탯.우편함[index].수량;
      data.스탯.우편함.splice(index, 1);

    } else {
      const 잘못된이름 = data.스탯.우편함[index].이름;
      data.스탯.우편함.splice(index, 1);

      const { error: updateError } = await supabase
        .from("users")
        .update({ 스탯: data.스탯 })
        .eq("id", id);

      if (updateError) {
        console.error(updateError);
        return res.status(500).json({ 오류: "DB저장 실패" });
      }

      await supabase.from("로그기록").insert({
        스탯: data.스탯,
        유저아이디: data.스탯.계정.유저아이디,
        유저닉네임: data.스탯.계정.유저닉네임,
        내용: `잘못된 우편 삭제(${잘못된이름})`,
      });

      return res.status(400).json({ 오류: "잘못된 우편이므로 자동 삭제되었습니다" });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/master", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.주인장인가 !== 1) {
      return res.status(500).json({ 오류: "주인장이 아닙니다" });
    }

    const { data: 전체유저, error: 전체조회에러 } = await supabase
      .from("users")
      .select("스탯");

    if (전체조회에러) {
      console.error(전체조회에러);
      return res.status(500).json({ 오류: "전체유저 조회 실패" });
    }

    const 닉네임목록 = 전체유저.map(u => u.스탯?.계정?.유저닉네임 || null);

    res.json({ 닉네임목록 });


  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});


app.post("/send-mail", async (req, res) => {
  try {
    const { 대상닉네임, 이름, 수량, 메모, id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.주인장인가 !== 1) {
      return res.status(500).json({ 오류: "주인장이 아닙니다" });
    }


    if (!대상닉네임 || !이름 || !수량) {
      return res.status(400).json({ 오류: "대상, 이름, 수량은 필수입니다" });
    }

    // 1. 대상 유저 찾기 (닉네임으로 검색)
    const { data: 대상유저, error: 조회에러 } = await supabase
      .from("users")
      .select("*")
      .eq("스탯->계정->>유저닉네임", 대상닉네임)
      .single();

    if (조회에러 || !대상유저) {
      console.error("대상 조회 실패:", 조회에러);
      return res.status(404).json({ 오류: "대상 유저를 찾을 수 없습니다" });
    }

    // 2. 기존 우편함 불러오기
    const 우편함 = 대상유저.스탯.우편함 || [];

    // 3. 새 우편 생성
    const now = new Date();
    const 새우편 = {
      이름,
      수량: Number(수량),
      시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      메모: 메모 || "",
    };

    // 4. 배열에 추가
    우편함.unshift(새우편);
    대상유저.스탯.우편함 = 우편함;

    // 5. DB 업데이트
    const { error: 업데이트에러 } = await supabase
      .from("users")
      .update({ 스탯: 대상유저.스탯 })
      .eq("id", 대상유저.id);

    if (업데이트에러) {
      console.error("업데이트 오류:", 업데이트에러);
      return res.status(500).json({ 오류: "우편 저장 실패" });
    }

    await supabase
      .from("로그기록")
      .insert({
        스탯: "개인우편",
        유저아이디: 대상유저.스탯.계정.유저아이디,
        유저닉네임: 대상유저.스탯.계정.유저닉네임,
        내용: JSON.stringify(새우편),
      });


    res.json({ 성공: true, 메시지: "우편 발송 완료" });
  } catch (err) {
    console.error("서버 오류:", err);
    res.status(500).json({ 오류: "서버 오류 발생" });
  }
});

app.post("/send-mail-all", async (req, res) => {
  try {
    const { 이름, 수량, 메모, id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.주인장인가 !== 1) {
      return res.status(500).json({ 오류: "주인장이 아닙니다" });
    }


    if (!이름 || !수량) {
      return res.status(400).json({ 오류: "이름, 수량은 필수입니다" });
    }

    const { data: 전체유저, error: 전체조회에러 } = await supabase
      .from("users")
      .select("id, 스탯");

    if (전체조회에러 || !전체유저 || 전체유저.length === 0) {
      return res.status(500).json({ 오류: "전체유저 조회 실패" });
    }

    const now = new Date();
    const 새우편 = {
      이름,
      수량,
      메모,
      시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
    };

    for (const u of 전체유저) {
      const 우편함 = u.스탯.우편함 || [];
      우편함.unshift(새우편);
      u.스탯.우편함 = 우편함;

      await supabase
        .from("users")
        .update({ 스탯: u.스탯 })
        .eq("id", u.id);
    }

    res.json({ 성공: true });

  } catch (err) {
    console.error("서버 오류:", err);
    res.status(500).json({ 오류: "서버 오류 발생" });
  }
});

app.post("/change-nickname", async (req, res) => {
  try {
    const { id, 닉네임 } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });
    if (!닉네임) return res.status(400).json({ 오류: "닉네임 필요" });

    if (!/^[가-힣a-zA-Z]+$/.test(닉네임)) {
      return res.status(400).json({ 오류: "닉네임은 한글과 영어만 가능합니다" });
    }

    if (닉네임.length > 7) {
      return res.status(400).json({ 오류: "닉네임은 최대 6글자입니다" });
    }


    const { data: 중복, error: 중복에러 } = await supabase
      .from("users")
      .select("스탯")
      .eq("스탯->계정->>유저닉네임", 닉네임)
      .neq("id", id)
      .maybeSingle();

    if (중복에러 && 중복에러.code !== "PGRST116") {
      console.error(중복에러);
      return res.status(500).json({ 오류: "중복검사 실패" });
    }

    if (중복) {
      return res.status(400).json({ 오류: "이미 사용중인 닉네임입니다" });
    }


    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    data.스탯.계정.유저닉네임 = 닉네임;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Geniesweep", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.던전.지니.레벨 < 2) {
      return res.status(400).json({ 오류: "도전 성공 시 소탕 가능합니다" });
    }

    if (data.스탯.던전.지니.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }


    data.스탯.램프.수량 = data.스탯.램프.수량 + data.스탯.던전.지니.레벨 * 20;

    data.스탯.던전.지니.열쇠 -= 1;


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);
    // res.json({ data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/GenieDungeon", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.던전.지니.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }


    const 지니 = {
      스탯: {
        치명: 10 * data.스탯.던전.지니.레벨,
        치명무시: 0,
        치명피해: 200 + 20 * data.스탯.던전.지니.레벨,
        치명저항: 100 + 10 * data.스탯.던전.지니.레벨,
        콤보: 1 * data.스탯.던전.지니.레벨,
        콤보무시: 1 * data.스탯.던전.지니.레벨,
        반격: 1 * data.스탯.던전.지니.레벨,
        반격무시: 1 * data.스탯.던전.지니.레벨,
        스턴: 1 * data.스탯.던전.지니.레벨,
        스턴무시: 1 * data.스탯.던전.지니.레벨,
        회피: 1 * data.스탯.던전.지니.레벨,
        회피무시: 1 * data.스탯.던전.지니.레벨,
        회복: 1 * data.스탯.던전.지니.레벨,
        회복무시: 1 * data.스탯.던전.지니.레벨,
        에어본: 1 * data.스탯.던전.지니.레벨,
        일반공격계수: 100 + 1 * data.스탯.던전.지니.레벨,
        일반공격피해감소: 1 * data.스탯.던전.지니.레벨,
        콤보계수: 100 + 1 * data.스탯.던전.지니.레벨,
        콤보피해감소: 0,
        반격계수: 100 + 1 * data.스탯.던전.지니.레벨,
        반격피해감소: 0,
        스킬치명: 0,
        스킬치명피해: 100 + 1 * data.스탯.던전.지니.레벨,
        스킬피해: 100 + 1 * data.스탯.던전.지니.레벨,
        스킬피해감소: 0,
        보스피해: 0,
        보스피해감소: 0,
        동료피해: 100 + 1 * data.스탯.던전.지니.레벨,
        동료피해감소: 0,
        치유율: 0,
        치유량: 0.2 + 0.002 * data.스탯.던전.지니.레벨,
        관통: 0,
        관통무시: 0,
        막기: 0,
        막기무시: 0,
        동료찬사: 0,
        동료찬사무시: 0,
        동료저항: 0,
        동료저항무시: 0,
        피해감소: 0,
        최종HP: 15000 * data.스탯.던전.지니.레벨,
        최종공격력: 900 * data.스탯.던전.지니.레벨,
        최종방어력: 300 * data.스탯.던전.지니.레벨,
        최종공속: 1 + 0.2 * data.스탯.던전.지니.레벨,
        전투력:
          (10000 * data.스탯.던전.지니.레벨) * 0.05 +
          (600 * data.스탯.던전.지니.레벨) +
          (200 * data.스탯.던전.지니.레벨) * 2 +
          (1 + 0.2 * data.스탯.던전.지니.레벨) * 50,
      }
    };



    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(data)), // 복사본
      JSON.parse(JSON.stringify(지니))  // 복사본
    );


    if (전투결과.결과 === "승리") {
      data.스탯.램프.수량 = data.스탯.램프.수량 + data.스탯.던전.지니.레벨 * 20;
      data.스탯.던전.지니.레벨 += 1;
    }

    data.스탯.던전.지니.열쇠 -= 1;


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // res.json(data);
    res.json({ data, 전투결과 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Rokugyusweep", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.던전.로쿠규.레벨 < 2) {
      return res.status(400).json({ 오류: "도전 성공 시 소탕 가능합니다" });
    }

    if (data.스탯.던전.로쿠규.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }


    data.스탯.낙엽 = data.스탯.낙엽 + data.스탯.던전.로쿠규.레벨 * 1;

    data.스탯.던전.로쿠규.열쇠 -= 1;


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);
    // res.json({ data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/RokugyuDungeon", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.던전.로쿠규.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }


    const 로쿠규 = {
      스탯: {
        치명: 1 * data.스탯.던전.로쿠규.레벨,
        치명무시: 0,
        치명피해: 200 + 2 * data.스탯.던전.로쿠규.레벨,
        치명저항: 100 + 1 * data.스탯.던전.로쿠규.레벨,
        콤보: 10 * data.스탯.던전.로쿠규.레벨,
        콤보무시: 10 * data.스탯.던전.로쿠규.레벨,
        반격: 1 * data.스탯.던전.로쿠규.레벨,
        반격무시: 1 * data.스탯.던전.로쿠규.레벨,
        스턴: 1 * data.스탯.던전.로쿠규.레벨,
        스턴무시: 1 * data.스탯.던전.로쿠규.레벨,
        회피: 1 * data.스탯.던전.로쿠규.레벨,
        회피무시: 1 * data.스탯.던전.로쿠규.레벨,
        회복: 1 * data.스탯.던전.로쿠규.레벨,
        회복무시: 1 * data.스탯.던전.로쿠규.레벨,
        에어본: 1 * data.스탯.던전.로쿠규.레벨,
        일반공격계수: 100 + 1 * data.스탯.던전.로쿠규.레벨,
        일반공격피해감소: 1 * data.스탯.던전.로쿠규.레벨,
        콤보계수: 100 + 10 * data.스탯.던전.로쿠규.레벨,
        콤보피해감소: 10 * data.스탯.던전.로쿠규.레벨,
        반격계수: 100 + 1 * data.스탯.던전.로쿠규.레벨,
        반격피해감소: 0,
        스킬치명: 0,
        스킬치명피해: 100 + 1 * data.스탯.던전.로쿠규.레벨,
        스킬피해: 100 + 1 * data.스탯.던전.로쿠규.레벨,
        스킬피해감소: 0,
        보스피해: 0,
        보스피해감소: 0,
        동료피해: 100 + 1 * data.스탯.던전.로쿠규.레벨,
        동료피해감소: 0,
        치유율: 0,
        치유량: 0.2 + 0.002 * data.스탯.던전.로쿠규.레벨,
        관통: 0,
        관통무시: 0,
        막기: 0,
        막기무시: 0,
        동료찬사: 0,
        동료찬사무시: 0,
        동료저항: 0,
        동료저항무시: 0,
        피해감소: 0,
        최종HP: 15000 * data.스탯.던전.로쿠규.레벨,
        최종공격력: 900 * data.스탯.던전.로쿠규.레벨,
        최종방어력: 300 * data.스탯.던전.로쿠규.레벨,
        최종공속: 1 + 0.2 * data.스탯.던전.로쿠규.레벨,
        전투력:
          (10000 * data.스탯.던전.로쿠규.레벨) * 0.05 +
          (600 * data.스탯.던전.로쿠규.레벨) +
          (200 * data.스탯.던전.로쿠규.레벨) * 2 +
          (1 + 0.2 * data.스탯.던전.로쿠규.레벨) * 50,
      }
    };



    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(data)), // 복사본
      JSON.parse(JSON.stringify(로쿠규))  // 복사본
    );


    if (전투결과.결과 === "승리") {
      data.스탯.낙엽 = data.스탯.낙엽 + data.스탯.던전.로쿠규.레벨 * 1;
      data.스탯.던전.로쿠규.레벨 += 1;
    }

    data.스탯.던전.로쿠규.열쇠 -= 1;


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // res.json(data);
    res.json({ data, 전투결과 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Rockgolemsweep", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.던전.락골렘.레벨 < 2) {
      return res.status(400).json({ 오류: "도전 성공 시 소탕 가능합니다" });
    }

    if (data.스탯.던전.락골렘.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }


    data.스탯.스톤 = data.스탯.스톤 + data.스탯.던전.락골렘.레벨 * 10;

    data.스탯.던전.락골렘.열쇠 -= 1;


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);
    // res.json({ data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/RockgolemDungeon", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.던전.락골렘.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }


    const 락골렘 = {
      스탯: {
        치명: 1 * data.스탯.던전.락골렘.레벨,
        치명무시: 0,
        치명피해: 200 + 2 * data.스탯.던전.락골렘.레벨,
        치명저항: 100 + 1 * data.스탯.던전.락골렘.레벨,
        콤보: 1 * data.스탯.던전.락골렘.레벨,
        콤보무시: 1 * data.스탯.던전.락골렘.레벨,
        반격: 1 * data.스탯.던전.락골렘.레벨,
        반격무시: 1 * data.스탯.던전.락골렘.레벨,
        스턴: 10 * data.스탯.던전.락골렘.레벨,
        스턴무시: 10 * data.스탯.던전.락골렘.레벨,
        회피: 1 * data.스탯.던전.락골렘.레벨,
        회피무시: 10 * data.스탯.던전.락골렘.레벨,
        회복: 1 * data.스탯.던전.락골렘.레벨,
        회복무시: 1 * data.스탯.던전.락골렘.레벨,
        에어본: 1 * data.스탯.던전.락골렘.레벨,
        일반공격계수: 100 + 1 * data.스탯.던전.락골렘.레벨,
        일반공격피해감소: 1 * data.스탯.던전.락골렘.레벨,
        콤보계수: 100 + 1 * data.스탯.던전.락골렘.레벨,
        콤보피해감소: 1 * data.스탯.던전.락골렘.레벨,
        반격계수: 100 + 1 * data.스탯.던전.락골렘.레벨,
        반격피해감소: 0,
        스킬치명: 0,
        스킬치명피해: 100 + 1 * data.스탯.던전.락골렘.레벨,
        스킬피해: 100 + 1 * data.스탯.던전.락골렘.레벨,
        스킬피해감소: 0,
        보스피해: 0,
        보스피해감소: 0,
        동료피해: 100 + 1 * data.스탯.던전.락골렘.레벨,
        동료피해감소: 0,
        치유율: 0,
        치유량: 0.2 + 0.002 * data.스탯.던전.락골렘.레벨,
        관통: 0,
        관통무시: 0,
        막기: 0,
        막기무시: 0,
        동료찬사: 0,
        동료찬사무시: 0,
        동료저항: 0,
        동료저항무시: 0,
        피해감소: 0,
        최종HP: 15000 * data.스탯.던전.락골렘.레벨,
        최종공격력: 900 * data.스탯.던전.락골렘.레벨,
        최종방어력: 300 * data.스탯.던전.락골렘.레벨,
        최종공속: 1 + 0.2 * data.스탯.던전.락골렘.레벨,
        전투력:
          (10000 * data.스탯.던전.락골렘.레벨) * 0.05 +
          (600 * data.스탯.던전.락골렘.레벨) +
          (200 * data.스탯.던전.락골렘.레벨) * 2 +
          (1 + 0.2 * data.스탯.던전.락골렘.레벨) * 50,
      }
    };



    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(data)), // 복사본
      JSON.parse(JSON.stringify(락골렘))  // 복사본
    );


    if (전투결과.결과 === "승리") {
      data.스탯.스톤 = data.스탯.스톤 + data.스탯.던전.락골렘.레벨 * 10;
      data.스탯.던전.락골렘.레벨 += 1;
    }

    data.스탯.던전.락골렘.열쇠 -= 1;


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // res.json(data);
    res.json({ data, 전투결과 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});








































//전투시뮬레이션함수
function 전투시뮬레이션(나, 상대) {
  let 나순간최고데미지 = 0;
  let 상대순간최고데미지 = 0;
  let 턴수 = 0;
  let 로그 = [];

  const 나최대HP = 나.스탯.최종HP;
  const 상대최대HP = 상대.스탯.최종HP;

  const 나회복량 = 나최대HP * ((나.스탯.치유율 + 나.스탯.치유량) / 100);
  const 상대회복량 = 상대최대HP * ((상대.스탯.치유율 + 상대.스탯.치유량) / 100);

  let turn = 나.스탯.최종공속 >= 상대.스탯.최종공속 ? "나" : "상대";

  while (나.스탯.최종HP > 0 && 상대.스탯.최종HP > 0) {
    턴수++;
    // 로그.push(`턴 ${턴수} (${turn} 공격)`);

    if (turn === "나") {
      let 기본데미지 = 나.스탯.최종공격력 - 상대.스탯.최종방어력;
      let 최종데미지 = 기본데미지;
      if (최종데미지 < 1) 최종데미지 = 1;

      if (Math.random() * 100 < 나.스탯.치명) {
        if (!Math.random() * 100 < 상대.스탯.치명무시) {
          최종데미지 = 기본데미지 * (나.스탯.치명피해 / 100) / (상대.스탯.치명저항 / 100);
          // 로그.push(`나 치명타! 데미지 ${최종데미지.toFixed(0)}`);
        } else {
          최종데미지 = 기본데미지 * (나.스탯.일반공격계수 / 100) * ((100 - 상대.스탯.일반공격피해감소) / 100);
          // 로그.push(`일반공격 → 일반데미지 ${최종데미지.toFixed(0)}`);
        }
      } else {
        최종데미지 = 기본데미지 * (나.스탯.일반공격계수 / 100) * ((100 - 상대.스탯.일반공격피해감소) / 100);
        // 로그.push(`일반공격 → 일반데미지 ${최종데미지.toFixed(0)}`);
      }

      if (Math.random() * 100 < 나.스탯.콤보) {
        if (!(Math.random() * 100 < 상대.스탯.콤보무시)) {
          최종데미지 = 최종데미지
            * (나.스탯.콤보계수 / 100)
            * ((100 - 상대.스탯.콤보피해감소) / 100)
            * 2;
          // 로그.push(`나 콤보 발동! 콤보데미지 ${최종데미지.toFixed(0)}`);    
        }
      }

      let 스턴유지 = false;
      if (Math.random() * 100 < 나.스탯.스턴 || Math.random() * 100 < 나.스탯.에어본) {
        if (!(Math.random() * 100 < 상대.스탯.스턴무시)) {
          스턴유지 = true;
          // 로그.push(`상대 기절!`);
        }
      }

      if (Math.random() * 100 < 상대.스탯.회피) {
        if (Math.random() * 100 < 나.스탯.회피무시) {
          // 로그.push(`상대 회피 발동했으나 회피무시 성공`);
        } else {
          최종데미지 = 0;
          // 로그.push(`상대 회피 성공 → 데미지 0`);          
        }
      }

      if (최종데미지 > 나순간최고데미지) {
        나순간최고데미지 = 최종데미지;
        // 로그.push(`나 순간최고데미지 갱신! ${나순간최고데미지.toFixed(0)}`);
      }
      상대.스탯.최종HP -= 최종데미지;
      // 로그.push(`상대 HP ${상대.스탯.최종HP.toFixed(0)}/${상대최대HP.toFixed(0)}`);
      if (상대.스탯.최종HP <= 0) break;

      if (Math.random() * 100 < 상대.스탯.반격) {
        if (!(Math.random() * 100 < 나.스탯.반격무시)) {
          let 반격데미지 = 상대.스탯.최종공격력 - 나.스탯.최종방어력;
          반격데미지 = 반격데미지
            * (상대.스탯.일반공격계수 / 100)
            * (상대.스탯.반격계수 / 100)
            * ((100 - 나.스탯.반격피해감소) / 100);
          나.스탯.최종HP -= 반격데미지;
          // 로그.push(`상대 반격! 반격데미지 ${반격데미지.toFixed(0)}`);
          // 로그.push(`나 HP ${나.스탯.최종HP.toFixed(0)}/${나최대HP.toFixed(0)}`);
        }
      }
      if (나.스탯.최종HP <= 0) break;

      if (Math.random() * 100 < 나.스탯.회복) {
        if (!(Math.random() * 100 < 상대.스탯.회복무시)) {
          나.스탯.최종HP = Math.min(나최대HP, 나.스탯.최종HP + 나회복량);
          // 로그.push(`나 회복! HP ${나.스탯.최종HP.toFixed(0)}/${나최대HP.toFixed(0)}`);
        }
      }

      turn = 스턴유지 ? "나" : "상대";

    } else {
      let 기본데미지 = 상대.스탯.최종공격력 - 나.스탯.최종방어력;
      let 최종데미지 = 기본데미지;
      if (최종데미지 < 1) 최종데미지 = 1;

      if (Math.random() * 100 < 상대.스탯.치명) {
        if (!Math.random() * 100 < 나.스탯.치명무시) {
          최종데미지 = 기본데미지 * (상대.스탯.치명피해 / 100) / (나.스탯.치명저항 / 100);
          // 로그.push(`상대 치명타! 데미지 ${최종데미지.toFixed(0)}`);
        } else {
          최종데미지 = 기본데미지 * (상대.스탯.일반공격계수 / 100) * ((100 - 나.스탯.일반공격피해감소) / 100);
          // 로그.push(`일반공격 → 일반데미지 ${최종데미지.toFixed(0)}`);
        }
      } else {
        최종데미지 = 기본데미지 * (상대.스탯.일반공격계수 / 100) * ((100 - 나.스탯.일반공격피해감소) / 100);
        // 로그.push(`일반공격 → 일반데미지 ${최종데미지.toFixed(0)}`);
      }

      if (Math.random() * 100 < 상대.스탯.콤보) {
        if (!(Math.random() * 100 < 나.스탯.콤보무시)) {
          최종데미지 = 최종데미지
            * (상대.스탯.콤보계수 / 100)
            * ((100 - 나.스탯.콤보피해감소) / 100)
            * 2;
          // 로그.push(`상대 콤보 발동! 최종데미지 ${최종데미지.toFixed(0)}`);
        }
      }

      let 스턴유지 = false;
      if (Math.random() * 100 < 상대.스탯.스턴 || Math.random() * 100 < 상대.스탯.에어본) {
        if (!(Math.random() * 100 < 나.스탯.스턴무시)) {
          스턴유지 = true;
          // 로그.push(`나 기절!`);
        }
      }

      if (Math.random() * 100 < 나.스탯.회피) {
        if (Math.random() * 100 < 상대.스탯.회피무시) {
          // 로그.push(`나 회피 발동했으나 회피무시 성공`);
        } else {
          최종데미지 = 0;
          // 로그.push(`나 회피 성공 → 데미지 0`);
        }
      }

      if (최종데미지 > 상대순간최고데미지) {
        상대순간최고데미지 = 최종데미지;
        // 로그.push(`상대 순간최고데미지 갱신! ${상대순간최고데미지.toFixed(0)}`);
      }
      나.스탯.최종HP -= 최종데미지;
      // 로그.push(`나 HP ${나.스탯.최종HP.toFixed(0)}/${나최대HP.toFixed(0)}`);
      if (나.스탯.최종HP <= 0) break;

      if (Math.random() * 100 < 나.스탯.반격) {
        if (!(Math.random() * 100 < 상대.스탯.반격무시)) {
          let 반격데미지 = 나.스탯.최종공격력 - 상대.스탯.최종방어력;
          반격데미지 = 반격데미지
            * (나.스탯.일반공격계수 / 100)
            * (나.스탯.반격계수 / 100)
            * ((100 - 상대.스탯.반격피해감소) / 100);
          상대.스탯.최종HP -= 반격데미지;
          // 로그.push(`나 반격! 반격데미지 ${반격데미지.toFixed(0)}`);
          // 로그.push(`상대 HP ${상대.스탯.최종HP.toFixed(0)}/${상대최대HP.toFixed(0)}`);
        }
      }
      if (상대.스탯.최종HP <= 0) break;

      if (Math.random() * 100 < 상대.스탯.회복) {
        if (!(Math.random() * 100 < 나.스탯.회복무시)) {
          상대.스탯.최종HP = Math.min(상대최대HP, 상대.스탯.최종HP + 상대회복량);
          // 로그.push(`상대 회복! HP ${상대.스탯.최종HP.toFixed(0)}/${상대최대HP.toFixed(0)}`);
        }
      }

      turn = 스턴유지 ? "상대" : "나";
    }
  }

  const 결과 = 나.스탯.최종HP > 0 ? "승리" : "패배";

  return {
    결과,
    나HP: 나.스탯.최종HP,
    상대HP: 상대.스탯.최종HP,
    나순간최고데미지,
    상대순간최고데미지,
    턴수,
    // 로그
  };
}

app.post("/join-arena", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data: 전장유저, error: 전장에러 } = await supabase
      .from("users")
      .select("*")
      .not("스탯->전장->순위", "eq", "0");

    if (전장에러) {
      console.error(전장에러);
      return res.status(500).json({ 오류: "전장조회 실패" });
    }

    let 다음전장번호 = 1;
    if (전장유저 && 전장유저.length > 0) {
      const 전장값리스트 = 전장유저.map(u => Number(u.스탯.전장?.순위 || 0));
      const 현재최대 = Math.max(...전장값리스트);
      다음전장번호 = 현재최대 + 1;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    data.스탯.전장.순위 = 다음전장번호;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/arena-list", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .not("스탯->전장->순위", "eq", 0)              // 순위 0 아닌 유저만
      .order("스탯->전장->순위", { ascending: true }); // 순위 오름차순 정렬

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "전장 목록 조회 실패" });
    }

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/arena-challenge", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.전장?.순위 <= 1) {
      return res.status(400).json({ 오류: "도전할 상대가 없습니다" });
    }

    let 목표순위 = data.스탯.전장.순위 - 1;
    let 상대 = null;

    // 상대 나올 때까지 위 순위 계속 검색
    while (목표순위 >= 1 && !상대) {
      const { data: 후보 } = await supabase
        .from("users")
        .select("*")
        .eq("스탯->전장->순위", 목표순위)
        .single();

      if (후보) {
        상대 = 후보;
        break;
      }
      목표순위 -= 1;
    }

    if (!상대) {
      return res.status(404).json({ 오류: "상대 유저를 찾을 수 없습니다" });
    }

    if (data.스탯.전장.티켓 < 1) {
      return res.status(404).json({ 오류: "티켓이 부족합니다" });

    }

    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(data)), // 복사본
      JSON.parse(JSON.stringify(상대))  // 복사본
    );

    data.스탯.전장.티켓 -= 1;

    if (전투결과.결과 === "승리") {
      data.스탯.전장.순위 -= 1;
      상대.스탯.전장.순위 += 1;

      const 내순위 = data.스탯.전장.순위;
      const 상대순위 = 상대.스탯.전장.순위;

      const { error: 내에러 } = await supabase
        .from("users")
        .update({
          스탯: {
            ...data.스탯,
            전장: {
              ...data.스탯.전장,
              순위: 내순위,
              티켓: data.스탯.전장.티켓
            }
          }
        })
        .eq("id", data.id);

      const { error: 상대에러 } = await supabase
        .from("users")
        .update({
          스탯: {
            ...상대.스탯,
            전장: {
              ...상대.스탯.전장,
              순위: 상대순위
            }
          }
        })
        .eq("id", 상대.id);
    } else {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          스탯: {
            ...data.스탯,
            전장: {
              ...data.스탯.전장,
              티켓: data.스탯.전장.티켓
            }
          }
        })
        .eq("id", id);

      if (updateError) {
        console.error(updateError);
        return res.status(500).json({ 오류: "DB저장 실패" });
      }

    }

    res.json({ data, 전투결과, 상대닉네임: 상대.스탯.계정.유저닉네임 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/pump", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (data.스탯.낙엽 < 2 * (data.스탯.탈것.레벨 + 1) - 1) {
      return res.status(400).json({ 오류: "낙엽이 부족합니다" });
    }


    data.스탯.낙엽 = data.스탯.낙엽 - (2 * (data.스탯.탈것.레벨 + 1) - 1);

    data.스탯.탈것.HP보너스 += (data.스탯.탈것.레벨 + 1);
    data.스탯.탈것.공격력보너스 += (data.스탯.탈것.레벨 + 1);
    data.스탯.탈것.방어력보너스 += (data.스탯.탈것.레벨 + 1);

    data.스탯.탈것.레벨++;

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});




































const 드랍확률표 = {
  1: { D: 80.000, C: 15.000, B: 5.000, A: 0.000, S: 0.000, SS: 0.000, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  2: { D: 73.500, C: 17.000, B: 8.000, A: 1.500, S: 0.000, SS: 0.000, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  3: { D: 68.000, C: 20.000, B: 10.000, A: 2.000, S: 0.000, SS: 0.000, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  4: { D: 60.000, C: 25.000, B: 12.300, A: 2.500, S: 0.200, SS: 0.000, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  5: { D: 50.000, C: 30.000, B: 16.700, A: 3.000, S: 0.300, SS: 0.000, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  6: { D: 40.000, C: 35.000, B: 20.600, A: 4.000, S: 0.400, SS: 0.000, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  7: { D: 30.000, C: 40.000, B: 24.450, A: 5.000, S: 0.500, SS: 0.050, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  8: { D: 20.000, C: 45.000, B: 28.320, A: 6.000, S: 0.600, SS: 0.080, L: 0.000, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  9: { D: 10.000, C: 40.000, B: 41.090, A: 8.000, S: 0.800, SS: 0.100, L: 0.010, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  10: { D: 0.000, C: 35.000, B: 53.930, A: 10.000, S: 0.900, SS: 0.150, L: 0.020, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  11: { D: 0.000, C: 30.000, B: 56.770, A: 12.000, S: 1.000, SS: 0.200, L: 0.030, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  12: { D: 0.000, C: 25.000, B: 59.210, A: 14.000, S: 1.500, SS: 0.250, L: 0.040, LL: 0.000, U: 0.000, UU: 0.000, X: 0.000 },
  13: { D: 0.000, C: 20.000, B: 61.630, A: 16.000, S: 2.000, SS: 0.300, L: 0.060, LL: 0.010, U: 0.000, UU: 0.000, X: 0.000 },
  14: { D: 0.000, C: 10.000, B: 69.050, A: 18.000, S: 2.500, SS: 0.350, L: 0.080, LL: 0.020, U: 0.000, UU: 0.000, X: 0.000 },
  15: { D: 0.000, C: 0.000, B: 76.470, A: 20.000, S: 3.000, SS: 0.400, L: 0.100, LL: 0.030, U: 0.000, UU: 0.000, X: 0.000 },
  16: { D: 0.000, C: 0.000, B: 70.310, A: 25.000, S: 4.000, SS: 0.500, L: 0.150, LL: 0.040, U: 0.000, UU: 0.000, X: 0.000 },
  17: { D: 0.000, C: 0.000, B: 63.750, A: 30.000, S: 5.000, SS: 1.000, L: 0.200, LL: 0.050, U: 0.000, UU: 0.000, X: 0.000 },
  18: { D: 0.000, C: 0.000, B: 55.690, A: 35.000, S: 7.500, SS: 1.500, L: 0.250, LL: 0.060, U: 0.000, UU: 0.000, X: 0.000 },
  19: { D: 0.000, C: 0.000, B: 47.630, A: 40.000, S: 10.000, SS: 2.000, L: 0.300, LL: 0.070, U: 0.000, UU: 0.000, X: 0.000 },
  20: { D: 0.000, C: 0.000, B: 39.505, A: 45.000, S: 12.500, SS: 2.500, L: 0.400, LL: 0.080, U: 0.015, UU: 0.000, X: 0.000 },
  21: { D: 0.000, C: 0.000, B: 31.390, A: 50.000, S: 15.000, SS: 3.000, L: 0.500, LL: 0.090, U: 0.020, UU: 0.000, X: 0.000 },
  22: { D: 0.000, C: 0.000, B: 23.275, A: 55.000, S: 17.500, SS: 3.500, L: 0.600, LL: 0.100, U: 0.025, UU: 0.000, X: 0.000 },
  23: { D: 0.000, C: 0.000, B: 15.150, A: 60.000, S: 20.000, SS: 4.000, L: 0.700, LL: 0.120, U: 0.030, UU: 0.000, X: 0.000 },
  24: { D: 0.000, C: 0.000, B: 10.000, A: 62.010, S: 22.500, SS: 4.500, L: 0.800, LL: 0.140, U: 0.040, UU: 0.010, X: 0.000 },
  25: { D: 0.000, C: 0.000, B: 0.000, A: 68.875, S: 25.000, SS: 5.000, L: 0.900, LL: 0.160, U: 0.050, UU: 0.015, X: 0.000 },
  26: { D: 0.000, C: 0.000, B: 0.000, A: 65.240, S: 27.500, SS: 6.000, L: 1.000, LL: 0.180, U: 0.060, UU: 0.020, X: 0.001 },
  27: { D: 0.000, C: 0.000, B: 0.000, A: 61.505, S: 30.000, SS: 7.000, L: 1.200, LL: 0.200, U: 0.070, UU: 0.025, X: 0.002 },
  28: { D: 0.000, C: 0.000, B: 0.000, A: 57.740, S: 32.500, SS: 8.000, L: 1.400, LL: 0.250, U: 0.080, UU: 0.030, X: 0.003 },
  29: { D: 0.000, C: 0.000, B: 0.000, A: 53.975, S: 35.000, SS: 9.000, L: 1.600, LL: 0.300, U: 0.090, UU: 0.035, X: 0.004 },
  30: { D: 0.000, C: 0.000, B: 0.000, A: 50.160, S: 37.500, SS: 10.000, L: 1.800, LL: 0.400, U: 0.100, UU: 0.040, X: 0.005 },
};

const 등급순서 = [
  "D", "C", "B", "A", "S", "SS", "L", "LL", "U", "UU", "X",
];

const 드랍장비이름 = [
  "무기", "모자", "안경", "견갑", "옷", "완갑", "장갑", "벨트", "무릎아머", "신발",
];


const 특수옵션 = [
  "치명", "회피", "회복", "콤보", "반격", "스턴", "스킬치명", "동료콤보", "동료치명",
];

const 특수옵션범위 = {
  D: [0.3, 1.3],
  C: [0.8, 1.8],
  B: [1.3, 2.3],
  A: [1.8, 2.8],
  S: [2.3, 3.3],
  SS: [2.8, 3.8],
  L: [3.3, 4.3],
  LL: [3.8, 4.8],
  U: [4.3, 5.3],
  UU: [4.8, 5.8],
  X: [5.3, 6.3],
};

const 장비목록 = [
  "계정", //깡스탯
  "전직", //보너스
  "무기", "모자", "안경", "견갑", "옷", "완갑", "장갑", "벨트", "무릎아머", "신발", //깡스탯
  "탈것", "조각상", "유물" //보너스
];

const 스탯목록 = [
  "HP", "공격력", "방어력", "공속",
  "치명", "치명무시", "치명피해", "치명저항",
  "콤보", "콤보무시", "반격", "반격무시", "스턴", "스턴무시", "회피", "회피무시", "회복", "회복무시", "에어본",
  "콤보계수", "콤보피해감소", "반격계수", "반격피해감소", "스킬치명", "스킬치명피해", "스킬피해", "스킬피해감소",
  "일반공격계수", "일반공격피해감소", "보스피해", "보스피해감소", "동료피해", "동료피해감소", "치유율", "치유량",
  "관통", "관통무시", "막기", "막기무시", "동료찬사", "동료찬사무시", "동료저항", "동료저항무시", "피해감소",
  "HP보너스", "공격력보너스", "방어력보너스", "공속보너스"
];

function 최종스탯계산(스탯) {
  const 결과 = {};

  if (스탯.계정.현재경험치 >= 스탯.계정.다음경험치) {
    스탯.계정.현재경험치 -= 스탯.계정.다음경험치;
    스탯.계정.레벨++;
    스탯.계정.다음경험치 = 필요경험치(스탯.계정.레벨);

    // 레벨업 시 1/10 증가
    스탯.계정.HP += 1000 / 2;       // +100
    스탯.계정.공격력 += 60 / 2;     // +6
    스탯.계정.방어력 += 20 / 2;     // +2

    // 레벨업 시 1/100 증가
    스탯.계정.공속 += 1 / 100;           // +0.01
    스탯.계정.치명피해 += 200 / 100;     // +2
    스탯.계정.치명저항 += 100 / 100;     // +1
    스탯.계정.일반공격계수 += 100 / 100; // +1
    스탯.계정.콤보계수 += 100 / 100;     // +1
    스탯.계정.반격계수 += 100 / 100;     // +1
    스탯.계정.스킬치명피해 += 100 / 100; // +1
    스탯.계정.스킬피해 += 100 / 100;     // +1
    스탯.계정.동료피해 += 100 / 100;     // +1
    스탯.계정.치유량 += 0.2 / 100;       // +0.002
  }
  결과.계정 = 스탯.계정;

  if (스탯.램프.현재골드 >= 스탯.램프.다음골드) {
    스탯.램프.현재골드 -= 스탯.램프.다음골드;
    스탯.램프.레벨++;
    스탯.램프.다음골드 = 필요골드(스탯.램프.레벨);
  }
  결과.램프 = 스탯.램프;

  for (const 옵션명 of 스탯목록) {
    let 합계 = 0;
    for (const 장비 of 장비목록) {
      if (스탯[장비]?.[옵션명]) {
        합계 += Number(스탯[장비][옵션명]);
      }
    }
    결과[옵션명] = Math.round(합계 * 100) / 100;
  }

  결과.최종HP = 결과.HP + (결과.HP * 결과.HP보너스 / 100);
  결과.최종공격력 = 결과.공격력 + (결과.공격력 * 결과.공격력보너스 / 100);
  결과.최종방어력 = 결과.방어력 + (결과.방어력 * 결과.방어력보너스 / 100);
  결과.최종공속 = 결과.공속 + (결과.공속 * 결과.공속보너스 / 100);
  결과.전투력 = 결과.최종HP * 0.05 + 결과.최종공격력 + 결과.최종방어력 * 2 + 결과.최종공속 * 50;

  return 결과;
}

function 필요경험치(lv) {
  if (lv < 2) return 0; // 1레벨은 경험치 없음

  let base = 350;
  let 증가량 = 100;
  let count = 1; // 2레벨부터 카운트 시작

  for (let i = 2; i <= lv; i++) {
    if (i === lv) return base;

    base += 증가량;
    count++;

    if (count > 5) {
      증가량 += 200; // 5레벨 구간 끝날 때 증가량 상승
      count = 1;
    }
  }
}

function 필요골드(레벨) {
  return Math.floor(
    1751.746 *
    Math.pow(1.93468, 레벨) *
    Math.pow(0.99113, 레벨 * 레벨)
  );
}

app.listen(PORT, () => {
});

app.use(express.static(__dirname));

