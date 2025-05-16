# 🧧 Naver Cafe Raffle Tool

네이버 카페 게시글 댓글을 기반으로 당첨자를 자동 추첨하는 CLI 도구입니다.  
특정 키워드 필터, 게시글 수 조건, 페이징 댓글까지 지원합니다.


## Feature

- 네이버 카페 게시글 URL 입력
- 댓글에서 **특정 키워드 포함 여부** 필터링 (ex. "참여")
- **중복 닉네임 제거**
- 댓글이 100개 이상일 경우 자동 **페이징 처리**
- 댓글 작성자의 **게시글 수 조건** 필터링
- 조건을 만족하는 사용자 중 무작위 추첨
- 수동 로그인 방식 지원


## Stack

- Node.js
- Puppeteer
- Inquirer
- Lodash
- Chalk


## Install

```bash
git clone https://github.com/your-username/naver-cafe-raffle.git
cd naver-cafe-raffle
yarn install
