# Naver Cafe Post Raffle

A Node.js CLI tool that automatically selects winners based on comments from a Naver Cafe post.  
It supports keyword filtering, minimum post count validation, and automatic pagination for posts with more than 100 comments.

---

## ✨ Features

- Input Naver Cafe post URL
- Filter commenters by **keyword inclusion** (e.g. "참여")
- **Eliminate duplicate commenters** (same nickname)
- Automatically handle **pagination** if over 100 comments
- Validate **minimum post count** from commenter profiles
- Randomly draw winners from eligible users
- Manual Naver login supported through headless browser

---

## 🧩 Stack

- Node.js
- Puppeteer
- Inquirer
- Lodash
- Chalk

---

## ⚙️ Installation

```bash
git clone https://github.com/hwanam1111/naver-cafe-post-raffle.git
cd naver-cafe-post-raffle
yarn install