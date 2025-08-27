
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

    const 기본스탯 = {
      생성시각: now.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }), //"2025. 8. 26. 오후 4:37:00",
      생성요일: now.toLocaleDateString("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" }), //"화요일"
      접속시각: Math.floor(now.getTime() / 3600000), // 478520,
      접속요일: now.toLocaleDateString("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" }), //"화요일"
      계정: {
        유저아이디: 아이디,
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
      },
      서버: 1,
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

// 로그인하기
app.post("/login", async (req, res) => {
  try {
    const { 아이디, 비밀번호 } = req.body;
    if (!아이디 || !비밀번호) {
      return res.status(400).json({ 오류: "아이디와 비밀번호가 필요합니다" });
    }

    const email = `${아이디}@agk.com`;

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password: 비밀번호 });

    if (authError || !authData.user) {
      return res.status(400).json({ 오류: "아이디 또는 비밀번호가 올바르지 않습니다" });
    }

    const id = authData.user.id;

    const { data: 유저, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !유저) {
      return res.status(404).json({ 오류: "유저 정보를 찾을 수 없습니다" });
    }


    const now = new Date();
    const 현재접속 = Math.floor(now.getTime() / 3600000);
    const 이전접속 = 유저.스탯?.접속시각 || 현재접속;
    const 시간차 = 현재접속 - 이전접속;

    if (시간차 > 0 && 유저.스탯?.램프) {
      유저.스탯.램프.수량 = (유저.스탯.램프.수량 || 0) + 시간차 * (유저.스탯.램프.레벨 * 10);
    }

    유저.스탯 = { ...유저.스탯, ...최종스탯계산(유저.스탯) };
    const 스탯 = 유저.스탯;

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    res.json({ 유저 });
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

    const { id: _, ...나머지 } = data;
    res.json({ ...나머지 });

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


    if (!data.스탯?.램프 || data.스탯.램프.수량 < 1) {
      return res.status(400).json({ 오류: "램프 부족" });
    }

    const 계정레벨 = data.스탯.계정.레벨 || 1;
    const 현재경험치 = data.스탯.계정.현재경험치 || 0;
    const 램프레벨 = data.스탯.램프.레벨 || 1;

    // 장비 레벨 결정 (레벨±1 or 동일)
    const 후보 = [계정레벨 - 1, 계정레벨, 계정레벨 + 1].filter(lv => lv >= 1);
    const 장비레벨 = 후보[Math.floor(Math.random() * 후보.length)];

    // 등급 결정
    const 확률표 = 드랍확률표[램프레벨];
    const 뽑기 = Math.random() * 100;
    let 누적 = 0, 선택등급 = "일반";
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

    const HP = Math.floor((100 + (30 * idx)) * 장비레벨 * (0.9 + Math.random() * 0.2));
    const 공격력 = Math.floor((5 + (2 * idx)) * 장비레벨 * (0.9 + Math.random() * 0.2));
    const 방어력 = Math.floor((2 + (1 * idx)) * 장비레벨 * (0.9 + Math.random() * 0.2));

    // 공속: 소수점 3자리까지만 남기기
    const 공속원본 = (0.001 + (0.001 * idx)) * 장비레벨 * (0.9 + Math.random() * 0.2);
    const 공속 = Math.floor(공속원본 * 1000) / 1000;

    const [최소, 최대] = 특수옵션범위[선택등급];

    // 옵션값: 소수점 2자리까지만 남기기
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

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "스탯 저장 실패" });
    }

    const { id: _, ...나머지 } = data;
    res.json({ ...나머지 });

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

    const { error: updateError } = await supabase
      .from("users")
      .update({ 스탯 })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ 오류: "DB저장 실패" });
    }

    const { id: _, ...나머지 } = data;
    res.json({ ...나머지 });

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

    data.스탯.계정.현재경험치 = (data.스탯.계정.현재경험치 || 0) + (100 + (20 * idx));
    data.스탯.램프.현재골드 = (data.스탯.램프.현재골드 || 0) + (50 + (10 * idx));
    data.스탯.드랍 = {};

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

    const { id: _, ...나머지 } = data;
    res.json({ ...나머지 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 오류: "서버 오류" });
  }
});

//서버응답기본꼴
// app.post("/equip", async (req, res) => {
//   try {
//     const { id } = req.body;
//     if (!id) return res.status(400).json({ 오류: "id 필요" });

//     const { data, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("id", id)
//       .single();

//     if (error) {
//       console.error(error);
//       return res.status(500).json({ 오류: "DB조회 실패" });
//     }

//     data.스탯 = { ...data.스탯, ...최종스탯계산(data.스탯) };
//     const 스탯 = data.스탯;

//     const { error: updateError } = await supabase
//       .from("users")
//       .update({ 스탯 })
//       .eq("id", id);

//     if (updateError) {
//       console.error(updateError);
//       return res.status(500).json({ 오류: "DB저장 실패" });
//     }

//     const { id: _, ...나머지 } = data;
//     res.json({ ...나머지 });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ 오류: "서버 오류" });
//   }
// });



const 드랍확률표 = {
  1: { 일반: 80.000, 매직: 15.000, 정교: 5.000, 레어: 0.000, 탁월: 0.000, 에픽: 0.000, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  2: { 일반: 73.500, 매직: 17.000, 정교: 8.000, 레어: 1.500, 탁월: 0.000, 에픽: 0.000, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  3: { 일반: 68.000, 매직: 20.000, 정교: 10.000, 레어: 2.000, 탁월: 0.000, 에픽: 0.000, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  4: { 일반: 60.000, 매직: 25.000, 정교: 12.300, 레어: 2.500, 탁월: 0.200, 에픽: 0.000, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  5: { 일반: 50.000, 매직: 30.000, 정교: 16.700, 레어: 3.000, 탁월: 0.300, 에픽: 0.000, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  6: { 일반: 40.000, 매직: 35.000, 정교: 20.600, 레어: 4.000, 탁월: 0.400, 에픽: 0.000, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  7: { 일반: 30.000, 매직: 40.000, 정교: 24.450, 레어: 5.000, 탁월: 0.500, 에픽: 0.050, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  8: { 일반: 20.000, 매직: 45.000, 정교: 28.320, 레어: 6.000, 탁월: 0.600, 에픽: 0.080, 레전드: 0.000, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  9: { 일반: 10.000, 매직: 40.000, 정교: 41.090, 레어: 8.000, 탁월: 0.800, 에픽: 0.100, 레전드: 0.010, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  10: { 일반: 0.000, 매직: 35.000, 정교: 53.930, 레어: 10.000, 탁월: 0.900, 에픽: 0.150, 레전드: 0.020, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  11: { 일반: 0.000, 매직: 30.000, 정교: 56.770, 레어: 12.000, 탁월: 1.000, 에픽: 0.200, 레전드: 0.030, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  12: { 일반: 0.000, 매직: 25.000, 정교: 59.210, 레어: 14.000, 탁월: 1.500, 에픽: 0.250, 레전드: 0.040, 이터널: 0.000, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  13: { 일반: 0.000, 매직: 20.000, 정교: 61.630, 레어: 16.000, 탁월: 2.000, 에픽: 0.300, 레전드: 0.060, 이터널: 0.010, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  14: { 일반: 0.000, 매직: 10.000, 정교: 69.050, 레어: 18.000, 탁월: 2.500, 에픽: 0.350, 레전드: 0.080, 이터널: 0.020, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  15: { 일반: 0.000, 매직: 0.000, 정교: 76.470, 레어: 20.000, 탁월: 3.000, 에픽: 0.400, 레전드: 0.100, 이터널: 0.030, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  16: { 일반: 0.000, 매직: 0.000, 정교: 70.310, 레어: 25.000, 탁월: 4.000, 에픽: 0.500, 레전드: 0.150, 이터널: 0.040, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  17: { 일반: 0.000, 매직: 0.000, 정교: 63.750, 레어: 30.000, 탁월: 5.000, 에픽: 1.000, 레전드: 0.200, 이터널: 0.050, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  18: { 일반: 0.000, 매직: 0.000, 정교: 55.690, 레어: 35.000, 탁월: 7.500, 에픽: 1.500, 레전드: 0.250, 이터널: 0.060, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  19: { 일반: 0.000, 매직: 0.000, 정교: 47.630, 레어: 40.000, 탁월: 10.000, 에픽: 2.000, 레전드: 0.300, 이터널: 0.070, 초월: 0.000, 골든: 0.000, 영원: 0.000 },
  20: { 일반: 0.000, 매직: 0.000, 정교: 39.505, 레어: 45.000, 탁월: 12.500, 에픽: 2.500, 레전드: 0.400, 이터널: 0.080, 초월: 0.015, 골든: 0.000, 영원: 0.000 },
  21: { 일반: 0.000, 매직: 0.000, 정교: 31.390, 레어: 50.000, 탁월: 15.000, 에픽: 3.000, 레전드: 0.500, 이터널: 0.090, 초월: 0.020, 골든: 0.000, 영원: 0.000 },
  22: { 일반: 0.000, 매직: 0.000, 정교: 23.275, 레어: 55.000, 탁월: 17.500, 에픽: 3.500, 레전드: 0.600, 이터널: 0.100, 초월: 0.025, 골든: 0.000, 영원: 0.000 },
  23: { 일반: 0.000, 매직: 0.000, 정교: 15.150, 레어: 60.000, 탁월: 20.000, 에픽: 4.000, 레전드: 0.700, 이터널: 0.120, 초월: 0.030, 골든: 0.000, 영원: 0.000 },
  24: { 일반: 0.000, 매직: 0.000, 정교: 10.000, 레어: 62.010, 탁월: 22.500, 에픽: 4.500, 레전드: 0.800, 이터널: 0.140, 초월: 0.040, 골든: 0.010, 영원: 0.000 },
  25: { 일반: 0.000, 매직: 0.000, 정교: 0.000, 레어: 68.875, 탁월: 25.000, 에픽: 5.000, 레전드: 0.900, 이터널: 0.160, 초월: 0.050, 골든: 0.015, 영원: 0.000 },
  26: { 일반: 0.000, 매직: 0.000, 정교: 0.000, 레어: 65.240, 탁월: 27.500, 에픽: 6.000, 레전드: 1.000, 이터널: 0.180, 초월: 0.060, 골든: 0.020, 영원: 0.000 },
  27: { 일반: 0.000, 매직: 0.000, 정교: 0.000, 레어: 61.505, 탁월: 30.000, 에픽: 7.000, 레전드: 1.200, 이터널: 0.200, 초월: 0.070, 골든: 0.025, 영원: 0.000 },
  28: { 일반: 0.000, 매직: 0.000, 정교: 0.000, 레어: 57.740, 탁월: 32.500, 에픽: 8.000, 레전드: 1.400, 이터널: 0.250, 초월: 0.080, 골든: 0.030, 영원: 0.000 },
  29: { 일반: 0.000, 매직: 0.000, 정교: 0.000, 레어: 53.975, 탁월: 35.000, 에픽: 9.000, 레전드: 1.600, 이터널: 0.300, 초월: 0.090, 골든: 0.035, 영원: 0.000 },
  30: { 일반: 0.000, 매직: 0.000, 정교: 0.000, 레어: 50.160, 탁월: 37.500, 에픽: 10.000, 레전드: 1.800, 이터널: 0.400, 초월: 0.100, 골든: 0.040, 영원: 0.000 },
};

const 등급순서 = [
  "일반", "매직", "정교", "레어", "탁월", "에픽", "레전드", "이터널", "초월", "골든", "영원",
];

const 드랍장비이름 = [
  "무기", "모자", "안경", "견갑", "옷", "완갑", "장갑", "벨트", "무릎아머", "신발",
];

const 장비목록 = [
  "계정", //깡스탯
  "전직", //보너스
  "무기", "모자", "안경", "견갑", "옷", "완갑", "장갑", "벨트", "무릎아머", "신발", //깡스탯
  "탈것", "장식", "동료" //보너스
];

const 특수옵션 = [
  "치명", "콤보", "반격", "스턴", "회피", "스킬치명", "회복",
];

const 특수옵션범위 = {
  일반: [0.3, 1.3],
  매직: [0.8, 1.8],
  정교: [1.3, 2.3],
  레어: [1.8, 2.8],
  탁월: [2.3, 3.3],
  에픽: [2.8, 3.8],
  레전드: [3.3, 4.3],
  이터널: [3.8, 4.8],
  초월: [4.3, 5.3],
  골든: [4.8, 5.8],
  영원: [5.3, 6.3],
};


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
    결과[옵션명] = Math.floor(합계 * 100) / 100;
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






/*

git add . && git commit -m "배포" && git push origin main

nodemon server.js

*/