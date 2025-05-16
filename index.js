const puppeteer = require('puppeteer');
const inquirer = require('inquirer').default;
const _ = require('lodash');
const chalk = require('chalk').default;

const SELECTORS = {
  commentBox: 'ul.comment_list > li.CommentItem',
  nickname: 'a.comment_nickname',
  content: 'span.text_comment',
  profileUrl: 'a.comment_thumb',
};

(async () => {
  // note: 1. 사용자 입력 받기
  const { url, keyword, winnerCount, postMin } = await inquirer.prompt([
    { name: 'url', message: '📎 게시글 URL을 입력하세요:' },
    { name: 'keyword', message: '🔍 필터링 키워드 입력 (예: 참여):' },
    { name: 'winnerCount', message: '🎁 당첨자 수:' },
    { name: 'postMin', message: '📝 최소 게시글 수:' },
  ]);

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // note: 2. 로그인
  console.log(chalk.yellow('🔐 네이버에 로그인해주세요 (5분 내 수동 로그인)'));
  await page.goto('https://nid.naver.com/nidlogin.login');
  await inquirer.prompt([{ name: 'confirm', message: '로그인 완료 후 Enter를 눌러주세요.' }]);

  // note: 3. 게시글 접속
  await page.goto(url, { waitUntil: 'networkidle2' });

  // note: 4. iframe 내부 접근
  await page.waitForSelector('iframe#cafe_main');
  const frame = await (await page.$('iframe#cafe_main')).contentFrame();
  await frame.waitForSelector(SELECTORS.commentBox);

  // note: 5. 댓글 수집
  console.log(chalk.cyan('댓글을 수집 중입니다'));
  const rawComments = await collectAllComments(frame, SELECTORS, keyword);

  // note: 6. 키워드 필터링
  const keywordFiltered = rawComments.filter(c => c.content.includes(keyword));
  const nicknameMap = new Map();
  for (const user of rawComments) {
    if (user.content.includes(keyword) && !nicknameMap.has(user.nickname)) {
      nicknameMap.set(user.nickname, user); // note: 중복 유저 제거
    }
  }
  const uniqueFilteredUsers = [...nicknameMap.values()];
  console.log(chalk.green(`\n🔍 키워드 '${keyword}' 포함 댓글 수: ${uniqueFilteredUsers.length}`));

  // note: 7. 조건 필터링
  const eligibleUsers = [];

  for (const user of keywordFiltered) {
    console.log(chalk.gray(`\n🔎 ${user.nickname} 프로필 검사 중`));

    try {
      const stats = await getUserStats(page, user.profileUrl);
      console.log(`👉 ${user.nickname} 게시글 수: ${stats.posts}`);

      if (stats.posts >= postMin) {
        eligibleUsers.push(user.nickname);
      }
    } catch (e) {
      console.log(chalk.red(`❌ ${user.nickname}의 정보를 가져오는 중 오류 발생`));
    }
  }

  // note: 8. 추첨
  if (eligibleUsers.length < winnerCount) {
    console.log(chalk.red(`❌ 조건 만족 인원 (${eligibleUsers.length}) < 당첨자 수 (${winnerCount})`));
    process.exit(1);
  }

  const winners = _.sampleSize(_.uniq(eligibleUsers), winnerCount);

  // note: 9. 결과 출력
  console.log(chalk.magenta('\n🎉 최종 당첨자 🎉'));
  winners.forEach((name, i) => console.log(`${i + 1}. ${name}`));

  await browser.close();
})();

// note: 유저 프로필에서 게시글 수 추출
async function getUserStats(page, profileUrl) {
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.info_area', { timeout: 5000 });

  const stats = await page.evaluate(() => {
    const counts = document.querySelectorAll('.info_area .count');
    let posts = 0;

    counts.forEach(span => {
      const label = span.textContent || '';
      const value = parseInt(span.querySelector('em.num')?.textContent.replace(/,/g, '') || '0', 10);
      if (label.includes('작성글')) posts = value;
    });

    return { posts };
  });

  return stats;
}

// note: 페이징 포함 모든 댓글 불러오기
async function collectAllComments(frame, SELECTORS, keyword) {
  const allCommentsMap = new Map();
  let currentPage = 1;

  while (true) {
    await frame.waitForSelector(SELECTORS.commentBox, { timeout: 5000 });

    const comments = await frame.$$eval(SELECTORS.commentBox, (boxes, selectors) => {
      return boxes.map(box => {
        const nickname = box.querySelector(selectors.nickname)?.textContent?.trim();
        const content = box.querySelector(selectors.content)?.textContent?.replace(/\n/g, ' ').trim();
        const profilePath = box.querySelector(selectors.profileUrl)?.getAttribute('href');
        return {
          nickname,
          content,
          profileUrl: profilePath ? `https://cafe.naver.com${profilePath}` : null,
        };
      }).filter(item => item.nickname && item.content && item.profileUrl);
    }, SELECTORS);

    for (const c of comments) {
      if (c.content.includes(keyword) && !allCommentsMap.has(c.nickname)) {
        allCommentsMap.set(c.nickname, c);
      }
    }

    const currentBtn = await frame.$('.ArticlePaginate .btn.number[aria-pressed="true"]');
    if (currentBtn) {
      const nextBtn = await frame.evaluateHandle(btn => btn.nextElementSibling, currentBtn);

      const isButton = await nextBtn.evaluate(el => el?.tagName === 'BUTTON');
      if (isButton) {
        currentPage++;
        console.log(chalk.gray(`➡️ 댓글 페이지 ${currentPage}로 이동 중`));
        await nextBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        break;
      }
    } else {
      break;
    }
  }


  return [...allCommentsMap.values()];
}