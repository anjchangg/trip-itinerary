# 部署指南 — 5 步驟完成

## 你需要的帳號（全部免費）
- GitHub: https://github.com
- Supabase: https://supabase.com
- Vercel: https://vercel.com

---

## 步驟 1 — 建立 GitHub Repository

1. 登入 github.com
2. 點右上角 "+" → "New repository"
3. 名稱輸入: `trip-itinerary`
4. 選 "Public"，點 "Create repository"
5. 把這個資料夾裡所有檔案上傳（拖拉到頁面即可）

---

## 步驟 2 — 設定 Supabase 資料庫

1. 登入 supabase.com → "New project"
2. 填寫名稱（例如 trip-db），設定密碼，選最近的伺服器（Asia/Singapore）
3. 等待約 1 分鐘建立完成
4. 左側選單點 "SQL Editor"
5. 把 `supabase-setup.sql` 裡的內容完整貼上，點 "Run"
6. 左側選單點 "Settings" → "API"
7. 複製以下兩個值（待會要用）：
   - Project URL（格式：https://xxxxx.supabase.co）
   - anon public key（很長的一串字）

---

## 步驟 3 — 部署到 Vercel

1. 登入 vercel.com → "Add New Project"
2. 選 "Import Git Repository" → 選你剛建立的 `trip-itinerary`
3. 在 "Environment Variables" 加入：
   - Name: `REACT_APP_SUPABASE_URL`  Value: 你的 Project URL
   - Name: `REACT_APP_SUPABASE_ANON_KEY`  Value: 你的 anon key
4. 點 "Deploy"，等待約 2 分鐘

---

## 步驟 4 — 完成！

Vercel 會給你一個網址，例如：
`https://trip-itinerary.vercel.app`

把這個網址分享給所有旅伴，大家都可以：
✅ 直接打開，不需要帳號
✅ 查看和編輯行程
✅ 看到彼此的更改（即時通知）
✅ 查看歷史紀錄和還原

---

## 步驟 5 — 告訴旅伴怎麼用

1. 第一次打開，點 "···" → 輸入自己的名字
2. 每次編輯都會自動儲存（2秒後）
3. 有人更新時，頁面頂部會出現橙色提示，點擊即可載入最新版本
4. "🕐 歷史紀錄" 可以查看所有人的更改歷史

---

## 如果遇到問題

常見問題：
- 頁面空白 → 檢查 Environment Variables 是否正確
- 資料無法儲存 → 確認 supabase-setup.sql 有正確執行
- 即時更新不工作 → 確認 Supabase 的 Realtime 功能已開啟

需要幫助可以回去問 Claude！
