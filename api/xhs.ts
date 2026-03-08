import type { VercelRequest, VercelResponse } from "@vercel/node";

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>XHS Vibe Coding 日记卡片 — 沙发警察</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=Noto+Sans+SC:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg:   #f0ebe4;
      --bg2:  #e7e0d6;
      --card: #f6f2ec;
      --t1:   #2e2b26;
      --t2:   #6d665c;
      --t3:   #a69e94;
      --g1:   #5e7050;
      --g2:   #7a9469;
      --line: #d4ccc2;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #d4ccc2;
      font-family: 'Noto Sans SC', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      padding: 40px 20px;
    }

    .card {
      width: 390px;
      height: 553px;
      border-radius: 2px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    }

    .card-body {
      flex: 1;
      padding: 40px 32px 20px;
      display: flex;
      flex-direction: column;
    }

    .card-footer {
      padding: 14px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      color: var(--t3);
      letter-spacing: 0.5px;
    }

    .display { font-family: 'Fraunces', serif; color: var(--t1); }
    .label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--t3); }
    .body-text { font-family: 'Noto Sans SC', sans-serif; font-size: 14px; line-height: 1.8; color: var(--t2); }
    .quote { font-family: 'Fraunces', serif; font-style: italic; font-size: 15px; color: var(--g1); line-height: 1.6; }
    .divider { width: 32px; height: 1px; background: var(--line); margin: 16px 0; }

    .card-01 { background: var(--bg); }
    .card-01 .card-body { justify-content: center; gap: 20px; }
    .card-01 .cover-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--g1); }
    .card-01 .cover-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 500; line-height: 1.4; color: var(--t1); }
    .card-01 .cover-subtitle { font-size: 13px; line-height: 1.7; color: var(--t2); }
    .card-01 .cover-subject { margin-top: auto; padding-top: 24px; border-top: 1px solid var(--line); }
    .card-01 .cover-subject .label { margin-bottom: 4px; }
    .card-01 .cover-subject-name { font-family: 'Fraunces', serif; font-size: 16px; color: var(--t1); }

    .card-02 { background: var(--card); }
    .card-02 .card-body { gap: 16px; }
    .card-02 .story-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500; color: var(--t1); line-height: 1.4; }
    .card-02 .story-quote { padding-left: 16px; border-left: 2px solid var(--g1); }
    .card-02 .story-reason { margin-top: auto; padding: 14px 16px; background: var(--bg); border-radius: 8px; font-size: 13px; color: var(--t2); line-height: 1.7; }

    .card-03 { background: var(--bg2); }
    .card-03 .card-body { gap: 12px; }
    .card-03 .tools-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500; color: var(--t1); margin-bottom: 4px; }
    .tool-item { padding: 16px; background: var(--card); border-radius: 10px; display: flex; align-items: flex-start; gap: 14px; }
    .tool-icon { width: 36px; height: 36px; border-radius: 8px; background: var(--bg); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .tool-name { font-size: 14px; font-weight: 500; color: var(--t1); margin-bottom: 2px; }
    .tool-desc { font-size: 12px; color: var(--t2); line-height: 1.6; }

    .card-04 { background: var(--card); }
    .card-04 .card-body { gap: 16px; }
    .card-04 .how-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500; color: var(--t1); line-height: 1.4; }
    .step-list { display: flex; flex-direction: column; gap: 0; margin-top: 4px; }
    .step-item { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--line); }
    .step-item:last-child { border-bottom: none; }
    .step-num { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; color: var(--g1); line-height: 1; min-width: 24px; padding-top: 2px; }
    .step-text { font-size: 14px; color: var(--t1); line-height: 1.5; flex: 1; }
    .step-check { color: var(--g2); font-size: 14px; flex-shrink: 0; padding-top: 2px; }

    .card-05 { background: var(--bg); }
    .card-05 .card-body { gap: 16px; }
    .card-05 .result-title { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500; color: var(--t1); line-height: 1.4; }
    .result-story { font-size: 14px; color: var(--t2); line-height: 1.8; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .stat-box { padding: 16px 12px; background: var(--card); border-radius: 10px; text-align: center; }
    .stat-num { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 500; color: var(--g1); line-height: 1.2; }
    .stat-label { font-size: 11px; color: var(--t3); margin-top: 4px; }
    .result-quote { margin-top: auto; padding-left: 16px; border-left: 2px solid var(--g1); }

    .card-06 { background: var(--bg2); }
    .card-06 .card-body { justify-content: center; gap: 20px; }
    .card-06 .ending-msg { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 500; color: var(--t1); line-height: 1.5; }
    .card-06 .ending-tools { padding: 16px; background: var(--card); border-radius: 10px; }
    .card-06 .ending-tools-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--t3); margin-bottom: 10px; }
    .card-06 .ending-tools-list { font-size: 13px; color: var(--t2); line-height: 2; }
    .card-06 .ending-next { padding: 14px 16px; border: 1px dashed var(--line); border-radius: 8px; font-size: 13px; color: var(--t2); line-height: 1.7; }
    .card-06 .ending-cta { margin-top: auto; text-align: center; }
    .card-06 .ending-follow { display: inline-block; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 1px; color: var(--g1); border: 1.5px solid var(--g1); border-radius: 20px; padding: 8px 24px; }

    @media print {
      body { background: white; gap: 0; padding: 0; }
      .card { break-inside: avoid; page-break-after: always; box-shadow: none; }
    }
  </style>
</head>
<body>

  <div class="card card-01">
    <div class="card-body">
      <div class="cover-label">vibe coding 日记</div>
      <h1 class="cover-title">小猫趁我上班偷上沙发，我 vibe 了一个「沙发警察」？</h1>
      <p class="cover-subtitle">不会写代码没关系——我也是边问 AI 边做出来的。整个过程就像跟一个很懂技术的朋友聊天，说清楚你想要什么，它就帮你写好了。</p>
      <div class="cover-subject">
        <div class="label">今日主角</div>
        <div class="cover-subject-name">一只总趁人不在家偷上沙发的猫 🐱</div>
      </div>
    </div>
    <div class="card-footer"><span>ning.codes</span><span>01/06</span></div>
  </div>

  <div class="card card-02">
    <div class="card-body">
      <div class="label">起因</div>
      <h2 class="story-title">每次回家，沙发上全是猫毛，坐垫都歪了</h2>
      <div class="divider"></div>
      <p class="body-text">我家猫特别精——人在的时候绝对不上沙发，但只要我一出门，它就把沙发当自己的床。每天下班回来，一屁股坐下去，满裤子猫毛。说了它几百次也没用，因为每次都是「事后发现」，它早就跳走装无辜了。</p>
      <div class="story-quote"><p class="quote">"问题不是猫不听话，是我不在的时候没人管它。"</p></div>
      <div class="story-reason">\u{1F4A1} 买过普通摄像头，但只能录像回看。我需要的是「发现它上沙发的那一秒就吓它走」，市面上没有这种东西。</div>
    </div>
    <div class="card-footer"><span>ning.codes</span><span>02/06</span></div>
  </div>

  <div class="card card-03">
    <div class="card-body">
      <div class="label">工具箱</div>
      <h2 class="tools-title">我用了这三样东西</h2>
      <div class="tool-item">
        <div class="tool-icon">\u{1F4F7}</div>
        <div><div class="tool-name">一颗会认猫的小摄像头</div><div class="tool-desc">不用联网就能自己判断画面里有没有猫，像一只永远不眨眼的电子眼。猫的照片一张都不会传到网上。</div></div>
      </div>
      <div class="tool-item">
        <div class="tool-icon">\u{1F9E0}</div>
        <div><div class="tool-name">一个会看图说话的 AI</div><div class="tool-desc">摄像头发现猫之后，AI 会帮忙看一眼：这猫是在地上走过，还是已经赖在沙发上了？</div></div>
      </div>
      <div class="tool-item">
        <div class="tool-icon">\u{1F5A5}\u{FE0F}</div>
        <div><div class="tool-name">一个手机能看的监控页面</div><div class="tool-desc">随时打开就能看到家里的实时画面，每次猫被抓到的截图和记录都在上面。</div></div>
      </div>
    </div>
    <div class="card-footer"><span>ning.codes</span><span>03/06</span></div>
  </div>

  <div class="card card-04">
    <div class="card-body">
      <div class="label">怎么运作</div>
      <h2 class="how-title">就像请了一个永不睡觉的保安</h2>
      <div class="divider"></div>
      <div class="step-list">
        <div class="step-item"><span class="step-num">1</span><span class="step-text">摄像头 24 小时盯着沙发</span><span class="step-check">\u2713</span></div>
        <div class="step-item"><span class="step-num">2</span><span class="step-text">发现猫 \u2192 AI 判断在不在沙发上</span><span class="step-check">\u2713</span></div>
        <div class="step-item"><span class="step-num">3</span><span class="step-text">确认在沙发 \u2192 自动播放声音吓它走</span><span class="step-check">\u2713</span></div>
        <div class="step-item"><span class="step-num">4</span><span class="step-text">同时手机收到通知 + 抓拍存档</span><span class="step-check">\u2713</span></div>
      </div>
    </div>
    <div class="card-footer"><span>ning.codes</span><span>04/06</span></div>
  </div>

  <div class="card card-05">
    <div class="card-body">
      <div class="label">效果</div>
      <h2 class="result-title">第一次成功的时候</h2>
      <p class="result-story">一个周三下午，我在公司突然收到消息：「猫在沙发上」。打开手机一看直播画面——它正趴在我最贵的那个靠垫上。几秒后声音自动响了，它嗖一下跳走了。我在工位上差点笑出声。</p>
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-num">3h</div><div class="stat-label">从零到上线</div></div>
        <div class="stat-box"><div class="stat-num">\u22480</div><div class="stat-label">每月运行费</div></div>
        <div class="stat-box"><div class="stat-num">24h</div><div class="stat-label">全天候巡逻</div></div>
      </div>
      <div class="result-quote"><p class="quote">"最爽的不是技术多牛，是终于能在上班的时候管到家里的猫了。"</p></div>
    </div>
    <div class="card-footer"><span>ning.codes</span><span>05/06</span></div>
  </div>

  <div class="card card-06">
    <div class="card-body">
      <div class="label">最后</div>
      <p class="ending-msg">不会写代码？<br/>没关系。我也是一边跟 AI 聊天，一边把这个东西搭出来的。</p>
      <div class="ending-tools">
        <div class="ending-tools-title">本期工具</div>
        <div class="ending-tools-list">\u2726 Claude \u2014 帮我写所有代码的 AI 助手<br/>\u2726 树莓派 + 小摄像头 \u2014 一台巴掌大的小电脑<br/>\u2726 Vercel \u2014 免费把页面放到网上</div>
      </div>
      <div class="ending-next">\u{1F440} 下期预告：怎么让它学会认不同的猫，只吓那只爱上沙发的？</div>
      <div class="ending-cta"><span class="ending-follow">关注 ning.codes \u2192</span></div>
    </div>
    <div class="card-footer"><span>ning.codes</span><span>06/06</span></div>
  </div>

</body>
</html>`;

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(html);
}
