# 🏏 Fantasy Cricket Project — Complete Features & Edge Cases Audit
> **Date**: September 2026  
> **Status**: Production Ready UI & Core Backend Implemented  
> **Purpose**: Ye document un sabhi missing features, business logic gaps aur critical edge cases ki complete checklist hai jo abhi project me bache hue hain ya production-level real money app ke liye zaroori hain.

---

## 📌 Table of Contents
1. [Money & Wallet (Sabse Critical — Real Cash & Transactions)](#1-money--wallet-sabse-critical)
2. [Match Lifecycle & Prize Settlement (Match aur Contest ka Khel)](#2-match-lifecycle--settlement)
3. [Team Creation & Gameplay Edge Cases](#3-team-creation--gameplay-edge-cases)
4. [Security, Fraud & Legal Compliance (Kanoon aur Security)](#4-security-fraud--legal-compliance)
5. [Real-time System, Sockets & Scaling (Speed aur Concurrency)](#5-real-time-system-sockets--scaling)
6. [User Notifications & Support (User Experience)](#6-user-notifications--support)
7. [Priority Summary (Kisko pehle karna chahiye)](#7-priority-roadmap)

---

## 1. Money & Wallet (Sabse Critical)

### 🔹 1.1 Real Payment Gateway Integration (Deposit Flow)
- **Current Status**: Abhi wallet me deposit mostly simulated/local balance update hota hai.
- **Missing Feature**:
  - Real payment gateway (jaise **Razorpay, Cashfree, PhonePe PG, ya Paytm**) ka backend integration.
  - **Webhook Verification**: Jab user UPI/Card se pay kare, toh backend pe webhook aana chahiye aur cryptographic signature verify honi chahiye taaki koi fake API hit karke balance na badha sake.
  - **Payment Status Check (Polling/Webhook Fallback)**: Agar user pay karke browser close kar de, toh server-to-server webhook se wallet auto-credit hona chahiye.

### 🔹 1.2 Real Automated Withdrawals (Payout Gateway)
- **Current Status**: Withdrawal request UI pe accept ho jati hai aur balance minus ho jata hai, par real bank me transfer ka payout API call nahi hota.
- **Missing Feature**:
  - Cashfree Payouts / RazorpayX Payout API integrate karna jo user ke UPI ID ya IMPS bank account me instantly real cash bhej sake.
  - **Reverse on Failure**: Agar bank server down ho aur payout fail ho jaye, toh deducted balance turant user ke wallet me auto-refund hona chahiye.

### 🔹 1.3 Concurrency & Double-Deduction (Race Condition Edge Case)
- **Problem**: Agar user ka internet slow hai ya wo "Join Contest" ya "Withdraw" button pe 2-3 baar lagatar click kar de:
  - Kya backend pe do baar paise cut jayenge?
  - Ya user ke paas ₹50 the aur usne 2 tabs se ek sath ₹50-₹50 ke do contest join kar liye?
- **Solution Needed**:
  - **Idempotency Key**: Har transaction ya join request ke sath ek unique UUID bhej kar duplicate request block karna.
  - **MongoDB Atomic Operations**: Balance check aur deduct ek hi atomic `$inc` query ya transaction session me karna (`depositedBalance: { $gte: amount }`).

### 🔹 1.4 Proper Ledger / Transaction History Table
- **Current Status**: `User` model me direct `walletBalance`, `depositedBalance`, `winningsBalance`, `bonusBalance` numbers hain.
- **Missing Feature**:
  - Ek dedicated `Transaction` model jisme ek-ek paise ka record ho:
    - Transaction ID
    - Type (`DEPOSIT`, `WITHDRAWAL`, `CONTEST_FEE`, `CONTEST_WINNING`, `BONUS_CREDIT`, `REFUND`)
    - Opening Balance & Closing Balance
    - Reference ID (Contest ID, Match ID, PG Order ID)
    - Status (`SUCCESS`, `PENDING`, `FAILED`, `REFUNDED`)

### 🔹 1.5 KYC Verification (Legal Requirement in India)
- **Rule**: India me kisi bhi user ko cash withdraw karne se pehle KYC zaroori hoti hai.
- **Missing Feature**:
  - **PAN Card Verification**: User ka PAN number aur Name verify karna.
  - **Bank Account / UPI Name Matching**: Bank account ka naam user ke verified PAN card ke naam se 100% match hona chahiye taaki koi dusre ke account me paise na nikal sake.

### 🔹 1.6 TDS (Tax Deducted at Source) & GST Logic
- **TDS (Section 194BA)**: Financial year me net winnings pe 30% TDS deduct hota hai withdraw karte waqt. Abhi direct bina TDS ke withdrawal amount calculate hota hai.
- **GST (28% on Deposits)**: Real money fantasy sports me 28% GST rule follow karna hota hai invoice generation ke sath.

### 🔹 1.7 Bonus Expiry & Usage Cap
- **Edge Case**: Kya user pura entry fee ₹100 Cash Bonus se de sakta hai?
  - Real fantasy apps me rule hota hai: Ek contest me max 10% ya 15% hi Cash Bonus use ho sakta hai, baki Real Deposit ya Winnings se aana chahiye (warna company loss me chali jayegi).
  - Bonus ki expiry date (e.g., 30 din baad expire hona).

---

## 2. Match Lifecycle & Settlement

### 🔹 2.1 Abandoned / Rain Washed Out Matches (100% Auto-Refund)
- **Edge Case**: Agar baarish ho gayi ya match bina ek bhi ball feke cancel ho gaya:
  - Users ka entry fee automatically 100% refund hona chahiye.
  - Jis source se paise kate the (Deposited ya Bonus), usi me wapas credit hona chahiye.
  - Contest status `CANCELLED` mark hona chahiye aur sabhi entries `REFUNDED`.

### 🔹 2.2 Tie-Breaker & Prize Pool Splitting
- **Edge Case**: Agar Contest me Rank 1 pe 2 users ke identical points (e.g. 450 pts) aa gaye:
  - Rank 1 ka prize tha ₹10,000 aur Rank 2 ka tha ₹5,000.
  - Dono ko barabar divide hona chahiye: `(10000 + 5000) / 2 = ₹7,500` each.
  - Agla user Rank 3 count hoga aur use Rank 3 ka prize milega.
  - Abhi project me automated rank tie-splitting logic bacha hua hai.

### 🔹 2.3 Non-Guaranteed Contests & Minimum Fill Rule
- **Scenario**: Agar kisi contest me 100 spots the aur prize pool ₹5,000 tha, par sirf 4 users ne join kiya:
  - **Guaranteed Contest**: Chahe 4 log join kare, company pure ₹5,000 distribute karegi.
  - **Flexible / Non-Guaranteed Contest**: Agar minimum 60% spots nahi bhare, toh contest cancel ho kar sabko refund ho jana chahiye.

### 🔹 2.4 Strict Match Deadline Lock (1-Second Accuracy)
- **Edge Case**: Toss hone ke baad ya match ki 1st ball fekte hi:
  - Ek second ke andar bhi koi team create, edit ya contest join NAHI kar sake.
  - Server time (`NTP sync`) use hona chahiye, user ke mobile/device ka clock nahi (warna user phone ka time peeche karke team edit kar lega).

### 🔹 2.5 Score Corrections & Recalculation by Cricket Provider
- **Edge Case**: Kabhi-kabhi official cricket board 15-20 minute baad score revise karta hai (jaise pehle 4 run diya tha fir use leg-bye kar diya, ya catch bowler ke naam tha par fielder ne pakda tha):
  - Backend me `recalculateLeaderboard(matchId)` ki capability honi chahiye jo points adjust karke final rank update kare, tabhi prize distribute ho.

### 🔹 2.6 Super Over & DLS Scoring Rules
- **Official Fantasy Rule**: Super Over me banaye gaye runs, wickets ya catches fantasy points me COUNT NAHI HOTE.
- DLS (Duckworth-Lewis) match me revised target ke time economy rate ka calculation revised overs ke hisaab se hona chahiye.

---

## 3. Team Creation & Gameplay Edge Cases

### 🔹 3.1 Playing XI & Lineup Out Indicators
- **Missing Feature**:
  - Match se 30 minute pehle jab Toss hota hai, tab official Playing XI aati hai.
  - UI me har player ke aage **Green Dot (Playing)** ya **Red Dot (Benched / Not in XI)** aana chahiye.
  - Jo users ne pehle se team banayi thi unhe alert notification jaye: *"Lineups Out! Aapke 2 players nahi khel rahe, abhi replace karein!"*

### 🔹 3.2 Multi-Team Entries (Team 1, Team 2... Team 20)
- **Current Status**: User ek match ke liye team banata hai.
- **Edge Case / Feature**:
  - Mega contests me log 10 se 20 team banate hain alag-alag captain ke sath.
  - User ko ek hi match me multiple teams (`Team 1`, `Team 2`, `Team 3`) banane aur unhe alag-alag contests me join karne ka feature chahiye.

### 🔹 3.3 Team Switch / Swap Feature Before Match Start
- **User Pain Point**: User ne subah Team 1 se contest join kiya. Sham ko usne Team 2 banayi jo better hai.
- **Feature**: Bina extra paise diye, contest ke andar assigned team ko Team 1 se badal kar Team 2 karne ka "Switch Team" option match deadline se pehle milna chahiye.

### 🔹 3.4 Impact Player Rule (IPL Specific)
- IPL me 11 players ke alawa 1 Impact Player match ke dauran ground pe aata hai.
- Agar kisi user ne Impact Player ko apni fantasy team me le rakha hai, toh jab wo batting/bowling karne aaye, tabhi se uske fantasy points count shuru hone chahiye.

---

## 4. Security, Fraud & Legal Compliance

### 🔹 4.1 Geo-Fencing & Banned States Blocking
- **Legal Rule in India**: Kuch states me real money fantasy gaming par local laws ke tahat pabandi hai:
  - **Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, Sikkim**.
- **Missing Feature**:
  - IP-based location detection ya OTP/Address verification ke waqt user ka state verify karna.
  - Banned states ke users ko practice/free contests khelne dena par Real Cash deposits & contests se block karna.

### 🔹 4.2 Age Restriction (18+ Verification)
- 18 saal se kam umar ke users real cash nahi khel sakte.
- Registration aur First Deposit pe mandatory Date of Birth / Aadhaar / PAN validation hona chahiye.

### 🔹 4.3 Multi-Accounting & Bonus Abuse Prevention
- **Edge Case**: Ek hi user 10 fake numbers ya emails se account banakar har baar ₹100 Welcome Bonus le leta hai aur aapas me Head-to-Head match khelkar bonus ko winning cash bana kar withdraw kar leta hai.
- **Solution Needed**:
  - **Device Fingerprinting**: Browser fingerprint / device ID track karna.
  - **Bank/UPI Duplicate Check**: Ek UPI ID ya Bank Account sirf ek hi user profile pe bind hona chahiye.

---

## 5. Real-Time System, Sockets & Scaling

### 🔹 5.1 Mobile Reconnection & Socket Drop Resilience
- **Edge Case**: Mobile users car/train me hote hain ya network switch hota hai (Wi-Fi to 4G):
  - WebSocket disconnect hone par jab app wapas reconnect ho, toh miss hue ball-by-ball points aur leaderboard snapshot turant silently sync ho jana chahiye.
  - Browser tab background me jane par battery saver socket band kar deta hai (`visibilitychange` event pe re-fetch trigger karna).

### 🔹 5.2 Multi-Instance Scaling (Socket.io Redis Adapter)
- **Backend Edge Case**: Abhi socket single Node.js process me memory me chal raha hai.
- Jab 10,000+ live users aayenge aur EC2 pe 2 ya 3 Docker containers chalenge:
  - Agar User A container 1 pe connected hai aur ball update container 2 pe aayi, toh User A ko score nahi milega jab tak **Redis Pub/Sub Socket Adapter** na laga ho.

---

## 6. User Notifications & Support

### 🔹 6.1 Transaction & Match Alerts
- **Missing**:
  - Deposit successful hone pe Email / SMS receipt.
  - Withdrawal dispatch hone pe Bank UTR number ke sath message.
  - Contest khatam hone pe: *"Congratulations! Aapne Rank 14 achieve karke ₹1,200 jeete!"*

### 🔹 6.2 Customer Support Ticket System
- Agar kisi user ka withdrawal atak gaya ya match points galat dikhe:
  - In-app Support Chat ya Ticket status tracking system jaha admin backend se resolve kar sake.

---

## 7. Priority Roadmap (Kisko Kab Karna Chahiye)

| Priority | Feature / Edge Case | Kyun Zaroori Hai? |
| :--- | :--- | :--- |
| 🔴 **P0 (Must Have)** | **Real Payment Gateway & Webhook (Deposit)** | Bina iske real user paise deposit nahi kar sakta. |
| 🔴 **P0 (Must Have)** | **Contest Settle & Auto-Refund on Abandonment** | Baarish hone par paise phas jayenge agar refund logic na ho. |
| 🔴 **P0 (Must Have)** | **Concurrency Lock on Wallet & Join Contest** | Double deduction ya balance glitch se company ka loss rokne ke liye. |
| 🟡 **P1 (High)** | **KYC & Bank/UPI Match on Withdrawal** | Bina iske payout legal risk aur fraud me pad sakta hai. |
| 🟡 **P1 (High)** | **Toss Playing XI Indicators (Green/Red Dots)** | User experience ke liye sabse important cricket feature. |
| 🟡 **P1 (High)** | **Tie-Breaker Prize Splitting** | Jab 2 logo ke same points ho tab dispute na ho. |
| 🟢 **P2 (Medium)** | **Multi-Team Entry (Team 1, Team 2) & Swap** | User engagement aur mega contest me multiple entries badhane ke liye. |
| 🟢 **P2 (Medium)** | **Geo-fencing for Restricted States (Assam, etc.)** | Indian gaming compliance ke liye. |
| 🟢 **P2 (Medium)** | **Push Notifications & Automated Emails** | User retention aur match reminders ke liye. |

---
*Ye file aapke codebase me reference ke liye create kar di gayi hai: `PROJECT_FEATURES_AND_EDGE_CASES_AUDIT.md`.*
