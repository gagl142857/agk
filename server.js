
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

  //   if (error) throw error;

  //   if (전체유저 && 전체유저.length > 0) {
  //     let 시작포인트 = 10000000;

  //     for (let i = 0; i < 전체유저.length; i++) {
  //       전체유저[i].스탯.전장 = {
  //         포인트: 시작포인트 - (i * 1000),
  //         티켓: 4
  //       };

  //       await supabase
  //         .from("users")
  //         .update({ 스탯: 전체유저[i].스탯 })
  //         .eq("id", 전체유저[i].id);
  //     }
  //   }
  // } catch (err) {
  //   console.error("오류:", err);
  // }

  // try {
  //   const { data: 전체유저, error } = await supabase
  //     .from("users")
  //     .select("id, 스탯");

  //   if (전체유저 && 전체유저.length > 0) {
  //     for (let i = 0; i < 전체유저.length; i++) {
  //       if (전체유저[i].스탯?.동료1) {
  //         delete 전체유저[i].스탯.동료1;

  //         await supabase
  //           .from("users")
  //           .update({ 스탯: 전체유저[i].스탯 })
  //           .eq("id", 전체유저[i].id);
  //       }
  //     }
  //   }
  // } catch (err) {
  //   console.error("오류:", err);
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




  // const { data, error } = await supabase
  //   .from("users")
  //   .select("스탯")
  //   .eq("스탯->주인장인가", 1)   // 주인장 계정만 찾기 (조건은 상황에 맞게)
  //   .single();

  // if (error) {
  //   console.error("서버점검 조회 실패:", error);
  //   return res.status(500).send("<html>서버점검 조회 실패</html>");
  // }

  // if (data.스탯?.서버점검 === 1) {
  //   return res.send(`
  //   <html>
  //     <head>
  //       <meta charset="UTF-8">
  //       <title>서버 점검중</title>
  //       <style>
  //         body {
  //           display: flex;
  //           justify-content: center;
  //           align-items: center;
  //           height: 100vh;
  //           margin: 0;
  //           background: #white;
  //           color: #747474;
  //           font-size: 24px;
  //           font-family: sans-serif;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       서버점검중>.<
  //     </body>
  //   </html>
  // `);
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

    const { count, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true });

    let 신규포인트 = 0;
    if (!countError && typeof count === "number") {
      신규포인트 = 10000000 - (1000 * count);
    }

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
        치명피해: 150,
        치명저항: 0,
        일반공격계수: 100,
        콤보계수: 100,
        반격계수: 100,
        스킬치명피해: 150,
        스킬피해: 100,
        동료피해: 0,
        치유량: 0.2,
      },
      램프: {
        레벨: 1,
        현재골드: 0,
        다음골드: 6000,
        수량: 1000,
      },
      //재화
      다이아: 0,
      낙엽: 0,
      스톤: 0,
      가루: 0,

      서버: 서버,
      서버점검: 0,
      최초IP: clientIP,
      접속IP: clientIP,
      기기ID: req.body.기기ID || null,
      버전: 4,
      우편함: [
        {
          이름: "램프",
          수량: 1000,
          시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
          메모: "신규유저 보상",
        },
        {
          이름: "다이아",
          수량: 1000,
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
      탈것: {
        회피: 0,
        HP보너스: 0,
        공격력보너스: 0,
        방어력보너스: 0,
        레벨: 0,
      },
      전장: {
        포인트: 신규포인트,
        티켓: 4,
      }
    };
    //신규유저


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

    const now = new Date();
    const 현재접속 = Math.floor(now.getTime() / 3600000);
    const 이전접속 = data.스탯?.접속시각 || 현재접속;
    const 시간차 = Math.min(현재접속 - 이전접속, 24);

    //하루한번
    const 오늘요일 = new Date().toLocaleDateString("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" });
    if (data.스탯.접속요일 !== 오늘요일) {
      data.스탯.접속요일 = 오늘요일;
      if (data.스탯.던전.지니.열쇠 < 4) data.스탯.던전.지니.열쇠 = 4;
      if (data.스탯.던전.로쿠규.열쇠 < 4) data.스탯.던전.로쿠규.열쇠 = 4;
      if (data.스탯.던전.락골렘.열쇠 < 4) data.스탯.던전.락골렘.열쇠 = 4;
      if (data.스탯.던전.디지에그.열쇠 < 4) data.스탯.던전.디지에그.열쇠 = 4;
      if (data.스탯.전장.티켓 < 4) data.스탯.전장.티켓 = 4;

      // if (data.스탯.전장.포인트 != 0) {
      //   const 전장보상 = {
      //     이름: "다이아",
      //     수량: data.스탯.전장.포인트,
      //     시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      //     메모: `전장 포인트별 일일보상`,
      //   };

      //   if (!data.스탯.우편함) data.스탯.우편함 = [];
      //   data.스탯.우편함.unshift(전장보상);

      // }

    }

    const clientIP = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .toString().split(",")[0].trim();

    // "2025. 9. 10. 오후 4:37:00"
    const parts = data.스탯.생성시각.split(". ");
    // ["2025", "9", "10", "오후 4:37:00"]

    const 생성연도 = parseInt(parts[0], 10);
    const 생성월 = parseInt(parts[1], 10) - 1; // JS 월은 0부터 시작
    const 생성일자 = parseInt(parts[2], 10);

    const 생성일 = new Date(생성연도, 생성월, 생성일자);
    const 일수보정 = Math.floor((now - 생성일) / (1000 * 60 * 60 * 24)) + 1;

    if (시간차 > 0) {
      const 램프보상 = {
        이름: "램프",
        수량: 시간차 * (60 + (일수보정 - 1)),
        시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
        메모: `${시간차}시간 방치&오프보상`,
      };

      const 다이아보상 = {
        이름: "다이아",
        수량: 시간차 * (60 + (일수보정 - 1)),
        시간: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
        메모: `${시간차}시간 방치&오프보상`,
      };

      if (!data.스탯.우편함) data.스탯.우편함 = [];
      data.스탯.우편함.unshift(램프보상);
      data.스탯.우편함.unshift(다이아보상);

      data.스탯.접속시각 = 현재접속;
    }

    if (!data.스탯.던전.락골렘) {
      data.스탯.던전.락골렘 = { 레벨: 1, 열쇠: 4 };
    }
    if (!data.스탯.스톤) {
      data.스탯.스톤 = 0;
    }

    if (!data.스탯.던전.디지에그) {
      data.스탯.던전.디지에그 = { 레벨: 1, 열쇠: 4 };
    }
    if (!data.스탯.디지에그) {
      data.스탯.디지에그 = 0;
    }

    if (data.스탯.던전.지니.레벨 > 20) {
      data.스탯.던전.지니.레벨 = 20;
    }

    if (data.스탯.던전.로쿠규.레벨 > 20) {
      data.스탯.던전.로쿠규.레벨 = 20;
    }

    if (data.스탯.던전.락골렘.레벨 > 20) {
      data.스탯.던전.락골렘.레벨 = 20;
    }

    if (data.스탯.던전.디지에그.레벨 > 20) {
      data.스탯.던전.디지에그.레벨 = 20;
    }

    if (!data.스탯.전장) {
      data.스탯.전장 = { 포인트: 0, 티켓: 4 };
    }
    data.스탯.무기외형 = { 이름: data.스탯.무기외형?.이름 || "" };
    data.스탯.옷외형 = { 이름: data.스탯.옷외형?.이름 || "" };
    data.스탯.모자외형 = { 이름: data.스탯.모자외형?.이름 || "" };

    if (!data.스탯.탈것.회피) {
      data.스탯.탈것.회피 = 0;
    }

    if (data.스탯.무기외형.레벨) {
      data.스탯.가루 = data.스탯.가루 + data.스탯.무기외형.레벨 * 10000;
      delete data.스탯.무기외형.레벨;
    }

    if (data.스탯.옷외형.레벨) {
      data.스탯.가루 = data.스탯.가루 + data.스탯.옷외형.레벨 * 10000;
      delete data.스탯.옷외형.레벨;
    }

    if (data.스탯.모자외형.레벨) {
      data.스탯.가루 = data.스탯.가루 + data.스탯.모자외형.레벨 * 10000;
      delete data.스탯.모자외형.레벨;
    }

    if (!data.스탯.외형강화) {
      data.스탯.외형강화 =
      {
        레벨: 0,
        회피무시: 0,
        HP보너스: 0,
        공격력보너스: 0,
        방어력보너스: 0,
      };
    }

    if (!data.스탯.스킬) {
      data.스탯.스킬 =
      {
        최고등급: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        HP보너스: 0,
        공격력보너스: 0,
        방어력보너스: 0,
        스킬치명: 0,
        스킬치명피해: 0,
        스킬피해: 0,
        스킬피해감소: 0,
      };
    }

    if (!data.스탯.램프원샷) {
      data.스탯.램프원샷 = 0;
    }

    if (!data.스탯.동료1 || !data.스탯.동료1.시기) {
      data.스탯.동료1 = {
        시기: `유년기Ⅰ`,
        이름: `뽀요몬`,
        레벨: 0,
        HP보너스: 0,
        공격력보너스: 0,
        방어력보너스: 0,
        동료치명: 0,
        동료치명피해: 0,
        동료피해: 0,
        동료피해감소: 0,
        치명피해: 0,
      };
    }
    if (!data.스탯.동료2 || !data.스탯.동료2.시기) {
      data.스탯.동료2 = {
        시기: `유년기Ⅰ`,
        이름: `유라몬`,
        레벨: 0,
        HP보너스: 0,
        공격력보너스: 0,
        방어력보너스: 0,
        동료치명: 0,
        동료치명피해: 0,
        동료피해: 0,
        동료피해감소: 0,
        콤보계수: 0,
      };
    }
    if (!data.스탯.동료3 || !data.스탯.동료3.시기) {
      data.스탯.동료3 = {
        시기: `유년기Ⅰ`,
        이름: `푸니몬`,
        레벨: 0,
        HP보너스: 0,
        공격력보너스: 0,
        방어력보너스: 0,
        동료치명: 0,
        동료치명피해: 0,
        동료피해: 0,
        동료피해감소: 0,
        반격계수: 0,
      };
    }


    if (!data.스탯.마지막접속시각) {
      data.스탯.마지막접속시각 = now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    }
    //기존유저

    if (!data.스탯.길드) {
      data.스탯.길드 = {
        레벨: 0,
        경험치: 0,
        이름: "",
        상태: 0, // 0: 무소속, 1: 가입신청, 2: 소속, 3: 탈퇴/강퇴
        길드마스터: "",
        길드원: {
          // "러브": 2,  // 길드 소속
          // "채이": 3   // 탈퇴 or 강퇴
        },
        최고데미지: 0,
        누적데미지: 0,
        기부: 0,
      };
    }



    for (let i = 1; i <= 6; i++) {
      if (!data.스탯[`조각상${i}`]) {
        data.스탯[`조각상${i}`] = {};
      }
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

app.post("/lamponeshot", async (req, res) => {
  try {
    const { id, 선택최소등급, 선택옵션목록 } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(500).json({ 오류: "조회 실패" });

    if (유저데이터.스탯?.드랍 && Object.keys(유저데이터.스탯.드랍).length > 0) {
      return res.status(400).json({ 오류: "드랍장비 있음" });
    }

    if (!유저데이터.스탯?.램프 || 유저데이터.스탯.램프.수량 < 1) {
      return res.status(400).json({ 오류: "램프 부족" });
    }

    // 반복: 램프 다 쓸 때까지
    while (유저데이터.스탯.램프.수량 > 0) {
      const 현재전투력 = 최종스탯계산(유저데이터.스탯).전투력;
      const 계정레벨 = 유저데이터.스탯.계정.레벨 || 1;
      const 램프레벨 = 유저데이터.스탯.램프.레벨 || 1;

      // 드랍 생성
      const 후보 = Array.from({ length: 11 }, (_, i) => 계정레벨 - 5 + i).filter(lv => lv >= 1);
      const 장비레벨 = 후보[Math.floor(Math.random() * 후보.length)];
      const 확률표 = 드랍확률표[Math.min(램프레벨, 30)];
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

      let 드랍스킬등급 = null;
      const 뽑기값 = Math.random() * 100;
      let 스킬누적 = 0;

      for (const [등급, 확률] of 스킬드랍확률표) {
        스킬누적 += 확률;
        if (뽑기값 <= 스킬누적) {
          if (유저데이터.스탯.스킬.최고등급 < 등급) {
            유저데이터.스탯.스킬.최고등급 = 등급;
          }
          유저데이터.스탯.스킬[등급]++;
          드랍스킬등급 = 등급;

          break;
        }
      }

      유저데이터.스탯.램프.수량 = Math.max(0, 유저데이터.스탯.램프.수량 - 1);

      const 최소등급조건 = 등급순서.indexOf(드랍.등급) >= 등급순서.indexOf(선택최소등급);
      if (!최소등급조건) {
        // 무조건 판매
        const idx3 = 등급순서.indexOf(드랍.등급);
        유저데이터.스탯.계정.현재경험치 = Math.floor((유저데이터.스탯.계정.현재경험치 || 0) + (100 + (20 * idx3)) * (0.8 + Math.random() * 0.3));
        유저데이터.스탯.램프.현재골드 = Math.floor((유저데이터.스탯.램프.현재골드 || 0) + (50 + (10 * idx3)) * (0.8 + Math.random() * 0.3));
        유저데이터.스탯.가루 = (유저데이터.스탯.가루 || 0) + 10;
        유저데이터.스탯.드랍 = null;
        continue;
      }

      let 옵션조건 = true;
      if (선택옵션목록.length > 0) {
        const 드랍옵션목록 = Object.keys(드랍).filter(k => k !== "이름" && k !== "레벨" && k !== "등급" && k !== "HP" && k !== "공격력" && k !== "방어력" && k !== "공속");
        if (선택옵션목록.length === 2) {
          // 두 개 다 만족해야 함
          옵션조건 = 선택옵션목록.every(opt => 드랍옵션목록.includes(opt));
        } else {
          // 하나라도 겹치면 OK
          옵션조건 = 선택옵션목록.some(opt => 드랍옵션목록.includes(opt));
        }
      }

      if (!옵션조건) {
        // 무조건 판매
        const idx3 = 등급순서.indexOf(드랍.등급);
        유저데이터.스탯.계정.현재경험치 = Math.floor((유저데이터.스탯.계정.현재경험치 || 0) + (100 + (20 * idx3)) * (0.8 + Math.random() * 0.3));
        유저데이터.스탯.램프.현재골드 = Math.floor((유저데이터.스탯.램프.현재골드 || 0) + (50 + (10 * idx3)) * (0.8 + Math.random() * 0.3));
        유저데이터.스탯.가루 = (유저데이터.스탯.가루 || 0) + 10;
        유저데이터.스탯.드랍 = null;
        continue;
      }

      // 가짜 장착 시뮬레이션
      let 비교스탯 = JSON.parse(JSON.stringify(유저데이터.스탯));
      비교스탯[드랍.이름] = 드랍;
      비교스탯 = { ...비교스탯, ...최종스탯계산(비교스탯) };
      const 전투력차이 = 비교스탯.전투력 - 현재전투력;

      if (전투력차이 > 0) {
        // 교체 + 기존 장비 판매
        const 기존 = 유저데이터.스탯[드랍.이름];
        if (기존) {
          const idx2 = 등급순서.indexOf(기존.등급);
          유저데이터.스탯.계정.현재경험치 = Math.floor((유저데이터.스탯.계정.현재경험치 || 0) + (100 + (20 * idx2)) * (0.8 + Math.random() * 0.3));
          유저데이터.스탯.램프.현재골드 = Math.floor((유저데이터.스탯.램프.현재골드 || 0) + (50 + (10 * idx2)) * (0.8 + Math.random() * 0.3));
          유저데이터.스탯.가루 = (유저데이터.스탯.가루 || 0) + 10;
        }
        유저데이터.스탯[드랍.이름] = 드랍;
        유저데이터.스탯.드랍 = null;
      } else {
        // 드랍템만 판매
        const idx3 = 등급순서.indexOf(드랍.등급);
        유저데이터.스탯.계정.현재경험치 = Math.floor((유저데이터.스탯.계정.현재경험치 || 0) + (100 + (20 * idx3)) * (0.8 + Math.random() * 0.3));
        유저데이터.스탯.램프.현재골드 = Math.floor((유저데이터.스탯.램프.현재골드 || 0) + (50 + (10 * idx3)) * (0.8 + Math.random() * 0.3));
        유저데이터.스탯.가루 = (유저데이터.스탯.가루 || 0) + 10;
        유저데이터.스탯.드랍 = null;
      }

      // 스탯 갱신
      유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };
    }

    if (유저데이터.스탯.계정.유저닉네임 === "염소") {
      유저데이터.스탯.램프.수량 += 100;
    }

    // 마지막에 DB 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "저장 실패" });
    }

    res.json(유저데이터);

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
    const 확률표 = 드랍확률표[Math.min(램프레벨, 30)];
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

    let 드랍스킬등급 = null;
    const 뽑기값 = Math.random() * 100;
    let 스킬누적 = 0;

    for (const [등급, 확률] of 스킬드랍확률표) {
      스킬누적 += 확률;
      if (뽑기값 <= 스킬누적) {
        if (data.스탯.스킬.최고등급 < 등급) {
          data.스탯.스킬.최고등급 = 등급;
        }
        data.스탯.스킬[등급]++;
        드랍스킬등급 = 등급;

        await supabase
          .from("로그기록")
          .insert({
            스탯: data.스탯,
            유저아이디: data.스탯.계정.유저아이디,
            유저닉네임: data.스탯.계정.유저닉네임,
            내용: `${등급}등급 스킬 드랍`,
          });

        break;
      }
    }
    const 스탯 = data.스탯;

    let 비교스탯 = JSON.parse(JSON.stringify(data.스탯));
    const 장착장비 = data.스탯[data.스탯.드랍.이름];
    const 드랍장비 = data.스탯.드랍;

    비교스탯[드랍장비.이름] = 드랍장비;

    비교스탯 = { ...비교스탯, ...최종스탯계산(비교스탯) };

    const 전투력차이 = Math.trunc(비교스탯.전투력 - 현재전투력);

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "스탯 저장 실패" });
    }

    res.json({ ...data, 전투력차이, 드랍스킬등급 });

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
    data.스탯.가루 = (data.스탯.가루 || 0) + 10;

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

      } else if (mail.이름 === "가루") {
        data.스탯.가루 += mail.수량;

      } else if (mail.이름 === "디지에그") {
        data.스탯.디지에그 += mail.수량;

      } else if (mail.이름 === "티켓") {
        data.스탯.전장.티켓 += mail.수량;

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

    } else if (data.스탯.우편함[index].이름 === "가루") {
      data.스탯.가루 += data.스탯.우편함[index].수량;
      data.스탯.우편함.splice(index, 1);

    } else if (data.스탯.우편함[index].이름 === "디지에그") {
      data.스탯.디지에그 += data.스탯.우편함[index].수량;
      data.스탯.우편함.splice(index, 1);

    } else if (data.스탯.우편함[index].이름 === "티켓") {
      data.스탯.전장.티켓 += data.스탯.우편함[index].수량;
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

    if (!/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z]+$/.test(닉네임)) {
      return res.status(400).json({ 오류: "닉네임은 한글과 영어만 가능합니다" });
    }

    if (닉네임.length > 6) {
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
    data.스탯.탈것.회피 = 4 + Math.floor(((data.스탯.탈것.레벨 || 1) - 1) / 10) * 2;

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

app.post("/GenieDungeon", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (유저데이터.스탯.던전.지니.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }

    const 지니 = 던전스탯생성(유저데이터.스탯.던전.지니.레벨);
    지니.스탯.치명 = 10 * 유저데이터.스탯.던전.지니.레벨;
    지니.스탯.치명피해 = 150 + 25 * 유저데이터.스탯.던전.지니.레벨;
    지니.스탯.치명저항 = 0 + 10 * 유저데이터.스탯.던전.지니.레벨;

    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(유저데이터)), // 복사본
      JSON.parse(JSON.stringify(지니))  // 복사본
    );

    if (전투결과.결과 === "승리") {
      유저데이터.스탯.램프.수량 = 유저데이터.스탯.램프.수량 + 유저데이터.스탯.던전.지니.레벨 * 10;
      if (유저데이터.스탯.던전.지니.레벨 < 20) {
        유저데이터.스탯.던전.지니.레벨 += 1;
      }
      // 유저데이터.스탯.던전.지니.레벨 += 1;

    } else {
      유저데이터.스탯.램프.수량 = 유저데이터.스탯.램프.수량 + (유저데이터.스탯.던전.지니.레벨 - 1) * 10;
    }

    유저데이터.스탯.던전.지니.열쇠 -= 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // res.json(유저데이터);
    res.json({ 유저데이터, 전투결과 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/RokugyuDungeon", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (유저데이터.스탯.던전.로쿠규.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }

    const 로쿠규 = 던전스탯생성(유저데이터.스탯.던전.로쿠규.레벨);
    로쿠규.스탯.콤보 = 10 * 유저데이터.스탯.던전.로쿠규.레벨;
    로쿠규.스탯.콤보계수 = 100 + 10 * 유저데이터.스탯.던전.로쿠규.레벨;
    로쿠규.스탯.콤보피해감소 = 0 + 10 * 유저데이터.스탯.던전.로쿠규.레벨;

    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(유저데이터)), // 복사본
      JSON.parse(JSON.stringify(로쿠규))  // 복사본
    );

    if (전투결과.결과 === "승리") {
      유저데이터.스탯.낙엽 = 유저데이터.스탯.낙엽 + 유저데이터.스탯.던전.로쿠규.레벨 * 1;
      if (유저데이터.스탯.던전.로쿠규.레벨 < 20) {
        유저데이터.스탯.던전.로쿠규.레벨 += 1;
      }
      // 유저데이터.스탯.던전.로쿠규.레벨 += 1;
    } else {
      유저데이터.스탯.낙엽 = 유저데이터.스탯.낙엽 + (유저데이터.스탯.던전.로쿠규.레벨 - 1) * 1;
    }

    유저데이터.스탯.던전.로쿠규.열쇠 -= 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // res.json(유저데이터);
    res.json({ 유저데이터, 전투결과 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/RockgolemDungeon", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (유저데이터.스탯.던전.락골렘.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }

    const 락골렘 = 던전스탯생성(유저데이터.스탯.던전.락골렘.레벨);
    락골렘.스탯.스턴 = Math.min(10 * 유저데이터.스탯.던전.락골렘.레벨, 70);
    락골렘.스탯.스턴무시 = 0 + 10 * 유저데이터.스탯.던전.락골렘.레벨;
    락골렘.스탯.회피무시 = 0 + 10 * 유저데이터.스탯.던전.락골렘.레벨;

    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(유저데이터)), // 복사본
      JSON.parse(JSON.stringify(락골렘))  // 복사본
    );

    if (전투결과.결과 === "승리") {
      유저데이터.스탯.스톤 = 유저데이터.스탯.스톤 + 유저데이터.스탯.던전.락골렘.레벨 * 10;
      if (유저데이터.스탯.던전.락골렘.레벨 < 20) {
        유저데이터.스탯.던전.락골렘.레벨 += 1;
      }
      // 유저데이터.스탯.던전.락골렘.레벨 += 1;
    } else {
      유저데이터.스탯.스톤 = 유저데이터.스탯.스톤 + (유저데이터.스탯.던전.락골렘.레벨 - 1) * 10;
    }

    유저데이터.스탯.던전.락골렘.열쇠 -= 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // res.json(유저데이터);
    res.json({ 유저데이터, 전투결과 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/digiegg", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ 오류: "DB조회 실패" });
    }

    if (유저데이터.스탯.던전.디지에그.열쇠 < 1) {
      return res.status(400).json({ 오류: "열쇠가 부족합니다" });
    }

    const 디지에그 = 던전스탯생성(유저데이터.스탯.던전.디지에그.레벨);
    디지에그.스탯.반격 = Math.min(10 * 유저데이터.스탯.던전.디지에그.레벨, 70);
    디지에그.스탯.반격무시 = 0 + 10 * 유저데이터.스탯.던전.디지에그.레벨;
    디지에그.스탯.반격계수 = 0 + 10 * 유저데이터.스탯.던전.디지에그.레벨;

    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(유저데이터)), // 복사본
      JSON.parse(JSON.stringify(디지에그))  // 복사본
    );

    if (전투결과.결과 === "승리") {
      유저데이터.스탯.디지에그 = 유저데이터.스탯.디지에그 + 유저데이터.스탯.던전.디지에그.레벨 * 1;
      if (유저데이터.스탯.던전.디지에그.레벨 < 20) {
        유저데이터.스탯.던전.디지에그.레벨 += 1;
      }
      // 유저데이터.스탯.던전.디지에그.레벨 += 1;
    } else {
      유저데이터.스탯.디지에그 = 유저데이터.스탯.디지에그 + (유저데이터.스탯.던전.디지에그.레벨 - 1) * 1;
    }

    유저데이터.스탯.던전.디지에그.열쇠 -= 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    // res.json(유저데이터);
    res.json({ 유저데이터, 전투결과 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/reroll1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (data.스탯.스톤 < 10) {
      return res.status(404).json({ 오류: "스톤이 부족합니다" });
    }

    const 랜덤스탯 = 조각상스탯목록[Math.floor(Math.random() * 조각상스탯목록.length)];

    data.스탯.조각상1 = {};
    data.스탯.조각상1[랜덤스탯] = 0;
    data.스탯.조각상1.등급 = "기본";
    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    data.스탯.스톤 -= 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Enhance1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (!Object.keys(data.스탯.조각상1 || {}).find(k => k !== "등급")) {
      return res.status(400).json({ 오류: "먼저 리롤로 옵션을 획득하세요" });
    }

    const 조각상 = data.스탯.조각상1;
    const 현재등급 = 조각상.등급 || "기본";

    const 현재인덱스 = 현재등급 === "기본" ? -1 : 등급순서.indexOf(현재등급);


    if (현재인덱스 === -1 && 현재등급 !== "기본") {
      return res.status(400).json({ 오류: "잘못된 등급입니다" });
    }
    if (현재인덱스 === 등급순서.length - 1) {
      return res.status(400).json({ 오류: "더 이상 강화할 수 없습니다" });
    }

    const 다음등급 = 등급순서[현재인덱스 + 1];

    const 필요가루 = 현재등급 === "기본" ? 20 : (현재인덱스 + 3) * 10;

    if (data.스탯.스톤 < 필요가루) {
      return res.status(400).json({ 오류: "스톤이 부족합니다" });
    }

    data.스탯.스톤 -= 필요가루;

    const 성공확률 = 조각상강화확률표[현재인덱스 + 1];

    if (Math.random() < 성공확률) {
      조각상.등급 = 다음등급;
      const 옵션키 = Object.keys(조각상).find(k => k !== "등급");
      if (옵션키) {
        조각상[옵션키] = (조각상[옵션키] || 0) + 20;
      }
    }

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/reroll2", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (data.스탯.스톤 < 10) {
      return res.status(404).json({ 오류: "스톤이 부족합니다" });
    }

    const 랜덤스탯 = 조각상스탯목록[Math.floor(Math.random() * 조각상스탯목록.length)];

    data.스탯.조각상2 = {};
    data.스탯.조각상2[랜덤스탯] = 0;
    data.스탯.조각상2.등급 = "기본";
    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    data.스탯.스톤 -= 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Enhance2", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (!Object.keys(data.스탯.조각상2 || {}).find(k => k !== "등급")) {
      return res.status(400).json({ 오류: "먼저 리롤로 옵션을 획득하세요" });
    }

    const 조각상 = data.스탯.조각상2;
    const 현재등급 = 조각상.등급 || "기본";

    const 현재인덱스 = 현재등급 === "기본" ? -1 : 등급순서.indexOf(현재등급);


    if (현재인덱스 === -1 && 현재등급 !== "기본") {
      return res.status(400).json({ 오류: "잘못된 등급입니다" });
    }
    if (현재인덱스 === 등급순서.length - 1) {
      return res.status(400).json({ 오류: "더 이상 강화할 수 없습니다" });
    }

    const 다음등급 = 등급순서[현재인덱스 + 1];

    const 필요가루 = 현재등급 === "기본" ? 20 : (현재인덱스 + 3) * 10;

    if (data.스탯.스톤 < 필요가루) {
      return res.status(400).json({ 오류: "스톤이 부족합니다" });
    }

    data.스탯.스톤 -= 필요가루;

    const 성공확률 = 조각상강화확률표[현재인덱스 + 1];

    if (Math.random() < 성공확률) {
      조각상.등급 = 다음등급;
      const 옵션키 = Object.keys(조각상).find(k => k !== "등급");
      if (옵션키) {
        조각상[옵션키] = (조각상[옵션키] || 0) + 20;
      }
    }

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/reroll3", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (data.스탯.계정.레벨 < 15) {
      return res.status(400).json({ 오류: "계정 15레벨 이상부터 가능합니다" });
    }

    if (data.스탯.스톤 < 10) {
      return res.status(404).json({ 오류: "스톤이 부족합니다" });
    }

    const 랜덤스탯 = 조각상스탯목록[Math.floor(Math.random() * 조각상스탯목록.length)];

    data.스탯.조각상3 = {};
    data.스탯.조각상3[랜덤스탯] = 0;
    data.스탯.조각상3.등급 = "기본";
    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    data.스탯.스톤 -= 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Enhance3", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (data.스탯.계정.레벨 < 15) {
      return res.status(400).json({ 오류: "계정 15레벨 이상부터 가능합니다" });
    }

    if (!Object.keys(data.스탯.조각상3 || {}).find(k => k !== "등급")) {
      return res.status(400).json({ 오류: "먼저 리롤로 옵션을 획득하세요" });
    }

    const 조각상 = data.스탯.조각상3;
    const 현재등급 = 조각상.등급 || "기본";

    const 현재인덱스 = 현재등급 === "기본" ? -1 : 등급순서.indexOf(현재등급);


    if (현재인덱스 === -1 && 현재등급 !== "기본") {
      return res.status(400).json({ 오류: "잘못된 등급입니다" });
    }
    if (현재인덱스 === 등급순서.length - 1) {
      return res.status(400).json({ 오류: "더 이상 강화할 수 없습니다" });
    }

    const 다음등급 = 등급순서[현재인덱스 + 1];

    const 필요가루 = 현재등급 === "기본" ? 20 : (현재인덱스 + 3) * 10;

    if (data.스탯.스톤 < 필요가루) {
      return res.status(400).json({ 오류: "스톤이 부족합니다" });
    }

    data.스탯.스톤 -= 필요가루;

    const 성공확률 = 조각상강화확률표[현재인덱스 + 1];

    if (Math.random() < 성공확률) {
      조각상.등급 = 다음등급;
      const 옵션키 = Object.keys(조각상).find(k => k !== "등급");
      if (옵션키) {
        조각상[옵션키] = (조각상[옵션키] || 0) + 20;
      }
    }

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/reroll4", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (data.스탯.계정.레벨 < 30) {
      return res.status(400).json({ 오류: "계정 30레벨 이상부터 가능합니다" });
    }

    if (data.스탯.스톤 < 10) {
      return res.status(404).json({ 오류: "스톤이 부족합니다" });
    }

    const 랜덤스탯 = 조각상스탯목록[Math.floor(Math.random() * 조각상스탯목록.length)];

    data.스탯.조각상4 = {};
    data.스탯.조각상4[랜덤스탯] = 0;
    data.스탯.조각상4.등급 = "기본";
    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
    data.스탯.스톤 -= 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Enhance4", async (req, res) => {
  try {
    const { id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (data.스탯.계정.레벨 < 30) {
      return res.status(400).json({ 오류: "계정 30레벨 이상부터 가능합니다" });
    }

    if (!Object.keys(data.스탯.조각상4 || {}).find(k => k !== "등급")) {
      return res.status(400).json({ 오류: "먼저 리롤로 옵션을 획득하세요" });
    }

    const 조각상 = data.스탯.조각상4;
    const 현재등급 = 조각상.등급 || "기본";

    const 현재인덱스 = 현재등급 === "기본" ? -1 : 등급순서.indexOf(현재등급);


    if (현재인덱스 === -1 && 현재등급 !== "기본") {
      return res.status(400).json({ 오류: "잘못된 등급입니다" });
    }
    if (현재인덱스 === 등급순서.length - 1) {
      return res.status(400).json({ 오류: "더 이상 강화할 수 없습니다" });
    }

    const 다음등급 = 등급순서[현재인덱스 + 1];

    const 필요가루 = 현재등급 === "기본" ? 20 : (현재인덱스 + 3) * 10;

    if (data.스탯.스톤 < 필요가루) {
      return res.status(400).json({ 오류: "스톤이 부족합니다" });
    }

    data.스탯.스톤 -= 필요가루;

    const 성공확률 = 조각상강화확률표[현재인덱스 + 1];

    if (Math.random() < 성공확률) {
      조각상.등급 = 다음등급;
      const 옵션키 = Object.keys(조각상).find(k => k !== "등급");
      if (옵션키) {
        조각상[옵션키] = (조각상[옵션키] || 0) + 20;
      }
    }

    data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: data.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(data);

  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});


app.post("/arenalist", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("스탯");   // id는 빼고 스탯만 가져오기

    if (error || !data) {
      return res.status(500).json({ 오류: "유저 조회 실패" });
    }

    // 정렬 안 하고 그대로 반환
    res.json({ data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/arenachallenge", async (req, res) => {
  try {
    const { id, 상대닉네임 } = req.body;
    if (!id || !상대닉네임) return res.status(400).json({ 오류: "id, 상대닉네임 필요" });

    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error || !data) return res.status(500).json({ 오류: "유저 조회 실패" });

    // 내 데이터
    const me = data.find(u => u.id === id);
    if (!me) return res.status(404).json({ 오류: "유저 없음" });

    if (!me.스탯.전장 || me.스탯.전장.티켓 < 1) {
      return res.status(400).json({ 오류: "티켓 부족" });
    }

    // 상대 데이터 (닉네임으로 찾기)
    const 상대 = data.find(u => u.스탯?.계정?.유저닉네임 === 상대닉네임);
    if (!상대) return res.status(404).json({ 오류: "상대 없음" });

    // 전투 시뮬레이션
    const 전투결과 = 전투시뮬레이션(
      JSON.parse(JSON.stringify(me)),
      JSON.parse(JSON.stringify(상대))
    );

    if (전투결과.결과 === "승리") {
      me.스탯.전장.포인트 = (상대.스탯.전장.포인트 || 0) + 100 + me.스탯.계정.레벨;
    }

    me.스탯.전장.티켓 = (me.스탯.전장.티켓 || 0) - 1;

    // 내 스탯 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: me.스탯 })
      .eq("id", id);

    if (updateError) return res.status(500).json({ 오류: "업데이트 실패" });

    res.json({ me, 전투결과 });

  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreGeniekey1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 1000;

    유저데이터.스탯.던전.지니.열쇠 += 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreRokugyukey1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 1000;

    유저데이터.스탯.던전.로쿠규.열쇠 += 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreRockgolemkey1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 1000;

    유저데이터.스탯.던전.락골렘.열쇠 += 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreTicket1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 1000;

    유저데이터.스탯.전장.티켓 += 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreGeniekey10", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 10000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 10000;

    유저데이터.스탯.던전.지니.열쇠 += 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreRokugyukey10", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 10000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 10000;

    유저데이터.스탯.던전.로쿠규.열쇠 += 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreRockgolemkey10", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 10000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 10000;

    유저데이터.스탯.던전.락골렘.열쇠 += 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/StoreTicket10", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 10000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 10000;

    유저데이터.스탯.전장.티켓 += 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});



app.post("/digieggkey1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 1000;

    유저데이터.스탯.던전.디지에그.열쇠 += 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/digieggkey10", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 10000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 10000;

    유저데이터.스탯.던전.디지에그.열쇠 += 10;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/swordart", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    if (유저데이터.스탯.계정.레벨 < 30) {
      return res.status(404).json({ 오류: "30레벨 이상부터 가능합니다" });
    }

    유저데이터.스탯.다이아 -= 1000;

    유저데이터.스탯.직업종류 = "검술";

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/magic", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    if (유저데이터.스탯.계정.레벨 < 30) {
      return res.status(404).json({ 오류: "30레벨 이상부터 가능합니다" });
    }

    유저데이터.스탯.다이아 -= 1000;

    유저데이터.스탯.직업종류 = "마술";

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/somatic", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    if (유저데이터.스탯.계정.레벨 < 30) {
      return res.status(404).json({ 오류: "30레벨 이상부터 가능합니다" });
    }

    유저데이터.스탯.다이아 -= 1000;

    유저데이터.스탯.직업종류 = "체술";

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/healing", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    if (유저데이터.스탯.계정.레벨 < 30) {
      return res.status(404).json({ 오류: "30레벨 이상부터 가능합니다" });
    }

    유저데이터.스탯.다이아 -= 1000;

    유저데이터.스탯.직업종류 = "신술";

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/archery", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    if (유저데이터.스탯.계정.레벨 < 30) {
      return res.status(404).json({ 오류: "30레벨 이상부터 가능합니다" });
    }

    유저데이터.스탯.다이아 -= 1000;

    유저데이터.스탯.직업종류 = "궁술";

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/medicine", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 1000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    if (유저데이터.스탯.계정.레벨 < 30) {
      return res.status(404).json({ 오류: "30레벨 이상부터 가능합니다" });
    }

    유저데이터.스탯.다이아 -= 1000;

    유저데이터.스탯.직업종류 = "인술";

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});


app.post("/appearance", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.가루 < 20000 * (유저데이터.스탯.외형강화.레벨 + 1) - 10000) {
      return res.status(404).json({ 오류: "가루가 부족합니다" });
    }

    유저데이터.스탯.가루 = 유저데이터.스탯.가루 - (20000 * (유저데이터.스탯.외형강화.레벨 + 1) - 10000);

    유저데이터.스탯.외형강화.레벨 += 1;
    유저데이터.스탯.외형강화.HP보너스 += 유저데이터.스탯.외형강화.레벨 + 1;
    유저데이터.스탯.외형강화.공격력보너스 += 유저데이터.스탯.외형강화.레벨 + 1;
    유저데이터.스탯.외형강화.방어력보너스 += 유저데이터.스탯.외형강화.레벨 + 1;
    유저데이터.스탯.외형강화.회피무시 = 4 + Math.floor(((유저데이터.스탯.외형강화.레벨 || 1) - 1) / 10) * 2;

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/appearancereset", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.가루 < 10000) {
      return res.status(404).json({ 오류: "초기화에는 1만가루가 필요합니다" });
    }

    if (유저데이터.스탯.외형강화.레벨 < 1) {
      return res.status(404).json({ 오류: "외형을 강화하세요" });
    }

    유저데이터.스탯.가루 -= 10000;

    const 총투자비용 = 20000 * (유저데이터.스탯.외형강화.레벨 * (유저데이터.스탯.외형강화.레벨 + 1) / 2)
      - 10000 * 유저데이터.스탯.외형강화.레벨;

    유저데이터.스탯.가루 += 총투자비용;

    유저데이터.스탯.외형강화 =
    {
      레벨: 0,
      회피무시: 0,
      HP보너스: 0,
      공격력보너스: 0,
      방어력보너스: 0,
    };

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});




app.post("/ChangeWeaponAppearance", async (req, res) => {
  try {
    const { id, 외형 } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.가루 < 2000) {
      return res.status(400).json({ 오류: "외형변경에는 2000가루가 필요합니다" });
    }

    유저데이터.스탯.가루 -= 2000;

    유저데이터.스탯.무기외형.이름 = 외형;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/WeaponAppearanceReset", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (!유저데이터.스탯.무기외형?.이름) {
      return res.status(404).json({ 오류: "선택된 외형이 없습니다" });
    }

    유저데이터.스탯.무기외형.이름 = "";

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/ChangeClothingAppearance", async (req, res) => {
  try {
    const { id, 외형 } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.가루 < 2000) {
      return res.status(400).json({ 오류: "외형변경에는 2000가루가 필요합니다" });
    }

    유저데이터.스탯.가루 -= 2000;

    유저데이터.스탯.옷외형.이름 = 외형;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/ClothingAppearanceReset", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (!유저데이터.스탯.옷외형?.이름) {
      return res.status(404).json({ 오류: "선택된 외형이 없습니다" });
    }

    유저데이터.스탯.옷외형.이름 = "";

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/ChangeHatAppearance", async (req, res) => {
  try {
    const { id, 외형 } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.가루 < 2000) {
      return res.status(400).json({ 오류: "외형변경에는 2000가루가 필요합니다" });
    }

    유저데이터.스탯.가루 -= 2000;

    유저데이터.스탯.모자외형.이름 = 외형;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/HatAppearanceReset", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (!유저데이터.스탯.모자외형?.이름) {
      return res.status(404).json({ 오류: "선택된 외형이 없습니다" });
    }

    유저데이터.스탯.모자외형.이름 = "";

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/skillautosynthesis", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    let 스킬 = 유저데이터.스탯.스킬;

    let 합성가능 = false;
    for (let i = 1; i <= 10; i++) {
      if ((스킬[i] || 0) >= 3) {
        합성가능 = true;
        break;
      }
    }
    if (!합성가능) {
      return res.status(400).json({ 오류: "합성 가능한 스킬이 없습니다" });
    }

    for (let i = 1; i <= 10; i++) {
      while ((스킬[i] || 0) >= 3) {
        스킬[i] -= 3;
        스킬[i + 1] = (스킬[i + 1] || 0) + 1;
        if ((스킬.최고등급 || 0) < i + 1) 스킬.최고등급 = i + 1; // <<< 추가
      }
    }

    유저데이터.스탯.스킬 = 스킬;

    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/chatting", async (req, res) => {
  try {
    const { id, 채팅내용 } = req.body;
    if (!id || !채팅내용) {
      return res.status(400).json({ 오류: "id와 채팅내용 필요" });
    }

    const { data: 유저데이터, error: 유저에러 } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (유저에러 || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    const { error: 저장에러 } = await supabase
      .from("채팅")
      .insert({
        스탯: 유저데이터.스탯,
        유저아이디: 유저데이터.스탯.계정.유저아이디,
        유저닉네임: 유저데이터.스탯.계정.유저닉네임,
        내용: 채팅내용
      });

    if (저장에러) {
      return res.status(500).json({ 오류: "채팅 저장 실패" });
    }

    return res.json({ 성공: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ 오류: "서버 에러" });
  }
});


app.post("/Chatlist", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ 오류: "id 필요" });

    // 유저 검증 (선택사항)
    const { data: 유저데이터, error: 유저에러 } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (유저에러 || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    // 채팅 테이블에서 최신 100개 불러오기
    const { data: 채팅목록, error } = await supabase
      .from("채팅")
      .select("*")
      .order("시간", { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ 오류: "채팅 불러오기 실패" });
    }

    // 시간 오름차순 정렬해서 반환 (읽기 편하게)
    // 채팅목록.reverse();

    return res.json({ data: 채팅목록 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ 오류: "서버 에러" });
  }
});

app.post("/lamponeshotsystem", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    if (유저데이터.스탯.다이아 < 3000) {
      return res.status(404).json({ 오류: "다이아가 부족합니다" });
    }

    유저데이터.스탯.다이아 = 유저데이터.스탯.다이아 - 3000;

    유저데이터.스탯.램프원샷 = 1;


    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json(유저데이터);
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Foodeat1", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    const 현재레벨 = 유저데이터.스탯.동료1.레벨;
    let 필요수량 = 현재레벨 + 1;
    let 진화확률 = null;
    let 배율 = 1;
    let 새시기 = 유저데이터.스탯.동료1.시기;
    let 새이름 = 유저데이터.스탯.동료1.이름;

    // 진화 구간 판정
    if ([29, 49, 69, 99, 129].includes(현재레벨)) {
      const n = 현재레벨;
      필요수량 = (n * (n + 1)) / 2; // 등차수열 합
      if (현재레벨 === 29) { 진화확률 = 80; 새이름 = "토코몬"; 새시기 = `유년기Ⅱ`; }
      else if (현재레벨 === 49) { 진화확률 = 60; 새이름 = "파피몬"; 새시기 = `유아기`; }
      else if (현재레벨 === 69) { 진화확률 = 40; 새이름 = "엔젤몬"; 새시기 = `성장기`; }
      else if (현재레벨 === 99) { 진화확률 = 20; 새이름 = "홀리엔젤몬"; 새시기 = `완전체`; }
      else if (현재레벨 === 129) { 진화확률 = 20; 새이름 = "세라피몬"; 새시기 = `궁극체`; }
    }

    if (유저데이터.스탯.디지에그 < 필요수량) {
      return res.status(400).json({ 오류: `먹이 부족 (필요: ${필요수량})` });
    }

    // 먹이 차감
    유저데이터.스탯.디지에그 -= 필요수량;

    let 진화성공 = null;  // 기본은 null

    if (진화확률 !== null) {
      // 확률 판정
      if (Math.random() * 100 < 진화확률) {
        진화성공 = true;
        유저데이터.스탯.동료1.레벨 += 1;

        // 기본 배율 계산 (레벨 구간별 적용)
        if (유저데이터.스탯.동료1.레벨 < 30) 배율 = 1;
        else if (유저데이터.스탯.동료1.레벨 < 50) 배율 = 2;
        else if (유저데이터.스탯.동료1.레벨 < 70) 배율 = 3;
        else if (유저데이터.스탯.동료1.레벨 < 100) 배율 = 4;
        else if (유저데이터.스탯.동료1.레벨 < 130) 배율 = 5;
        else 배율 = 6;

        유저데이터.스탯.동료1.시기 = 새시기;
        유저데이터.스탯.동료1.이름 = 새이름;

        for (const 키 in 유저데이터.스탯.동료1) {
          if (typeof 유저데이터.스탯.동료1[키] === "number" && 키 !== "레벨") {
            유저데이터.스탯.동료1[키] = 유저데이터.스탯.동료1.레벨 * 배율;
          }
        }

        유저데이터.스탯.동료1.동료치명 = 유저데이터.스탯.동료1.레벨 * 1;

      } else {
        진화성공 = false;
      }
    } else {
      // 일반 구간 → 무조건 레벨업
      유저데이터.스탯.동료1.레벨 += 1;

      // 기본 배율 계산 (레벨 구간별 적용)
      if (유저데이터.스탯.동료1.레벨 < 30) 배율 = 1;
      else if (유저데이터.스탯.동료1.레벨 < 50) 배율 = 2;
      else if (유저데이터.스탯.동료1.레벨 < 70) 배율 = 3;
      else if (유저데이터.스탯.동료1.레벨 < 100) 배율 = 4;
      else if (유저데이터.스탯.동료1.레벨 < 130) 배율 = 5;
      else 배율 = 6;

      for (const 키 in 유저데이터.스탯.동료1) {
        if (typeof 유저데이터.스탯.동료1[키] === "number" && 키 !== "레벨") {
          유저데이터.스탯.동료1[키] = 유저데이터.스탯.동료1.레벨 * 배율;
        }
      }

      유저데이터.스탯.동료1.동료치명 = 유저데이터.스탯.동료1.레벨 * 1;

    }

    // 최종스탯 재계산
    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json({ me: 유저데이터, 진화성공 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Foodeat2", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    const 현재레벨 = 유저데이터.스탯.동료2.레벨;
    let 필요수량 = 현재레벨 + 1;
    let 진화확률 = null;
    let 배율 = 1;
    let 새시기 = 유저데이터.스탯.동료2.시기;
    let 새이름 = 유저데이터.스탯.동료2.이름;

    // 진화 구간 판정
    if ([29, 49, 69, 99, 129].includes(현재레벨)) {
      const n = 현재레벨;
      필요수량 = (n * (n + 1)) / 2; // 등차수열 합
      if (현재레벨 === 29) { 진화확률 = 80; 새이름 = "나타몬"; 새시기 = `유년기Ⅱ`; }
      else if (현재레벨 === 49) { 진화확률 = 60; 새이름 = "프로트몬"; 새시기 = `유아기`; }
      else if (현재레벨 === 69) { 진화확률 = 40; 새이름 = "가트몬"; 새시기 = `성장기`; }
      else if (현재레벨 === 99) { 진화확률 = 20; 새이름 = "엔젤우몬"; 새시기 = `완전체`; }
      else if (현재레벨 === 129) { 진화확률 = 20; 새이름 = "오파니몬"; 새시기 = `궁극체`; }
    }

    if (유저데이터.스탯.디지에그 < 필요수량) {
      return res.status(400).json({ 오류: `먹이 부족 (필요: ${필요수량})` });
    }

    // 먹이 차감
    유저데이터.스탯.디지에그 -= 필요수량;

    let 진화성공 = null;  // 기본은 null

    if (진화확률 !== null) {
      // 확률 판정
      if (Math.random() * 100 < 진화확률) {
        진화성공 = true;
        유저데이터.스탯.동료2.레벨 += 1;

        // 기본 배율 계산 (레벨 구간별 적용)
        if (유저데이터.스탯.동료2.레벨 < 30) 배율 = 1;
        else if (유저데이터.스탯.동료2.레벨 < 50) 배율 = 2;
        else if (유저데이터.스탯.동료2.레벨 < 70) 배율 = 3;
        else if (유저데이터.스탯.동료2.레벨 < 100) 배율 = 4;
        else if (유저데이터.스탯.동료2.레벨 < 130) 배율 = 5;
        else 배율 = 6;

        유저데이터.스탯.동료2.시기 = 새시기;
        유저데이터.스탯.동료2.이름 = 새이름;

        for (const 키 in 유저데이터.스탯.동료2) {
          if (typeof 유저데이터.스탯.동료2[키] === "number" && 키 !== "레벨") {
            유저데이터.스탯.동료2[키] = 유저데이터.스탯.동료2.레벨 * 배율;
          }
        }

        유저데이터.스탯.동료2.동료치명 = 유저데이터.스탯.동료2.레벨 * 1;

      } else {
        진화성공 = false;
      }
    } else {
      // 일반 구간 → 무조건 레벨업
      유저데이터.스탯.동료2.레벨 += 1;

      // 기본 배율 계산 (레벨 구간별 적용)
      if (유저데이터.스탯.동료2.레벨 < 30) 배율 = 1;
      else if (유저데이터.스탯.동료2.레벨 < 50) 배율 = 2;
      else if (유저데이터.스탯.동료2.레벨 < 70) 배율 = 3;
      else if (유저데이터.스탯.동료2.레벨 < 100) 배율 = 4;
      else if (유저데이터.스탯.동료2.레벨 < 130) 배율 = 5;
      else 배율 = 6;

      for (const 키 in 유저데이터.스탯.동료2) {
        if (typeof 유저데이터.스탯.동료2[키] === "number" && 키 !== "레벨") {
          유저데이터.스탯.동료2[키] = 유저데이터.스탯.동료2.레벨 * 배율;
        }
      }

      유저데이터.스탯.동료2.동료치명 = 유저데이터.스탯.동료2.레벨 * 1;

    }

    // 최종스탯 재계산
    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json({ me: 유저데이터, 진화성공 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

app.post("/Foodeat3", async (req, res) => {
  try {
    const { id } = req.body;

    const { data: 유저데이터, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저데이터) {
      return res.status(404).json({ 오류: "유저 없음" });
    }

    const 현재레벨 = 유저데이터.스탯.동료3.레벨;
    let 필요수량 = 현재레벨 + 1;
    let 진화확률 = null;
    let 배율 = 1;
    let 새시기 = 유저데이터.스탯.동료3.시기;
    let 새이름 = 유저데이터.스탯.동료3.이름;

    // 진화 구간 판정
    if ([29, 49, 69, 99, 129].includes(현재레벨)) {
      const n = 현재레벨;
      필요수량 = (n * (n + 1)) / 2; // 등차수열 합
      if (현재레벨 === 29) { 진화확률 = 80; 새이름 = "츠나몬"; 새시기 = `유년기Ⅱ`; }
      else if (현재레벨 === 49) { 진화확률 = 60; 새이름 = "루나몬"; 새시기 = `유아기`; }
      else if (현재레벨 === 69) { 진화확률 = 40; 새이름 = "레프리몬"; 새시기 = `성장기`; }
      else if (현재레벨 === 99) { 진화확률 = 20; 새이름 = "렉시몬"; 새시기 = `완전체`; }
      else if (현재레벨 === 129) { 진화확률 = 20; 새이름 = "케루비몬"; 새시기 = `궁극체`; }
    }

    if (유저데이터.스탯.디지에그 < 필요수량) {
      return res.status(400).json({ 오류: `먹이 부족 (필요: ${필요수량})` });
    }

    // 먹이 차감
    유저데이터.스탯.디지에그 -= 필요수량;

    let 진화성공 = null;  // 기본은 null

    if (진화확률 !== null) {
      // 확률 판정
      if (Math.random() * 100 < 진화확률) {
        진화성공 = true;
        유저데이터.스탯.동료3.레벨 += 1;

        // 기본 배율 계산 (레벨 구간별 적용)
        if (유저데이터.스탯.동료3.레벨 < 30) 배율 = 1;
        else if (유저데이터.스탯.동료3.레벨 < 50) 배율 = 2;
        else if (유저데이터.스탯.동료3.레벨 < 70) 배율 = 3;
        else if (유저데이터.스탯.동료3.레벨 < 100) 배율 = 4;
        else if (유저데이터.스탯.동료3.레벨 < 130) 배율 = 5;
        else 배율 = 6;

        유저데이터.스탯.동료3.시기 = 새시기;
        유저데이터.스탯.동료3.이름 = 새이름;

        for (const 키 in 유저데이터.스탯.동료3) {
          if (typeof 유저데이터.스탯.동료3[키] === "number" && 키 !== "레벨") {
            유저데이터.스탯.동료3[키] = 유저데이터.스탯.동료3.레벨 * 배율;
          }
        }

        유저데이터.스탯.동료2.동료치명 = 유저데이터.스탯.동료2.레벨 * 1;

      } else {
        진화성공 = false;
      }
    } else {
      // 일반 구간 → 무조건 레벨업
      유저데이터.스탯.동료3.레벨 += 1;

      // 기본 배율 계산 (레벨 구간별 적용)
      if (유저데이터.스탯.동료3.레벨 < 30) 배율 = 1;
      else if (유저데이터.스탯.동료3.레벨 < 50) 배율 = 2;
      else if (유저데이터.스탯.동료3.레벨 < 70) 배율 = 3;
      else if (유저데이터.스탯.동료3.레벨 < 100) 배율 = 4;
      else if (유저데이터.스탯.동료3.레벨 < 130) 배율 = 5;
      else 배율 = 6;

      for (const 키 in 유저데이터.스탯.동료3) {
        if (typeof 유저데이터.스탯.동료3[키] === "number" && 키 !== "레벨") {
          유저데이터.스탯.동료3[키] = 유저데이터.스탯.동료3.레벨 * 배율;
        }
      }

      유저데이터.스탯.동료3.동료치명 = 유저데이터.스탯.동료3.레벨 * 1;

    }

    // 최종스탯 재계산
    유저데이터.스탯 = { ...유저데이터.스탯, ...최종스탯계산(유저데이터.스탯) };

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯: 유저데이터.스탯 })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ 오류: "업데이트 실패" });
    }

    res.json({ me: 유저데이터, 진화성공 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ 오류: "서버 오류" });
  }
});






























































//전투시뮬레이션함수
function 전투시뮬레이션(나, 상대) {
  let 나순간최고데미지 = 0;
  let 상대순간최고데미지 = 0;
  let 턴수 = 0;
  let 로그 = [];
  let 나총회복량 = 0;
  let 상대총회복량 = 0;
  let 나총스킬피해량 = 0;
  let 상대총스킬피해량 = 0;

  const 나최대HP = 나.스탯.최종HP;
  const 상대최대HP = 상대.스탯.최종HP;

  const 나회복량 = 나최대HP * ((나.스탯.치유량) / 100);
  const 상대회복량 = 상대최대HP * ((상대.스탯.치유량) / 100);

  let turn = 나.스탯.최종공속 >= 상대.스탯.최종공속 ? "나" : "상대";

  while (나.스탯.최종HP > 0 && 상대.스탯.최종HP > 0) {
    턴수++;

    if (turn === "나") {
      let 기본데미지 = 나.스탯.최종공격력 - 상대.스탯.최종방어력;
      if (!Math.random() * 100 < 상대.스탯.관통무시) {
        기본데미지 = 나.스탯.최종공격력 - 상대.스탯.최종방어력 * ((Math.max(0, 100 - 나.스탯.관통)) / 100);
      }
      let 최종데미지 = 기본데미지;
      if (최종데미지 < 1) 최종데미지 = 1;

      if (Math.random() * 100 < 나.스탯.치명) {
        if (!Math.random() * 100 < 상대.스탯.치명무시) {
          최종데미지 = 기본데미지 * (나.스탯.치명피해 / 100) * ((Math.max(0, 100 - 상대.스탯.치명저항)) / 100);
        } else {
          최종데미지 = 기본데미지 * (나.스탯.일반공격계수 / 100) * ((Math.max(0, 100 - 상대.스탯.일반공격피해감소)) / 100);
        }
      } else {
        최종데미지 = 기본데미지 * (나.스탯.일반공격계수 / 100) * ((Math.max(0, 100 - 상대.스탯.일반공격피해감소)) / 100);
      }

      if (Math.random() * 100 < 나.스탯.콤보) {
        if (!(Math.random() * 100 < 상대.스탯.콤보무시)) {
          최종데미지 = 최종데미지
            * (나.스탯.콤보계수 / 100)
            * ((Math.max(0, 100 - 나.스탯.콤보피해감소)) / 100)
            * 2;
        }
      }

      let 스턴유지 = false;
      if (Math.random() * 100 < 나.스탯.스턴 || Math.random() * 100 < 나.스탯.에어본) {
        if (!(Math.random() * 100 < 상대.스탯.스턴무시)) {
          스턴유지 = true;
        }
      }

      if (Math.random() * 100 < 상대.스탯.회피) {
        if (Math.random() * 100 < 나.스탯.회피무시) {
        } else {
          최종데미지 = 0;
        }
      }

      if (최종데미지 > 나순간최고데미지) {
        나순간최고데미지 = 최종데미지;
      }

      상대.스탯.최종HP -= 최종데미지;
      if (상대.스탯.최종HP <= 0) break;

      if (Math.random() * 100 < 상대.스탯.반격) {
        if (!(Math.random() * 100 < 나.스탯.반격무시)) {
          let 반격데미지 = 상대.스탯.최종공격력 - 나.스탯.최종방어력;
          반격데미지 = 반격데미지
            * (상대.스탯.일반공격계수 / 100)
            * (상대.스탯.반격계수 / 100)
            * ((Math.max(0, 100 - 상대.스탯.반격피해감소)) / 100);
          나.스탯.최종HP -= 반격데미지;
        }
      }
      if (나.스탯.최종HP <= 0) break;

      if (Math.random() * 100 < 20) {
        if (Math.random() * 100 < 나.스탯.스킬치명) {
          최종데미지 = 나.스탯.최종공격력 * (나.스탯.스킬치명피해 / 100) * (나.스탯.스킬피해 / 100) * ((Math.max(0, 100 - 상대.스탯.스킬피해감소)) / 100);
        } else {
          최종데미지 = 나.스탯.최종공격력 * (나.스탯.스킬피해 / 100) * ((Math.max(0, 100 - 상대.스탯.스킬피해감소)) / 100);
        }
        상대.스탯.최종HP -= 최종데미지;
        나총스킬피해량 += 최종데미지;
        if (상대.스탯.최종HP <= 0) break;
      }

      if (Math.random() * 100 < 나.스탯.회복) {
        if (!(Math.random() * 100 < 상대.스탯.회복무시)) {
          나.스탯.최종HP = Math.min(나최대HP, 나.스탯.최종HP + 나회복량);
          나총회복량 += 나회복량;
        }
      }

      turn = 스턴유지 ? "나" : "상대";

    } else {
      let 기본데미지 = 상대.스탯.최종공격력 - 나.스탯.최종방어력;
      if (!Math.random() * 100 < 나.스탯.관통무시) {
        기본데미지 = 상대.스탯.최종공격력 - 나.스탯.최종방어력 * ((Math.max(0, 100 - 상대.스탯.관통)) / 100);
      }
      let 최종데미지 = 기본데미지;
      if (최종데미지 < 1) 최종데미지 = 1;

      if (Math.random() * 100 < 상대.스탯.치명) {
        if (!Math.random() * 100 < 나.스탯.치명무시) {
          최종데미지 = 기본데미지 * (상대.스탯.치명피해 / 100) * ((Math.max(0, 100 - 나.스탯.치명저항)) / 100);
        } else {
          최종데미지 = 기본데미지 * (상대.스탯.일반공격계수 / 100) * ((Math.max(0, 100 - 나.스탯.일반공격피해감소)) / 100);
        }
      } else {
        최종데미지 = 기본데미지 * (상대.스탯.일반공격계수 / 100) * ((Math.max(0, 100 - 나.스탯.일반공격피해감소)) / 100);
      }

      if (Math.random() * 100 < 상대.스탯.콤보) {
        if (!(Math.random() * 100 < 나.스탯.콤보무시)) {
          최종데미지 = 최종데미지
            * (상대.스탯.콤보계수 / 100)
            * ((Math.max(0, 100 - 나.스탯.콤보피해감소)) / 100)
            * 2;
        }
      }

      let 스턴유지 = false;
      if (Math.random() * 100 < 상대.스탯.스턴 || Math.random() * 100 < 상대.스탯.에어본) {
        if (!(Math.random() * 100 < 나.스탯.스턴무시)) {
          스턴유지 = true;
        }
      }

      if (Math.random() * 100 < 나.스탯.회피) {
        if (Math.random() * 100 < 상대.스탯.회피무시) {
        } else {
          최종데미지 = 0;
        }
      }

      if (최종데미지 > 상대순간최고데미지) {
        상대순간최고데미지 = 최종데미지;
      }
      나.스탯.최종HP -= 최종데미지;
      if (나.스탯.최종HP <= 0) break;

      if (Math.random() * 100 < 나.스탯.반격) {
        if (!(Math.random() * 100 < 상대.스탯.반격무시)) {
          let 반격데미지 = 나.스탯.최종공격력 - 상대.스탯.최종방어력;
          반격데미지 = 반격데미지
            * (나.스탯.일반공격계수 / 100)
            * (나.스탯.반격계수 / 100)
            * ((Math.max(0, 100 - 상대.스탯.반격피해감소)) / 100);
          상대.스탯.최종HP -= 반격데미지;
        }
      }
      if (상대.스탯.최종HP <= 0) break;


      if (Math.random() * 100 < 20) {
        if (Math.random() * 100 < 상대.스탯.스킬치명) {
          최종데미지 = 상대.스탯.최종공격력 * (상대.스탯.스킬치명피해 / 100) * (상대.스탯.스킬피해 / 100) * ((Math.max(0, 100 - 나.스탯.스킬피해감소)) / 100);
        } else {
          최종데미지 = 상대.스탯.최종공격력 * (상대.스탯.스킬피해 / 100) * ((Math.max(0, 100 - 나.스탯.스킬피해감소)) / 100);
        }
        상대.스탯.최종HP -= 최종데미지;
        상대총스킬피해량 += 최종데미지;
        if (상대.스탯.최종HP <= 0) break;
      }


      if (Math.random() * 100 < 상대.스탯.회복) {
        if (!(Math.random() * 100 < 나.스탯.회복무시)) {
          상대.스탯.최종HP = Math.min(상대최대HP, 상대.스탯.최종HP + 상대회복량);
          상대총회복량 += 상대회복량;
        }
      }

      turn = 스턴유지 ? "상대" : "나";
    }
  }

  const 결과 = 나.스탯.최종HP > 0 ? "승리" : "패배";

  return {
    결과,
    상대: 상대.스탯.계정?.유저닉네임,
    나HP: 나.스탯.최종HP,
    상대HP: 상대.스탯.최종HP,
    나순간최고데미지,
    상대순간최고데미지,
    나총회복량,
    나회복량: 나회복량,
    상대회복량: 상대회복량,
    상대총회복량,
    턴수,
    나전투력: 나.스탯.전투력,
    상대전투력: 상대.스탯.전투력,
    나총스킬피해량,
    상대총스킬피해량
    // 로그
  };
}

function 직업셋팅(종류, 레벨, 스탯) {
  if (종류 === "검술") {
    if (레벨 >= 30 && 레벨 <= 50) {
      스탯.직업 = {
        종류: "검술1차",
        이름: "베후이아",
        콤보: 30,
        콤보무시: 30,
      };
    } else if (레벨 >= 51 && 레벨 <= 70) {
      스탯.직업 = {
        종류: "검술2차",
        이름: "하카미아",
        콤보: 30,
        콤보무시: 30,
        공격력보너스: 15,
        방어력보너스: 15
      };
    } else if (레벨 >= 71 && 레벨 <= 100) {
      스탯.직업 = {
        종류: "검술3차",
        이름: "라우비아",
        콤보: 30,
        콤보무시: 30,
        공격력보너스: 15,
        방어력보너스: 15,
        피해감소: 10,
      };
    } else if (레벨 >= 101 && 레벨 <= 130) {
      스탯.직업 = {
        종류: "검술4차",
        이름: "예후이아",
        콤보: 30,
        콤보무시: 30,
        공격력보너스: 15,
        방어력보너스: 15,
        피해감소: 10,
      };
    } else if (레벨 >= 131) {
      스탯.직업 = {
        종류: "검술5차",
        이름: "미카엘",
        콤보: 30,
        콤보무시: 30,
        공격력보너스: 15,
        방어력보너스: 15,
        피해감소: 10,
      };
    }
  }

  else if (종류 === "마술") {
    if (레벨 >= 30 && 레벨 <= 50) {
      스탯.직업 = {
        종류: "마술1차",
        이름: "시타엘",
        콤보: 30,
        콤보계수: 30
      };
    } else if (레벨 >= 51 && 레벨 <= 70) {
      스탯.직업 = {
        종류: "마술2차",
        이름: "니트하이아",
        콤보: 30,
        콤보계수: 30,
        공격력보너스: 30
      };
    } else if (레벨 >= 71 && 레벨 <= 100) {
      스탯.직업 = {
        종류: "마술3차",
        이름: "아니엘",
        콤보: 30,
        콤보무시: 130,
        공격력보너스: 30,
      };
    } else if (레벨 >= 101 && 레벨 <= 130) {
      스탯.직업 = {
        종류: "마술4차",
        이름: "아살리야",
        콤보: 30,
        콤보무시: 130,
        공격력보너스: 30,
      };
    } else if (레벨 >= 131) {
      스탯.직업 = {
        종류: "마술5차",
        이름: "무미아",
        콤보: 30,
        콤보무시: 130,
        공격력보너스: 30,
      };
    }
  }

  else if (종류 === "체술") {
    if (레벨 >= 30 && 레벨 <= 50) {
      스탯.직업 = {
        종류: "체술1차",
        이름: "카헤텔",
        반격: 30,
        반격무시: 30
      };
    } else if (레벨 >= 51 && 레벨 <= 70) {
      스탯.직업 = {
        종류: "체술2차",
        이름: "세헤이아",
        반격: 30,
        반격무시: 30,
        HP보너스: 15,
        방어력보너스: 15
      };
    } else if (레벨 >= 71 && 레벨 <= 100) {
      스탯.직업 = {
        종류: "체술3차",
        이름: "르하엘",
        반격: 30,
        반격무시: 30,
        HP보너스: 15,
        방어력보너스: 15,
        반격피해: 100
      };
    } else if (레벨 >= 101 && 레벨 <= 130) {
      스탯.직업 = {
        종류: "체술4차",
        이름: "미츠라엘",
        반격: 30,
        반격무시: 30,
        HP보너스: 15,
        방어력보너스: 15,
        반격피해: 100
      };
    } else if (레벨 >= 131) {
      스탯.직업 = {
        종류: "체술5차",
        이름: "하라헬",
        반격: 30,
        반격무시: 30,
        HP보너스: 15,
        방어력보너스: 15,
        반격피해: 100
      };
    }
  }

  else if (종류 === "신술") {
    if (레벨 >= 30 && 레벨 <= 50) {
      스탯.직업 = {
        종류: "신술1차",
        이름: "라라헬",
        회복: 30,
        치유량: 3
      };
    } else if (레벨 >= 51 && 레벨 <= 70) {
      스탯.직업 = {
        종류: "신술2차",
        이름: "마하시아",
        회복: 30,
        치유량: 3,
        HP보너스: 30,
      };
    } else if (레벨 >= 71 && 레벨 <= 100) {
      스탯.직업 = {
        종류: "신술3차",
        이름: "하후이아",
        회복: 30,
        치유량: 8,
        HP보너스: 30,
      };
    } else if (레벨 >= 101 && 레벨 <= 130) {
      스탯.직업 = {
        종류: "신술4차",
        이름: "하하헬",
        회복: 30,
        치유량: 8,
        HP보너스: 30,
      };
    } else if (레벨 >= 131) {
      스탯.직업 = {
        종류: "신술5차",
        이름: "라파엘",
        회복: 30,
        치유량: 8,
        HP보너스: 30,
      };
    }
  }

  else if (종류 === "궁술") {
    if (레벨 >= 30 && 레벨 <= 50) {
      스탯.직업 = {
        종류: "궁술1차",
        이름: "우미엘",
        치명: 30,
        치명무시: 30
      };
    } else if (레벨 >= 51 && 레벨 <= 70) {
      스탯.직업 = {
        종류: "궁술2차",
        이름: "레미엘",
        치명: 30,
        치명무시: 30,
        공격력보너스: 30
      };
    } else if (레벨 >= 71 && 레벨 <= 100) {
      스탯.직업 = {
        종류: "궁술3차",
        이름: "옐라히아",
        치명: 30,
        치명무시: 30,
        공격력보너스: 30,
        치명피해: 100,
      };
    } else if (레벨 >= 101 && 레벨 <= 130) {
      스탯.직업 = {
        종류: "궁술4차",
        이름: "세알리아",
        치명: 30,
        치명무시: 30,
        공격력보너스: 30,
        치명피해: 100,
      };
    } else if (레벨 >= 131) {
      스탯.직업 = {
        종류: "궁술5차",
        이름: "가브리엘",
        치명: 30,
        치명무시: 30,
        공격력보너스: 30,
        치명피해: 100,
      };
    }
  }

  else if (종류 === "인술") {
    if (레벨 >= 30 && 레벨 <= 50) {
      스탯.직업 = {
        종류: "인술1차",
        이름: "이에이아엘",
        치명: 30,
        치명피해: 30
      };
    } else if (레벨 >= 51 && 레벨 <= 70) {
      스탯.직업 = {
        종류: "인술2차",
        이름: "메나델",
        치명: 30,
        치명피해: 30,
        공격력보너스: 15,
        HP보너스: 15,
      };
    } else if (레벨 >= 71 && 레벨 <= 100) {
      스탯.직업 = {
        종류: "인술3차",
        이름: "다마비아",
        치명: 30,
        치명피해: 80,
        공격력보너스: 15,
        HP보너스: 15,
        치명저항: 30,
      };
    } else if (레벨 >= 101 && 레벨 <= 130) {
      스탯.직업 = {
        종류: "인술4차",
        이름: "우마벨",
        치명: 30,
        치명피해: 80,
        공격력보너스: 15,
        HP보너스: 15,
        치명저항: 30,
      };
    } else if (레벨 >= 131) {
      스탯.직업 = {
        종류: "인술5차",
        이름: "사리에",
        치명: 30,
        치명피해: 80,
        공격력보너스: 15,
        HP보너스: 15,
        치명저항: 30,
      };
    }
  }
}


































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
  "치명", "회피", "회복", "콤보", "반격", "스턴", "스킬치명", "스킬피해", "동료치명", "동료피해",
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
  "무기", "모자", "안경", "견갑", "옷", "완갑", "장갑", "벨트", "무릎아머", "신발", //깡스탯
  "탈것",
  "조각상1", "조각상2", "조각상3", "조각상4", "조각상5", "조각상6",
  "유물",
  "직업",
  "스킬",
  "외형강화",
  "동료1",
  "동료2",
  "동료3",
];

const 조각상스탯목록 = [
  "공격력보너스",
  "방어력보너스",
  "HP보너스",
  "치명피해",
  "치명저항",
  "콤보계수",
  "반격계수",
  "스킬피해",
  "동료피해",
];
// 12단계 확률 (기본→D ~ UU→X)
const 조각상강화확률표 = [
  0.700000,  // 기본 → D
  0.294400,  // D → C
  0.123900,  // C → B
  0.052100,  // B → A
  0.021900,  // A → S
  0.009190,  // S → SS
  0.003860,  // SS → L
  0.001620,  // L → LL
  0.000682,  // LL → U
  0.000287,  // U → UU
  0.000121   // UU → X (≈0.01%)
];

const 스킬드랍확률표 = new Map([
  [1, 1.3],
  [2, 0.169],
  [3, 0.2197],
  [4, 0.00285],
  // [1, 40],
  // [2, 30],
  // [3, 20],
  // [4, 10],
]);

const 스탯목록 = [
  "HP",
  "공격력",
  "방어력",
  "공속",
  "치명",
  "치명무시",
  "치명피해",
  "치명저항",
  "콤보",
  "콤보무시",
  "콤보계수",
  "콤보피해감소",
  "반격",
  "반격무시",
  "반격계수",
  "반격피해감소",
  "스턴",
  "스턴무시",
  "회피",
  "회피무시",
  "회복",
  "회복무시",
  "에어본",
  "스킬치명",
  "스킬치명피해",
  "스킬피해",
  "스킬피해감소",
  "동료치명",
  "동료치명피해",
  "동료피해",
  "동료피해감소",
  "일반공격계수",
  "일반공격피해감소",
  "치유량",
  "관통",
  "관통무시",
  "피해감소",
  "HP보너스",
  "공격력보너스",
  "방어력보너스",
  "공속보너스"
];

function 던전스탯생성(레벨) {
  return {
    스탯: {
      치명: 0 + 1 * 레벨,
      치명무시: 0 + 1 * 레벨,
      치명피해: 150 + 1 * 레벨,
      치명저항: 0 + 1 * 레벨,
      콤보: 0 + 1 * 레벨,
      콤보무시: 0 + 1 * 레벨,
      콤보계수: 100 + 1 * 레벨,
      콤보피해감소: 0 + 1 * 레벨,
      반격: 0 + 1 * 레벨,
      반격무시: 0 + 1 * 레벨,
      반격계수: 100 + 1 * 레벨,
      반격피해감소: 0 + 1 * 레벨,
      스턴: 0 + 1 * 레벨,
      스턴무시: 0 + 1 * 레벨,
      회피: 0 + 1 * 레벨,
      회피무시: 0 + 1 * 레벨,
      회복: 0 + 1 * 레벨,
      회복무시: 0 + 1 * 레벨,
      에어본: 0 + 1 * 레벨,
      일반공격계수: 100 + 1 * 레벨,
      일반공격피해감소: 0 + 1 * 레벨,
      스킬치명: 10 * 레벨,
      스킬치명피해: 150 + 10 * 레벨,
      스킬피해: 10 * 레벨,
      스킬피해감소: 1 * 레벨,
      동료치명: 10 * 레벨,
      동료치명피해: 150 + 10 * 레벨,
      동료피해: 10 * 레벨,
      동료피해감소: 1 * 레벨,
      치유량: 0.2 + 0.002 * 레벨,
      관통: 0 + 1 * 레벨,
      관통무시: 0 + 1 * 레벨,
      막기: 0 + 1 * 레벨,
      막기무시: 0 + 1 * 레벨,
      피해감소: 0 + 1 * 레벨,
      최종HP: 15000 * 레벨 * 10,
      최종공격력: 900 * 레벨 * 10,
      최종방어력: 300 * 레벨 * 10,
      최종공속: 1 + 0.1 * 레벨 * 10,
      전투력:
        (15000 * 레벨 * 10) * 0.05 +
        (900 * 레벨 * 10) +
        (300 * 레벨 * 10) * 2 +
        (1 + 0.2 * 레벨 * 10) * 50,
    }
  };
}

function 최종스탯계산(스탯) {
  const 결과 = {};

  if (스탯.계정.현재경험치 >= 스탯.계정.다음경험치) {
    스탯.계정.현재경험치 -= 스탯.계정.다음경험치;
    스탯.계정.레벨++;
    스탯.계정.다음경험치 = 필요경험치(스탯.계정.레벨);

    스탯.계정.HP = 1000 + 100 * 스탯.계정.레벨;
    스탯.계정.공격력 = 60 + 6 * 스탯.계정.레벨;
    스탯.계정.방어력 = 20 + 2 * 스탯.계정.레벨;

    스탯.계정.공속 = 1 + 0.05 * 스탯.계정.레벨;
    스탯.계정.치명피해 = 150 + 1.5 * 스탯.계정.레벨;
    스탯.계정.치명저항 = 0 + 0.05 * 스탯.계정.레벨;
    스탯.계정.일반공격계수 = 100 + 1 * 스탯.계정.레벨;
    스탯.계정.콤보계수 = 100 + 1 * 스탯.계정.레벨;
    스탯.계정.반격계수 = 100 + 1 * 스탯.계정.레벨;
    스탯.계정.스킬치명피해 = 150 + 1.5 * 스탯.계정.레벨;
    스탯.계정.스킬피해 = 100 + 1 * 스탯.계정.레벨;
    스탯.계정.동료치명피해 = 150 + 1.5 * 스탯.계정.레벨;
    스탯.계정.동료피해 = 100 + 1 * 스탯.계정.레벨;
    스탯.계정.치유량 = 0.2 + 0.002 * 스탯.계정.레벨;
  }
  결과.계정 = 스탯.계정;

  if (스탯.직업종류) {
    직업셋팅(스탯.직업종류, 스탯.계정.레벨, 스탯);
  }
  결과.직업 = 스탯.직업;
  if (스탯.램프.현재골드 >= 스탯.램프.다음골드) {
    스탯.램프.현재골드 -= 스탯.램프.다음골드;
    스탯.램프.레벨++;
    스탯.램프.다음골드 = 필요골드(스탯.램프.레벨);
  }
  결과.램프 = 스탯.램프;

  if (스탯.스킬?.최고등급 !== 0) {
    스탯.스킬.HP보너스 = 스탯.스킬.최고등급 * 30;
    스탯.스킬.공격력보너스 = 스탯.스킬.최고등급 * 30;
    스탯.스킬.방어력보너스 = 스탯.스킬.최고등급 * 30;
    스탯.스킬.스킬치명 = 스탯.스킬.최고등급 * 10;
    스탯.스킬.스킬치명피해 = 스탯.스킬.최고등급 * 20;
    스탯.스킬.스킬피해 = 스탯.스킬.최고등급 * 20;
    스탯.스킬.스킬피해감소 = 스탯.스킬.최고등급 * 5;
  }

  for (const 옵션명 of 스탯목록) {
    let 합계 = 0;
    for (const 장비 of 장비목록) {
      if (스탯[장비]?.[옵션명]) {
        합계 += Number(스탯[장비][옵션명]);
      }
    }
    결과[옵션명] = Math.round(합계 * 100) / 100;
  }

  결과.최종HP = Math.floor(결과.HP + (결과.HP * 결과.HP보너스 / 100));
  결과.최종공격력 = Math.floor(결과.공격력 + (결과.공격력 * 결과.공격력보너스 / 100));
  결과.최종방어력 = Math.floor(결과.방어력 + (결과.방어력 * 결과.방어력보너스 / 100));
  결과.최종공속 = Math.floor(결과.공속 + (결과.공속 * 결과.공속보너스 / 100));
  결과.전투력 = Math.floor(결과.최종HP * 0.05 + 결과.최종공격력 + 결과.최종방어력 * 2 + 결과.최종공속 * 50);

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


//오픈적용
//서버적용
//상점수정