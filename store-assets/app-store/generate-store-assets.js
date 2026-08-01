const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..", "..");
const outRoot = path.resolve(__dirname);
const iosDir = path.join(outRoot, "screenshots", "ios");
const htmlDir = path.join(outRoot, ".generated-html");
const chromePath = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((candidate) => fs.existsSync(candidate));

if (!chromePath) {
  throw new Error("Chrome or Edge was not found. Install Chrome or Edge to generate PNG screenshots.");
}

fs.mkdirSync(iosDir, { recursive: true });
fs.mkdirSync(htmlDir, { recursive: true });

const iconSource = path.join(root, "assets", "icon.png");
const iconTarget = path.join(outRoot, "icon-1024.png");
fs.copyFileSync(iconSource, iconTarget);

const green = "#168a43";
const dark = "#102018";
const muted = "#68756c";
const bg = "#f3f7f3";
const border = "#dce6de";
const pale = "#e8f7ee";

function money(value) {
  return `<span class="money">${value}</span>`;
}

function tab(label, active = false) {
  return `<div class="tab ${active ? "active" : ""}"><span>${label.icon}</span><b>${label.text}</b></div>`;
}

const tabs = [
  { icon: "⌂", text: "Home" },
  { icon: "▥", text: "Reports" },
  { icon: "◫", text: "Months" },
  { icon: "▣", text: "Products" },
  { icon: "⚙", text: "Settings" },
];

function shell({ title, subtitle, active = 0, body }) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=1242,height=2688,initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    width: 1242px;
    height: 2688px;
    margin: 0;
    overflow: hidden;
    background: ${bg};
    color: ${dark};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  }
  .poster {
    width: 100%;
    height: 100%;
    padding: 94px 70px 86px;
    display: flex;
    flex-direction: column;
    gap: 38px;
  }
  .hero {
    text-align: center;
    padding: 14px 24px 4px;
  }
  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    margin-bottom: 26px;
  }
  .mark {
    width: 74px;
    height: 74px;
    border-radius: 24px;
    background: ${green};
    color: white;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 34px;
    box-shadow: 0 18px 38px rgba(22, 138, 67, 0.25);
  }
  .brand-name {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: 0;
  }
  h1 {
    margin: 0;
    font-size: 86px;
    line-height: 0.98;
    letter-spacing: 0;
  }
  .subtitle {
    margin: 28px auto 0;
    max-width: 850px;
    color: ${muted};
    font-size: 34px;
    line-height: 1.25;
    font-weight: 650;
  }
  .phone {
    width: 100%;
    flex: 1;
    background: #fbfdfb;
    border: 1px solid ${border};
    border-radius: 44px;
    padding: 46px 46px 120px;
    position: relative;
    box-shadow: 0 34px 90px rgba(16, 32, 24, 0.12);
    overflow: hidden;
  }
  .phone-title {
    text-align: center;
    margin-bottom: 34px;
  }
  .phone-title h2 {
    margin: 0;
    font-size: 52px;
    line-height: 1.05;
    font-weight: 900;
  }
  .phone-title p {
    margin: 8px 0 0;
    color: ${muted};
    font-size: 25px;
    font-weight: 650;
  }
  .grid { display: grid; gap: 22px; }
  .two { grid-template-columns: 1fr 1fr; }
  .card {
    background: white;
    border: 1px solid ${border};
    border-radius: 22px;
    padding: 30px;
    box-shadow: 0 8px 26px rgba(16, 32, 24, 0.04);
  }
  .soft { background: ${pale}; border-color: #cbeed9; }
  .label {
    color: ${green};
    text-transform: uppercase;
    font-weight: 900;
    font-size: 22px;
    letter-spacing: 0.04em;
  }
  .big {
    margin-top: 14px;
    font-size: 72px;
    line-height: 1;
    font-weight: 900;
  }
  .money { color: ${green}; font-weight: 900; }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 24px 0;
    border-bottom: 1px solid #edf1ed;
  }
  .row:last-child { border-bottom: 0; }
  .row h3 {
    margin: 0 0 7px;
    font-size: 29px;
    line-height: 1.12;
  }
  .row p {
    margin: 0;
    color: ${muted};
    font-size: 23px;
    font-weight: 650;
  }
  .amount {
    font-size: 32px;
    font-weight: 900;
    white-space: nowrap;
  }
  .button {
    background: ${green};
    color: white;
    border-radius: 19px;
    padding: 26px 30px;
    text-align: center;
    font-size: 30px;
    font-weight: 900;
  }
  .outline {
    background: white;
    color: ${green};
    border: 2px solid ${green};
  }
  .bottom-tabs {
    position: absolute;
    left: 28px;
    right: 28px;
    bottom: 24px;
    height: 92px;
    background: white;
    border: 1px solid ${border};
    border-radius: 24px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 10px;
    gap: 8px;
    box-shadow: 0 22px 60px rgba(16, 32, 24, 0.14);
  }
  .tab {
    border-radius: 17px;
    display: grid;
    place-items: center;
    color: ${muted};
    font-size: 17px;
    font-weight: 850;
    line-height: 1;
  }
  .tab span { font-size: 18px; }
  .tab.active {
    background: ${green};
    color: white;
  }
  .receipt {
    height: 620px;
    border-radius: 22px;
    background:
      linear-gradient(90deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 100%),
      linear-gradient(180deg, #fff, #f5f1e8);
    background-size: 100% 100%, 100% 100%;
    border: 1px solid #e4ded0;
    padding: 45px 58px;
    color: #29352e;
    font-family: "Courier New", monospace;
    box-shadow: inset 0 -18px 50px rgba(0,0,0,0.05);
  }
  .receipt h3 { text-align: center; font-size: 31px; margin: 0 0 22px; }
  .receipt .line { display:flex; justify-content:space-between; font-size:24px; border-bottom:1px dashed #9fa89f; padding:13px 0; }
  .bar { height: 18px; border-radius: 99px; background: #e8eee9; overflow: hidden; }
  .fill { height: 100%; border-radius: 99px; background: ${green}; }
  .pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 12px 20px;
    background: ${pale};
    color: ${green};
    font-size: 22px;
    font-weight: 900;
  }
</style>
</head>
<body>
  <div class="poster">
    <section class="hero">
      <div class="brand"><div class="mark">R</div><div class="brand-name">Reciro</div></div>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
    </section>
    <section class="phone">
      ${body}
      <nav class="bottom-tabs">${tabs.map((t, i) => tab(t, i === active)).join("")}</nav>
    </section>
  </div>
</body>
</html>`;
}

const screens = [
  {
    file: "01-home.png",
    title: "See your spending clearly",
    subtitle: "Scan receipts, track totals, and keep every purchase organized.",
    active: 0,
    body: `
      <div class="phone-title"><h2>Dashboard</h2><p>Scan. Save. Simplify.</p></div>
      <div class="grid">
        <div class="card soft" style="text-align:center">
          <div class="label">This month</div>
          <div class="big">€246.80</div>
          <p style="font-size:25px;color:${muted};font-weight:700">Highest spending: Groceries</p>
        </div>
        <div class="grid two">
          <div class="card"><div class="label">Receipts</div><div class="big" style="font-size:50px">12</div></div>
          <div class="card"><div class="label">Top store</div><div class="big" style="font-size:43px">Green Market</div></div>
        </div>
        <div class="card">
          <div class="row"><div><h3>Green Market</h3><p>Groceries - today</p></div><div class="amount">€42.80</div></div>
          <div class="row"><div><h3>City Fuel</h3><p>Fuel - yesterday</p></div><div class="amount">€58.20</div></div>
          <div class="row"><div><h3>Metro</h3><p>Transport - 13.07.2026</p></div><div class="amount">€12.40</div></div>
        </div>
        <div class="button">Add Receipt</div>
      </div>`,
  },
  {
    file: "02-add-receipt.png",
    title: "Add a receipt in seconds",
    subtitle: "Camera, gallery, or PDF. Reciro starts the analysis right away.",
    active: 0,
    body: `
      <div class="phone-title"><h2>Add Receipt</h2><p>Choose a source and let AI fill the details.</p></div>
      <div class="grid">
        <div class="card soft" style="text-align:center;padding:64px 40px">
          <div class="pill">AI ready</div>
          <h3 style="font-size:44px;margin:28px 0 12px">No receipt selected</h3>
          <p style="font-size:27px;color:${muted};font-weight:700">Take a photo or pick an existing file.</p>
        </div>
        <div class="grid two">
          <div class="card"><h3 style="font-size:34px;margin:0">Camera</h3><p style="font-size:24px;color:${muted}">Scan paper receipts</p></div>
          <div class="card"><h3 style="font-size:34px;margin:0">Gallery</h3><p style="font-size:24px;color:${muted}">Import saved photos</p></div>
        </div>
        <div class="card"><h3 style="font-size:34px;margin:0">PDF upload</h3><p style="font-size:24px;color:${muted}">Save invoices and fill details manually when needed.</p></div>
        <div class="button">Add Receipt Photo</div>
      </div>`,
  },
  {
    file: "03-ai-review.png",
    title: "Review AI results before saving",
    subtitle: "Check the store, total, category, and products before they enter your reports.",
    active: 0,
    body: `
      <div class="phone-title"><h2>Review Receipt</h2><p>Analysis confidence: 94%</p></div>
      <div class="grid">
        <div class="receipt">
          <h3>GREEN MARKET</h3>
          <div class="line"><span>Water x6</span><span>3.60</span></div>
          <div class="line"><span>Bread x2</span><span>2.40</span></div>
          <div class="line"><span>Chicken 1kg</span><span>9.80</span></div>
          <div class="line"><span>Tomatoes</span><span>4.50</span></div>
          <div class="line"><b>TOTAL</b><b>42.80 EUR</b></div>
        </div>
        <div class="card">
          <div class="row"><div><h3>Store</h3><p>Editable</p></div><div class="amount">Green Market</div></div>
          <div class="row"><div><h3>Total</h3><p>From receipt</p></div><div class="amount">€42.80</div></div>
          <div class="row"><div><h3>Category</h3><p>Detected automatically</p></div><div class="amount">Groceries</div></div>
        </div>
        <div class="button">Confirm and Save</div>
      </div>`,
  },
  {
    file: "04-detail.png",
    title: "Keep every receipt in one place",
    subtitle: "Open the original receipt anytime and edit details when needed.",
    active: 1,
    body: `
      <div class="phone-title"><h2>13.07.2026</h2><p>Green Market</p></div>
      <div class="grid">
        <div class="receipt" style="height:700px">
          <h3>GREEN MARKET</h3>
          <div class="line"><span>Date</span><span>13/07/2026</span></div>
          <div class="line"><span>Ticket</span><span>294183</span></div>
          <div class="line"><span>Water</span><span>3.60</span></div>
          <div class="line"><span>Bread</span><span>2.40</span></div>
          <div class="line"><span>Chicken</span><span>9.80</span></div>
          <div class="line"><b>Total</b><b>42.80 EUR</b></div>
        </div>
        <div class="card">
          <div class="row"><div><h3>Total</h3></div><div class="amount">€42.80</div></div>
          <div class="row"><div><h3>Category</h3></div><div class="amount">Groceries</div></div>
          <div class="row"><div><h3>Products</h3></div><div class="amount">5</div></div>
        </div>
        <div class="button outline">Edit Receipt</div>
      </div>`,
  },
  {
    file: "05-reports.png",
    title: "Understand where money goes",
    subtitle: "Category and store reports make monthly spending easy to read.",
    active: 1,
    body: `
      <div class="phone-title"><h2>Reports</h2><p>This month</p></div>
      <div class="grid">
        <div class="card soft" style="text-align:center">
          <div class="label">Total spending</div>
          <div class="big">€246.80</div>
        </div>
        <div class="card">
          <div class="row"><div><h3>Groceries</h3><p>47% of spending</p></div><div class="amount">€116.40</div></div>
          <div class="bar"><div class="fill" style="width:72%"></div></div>
          <div class="row"><div><h3>Fuel</h3><p>23% of spending</p></div><div class="amount">€58.20</div></div>
          <div class="bar"><div class="fill" style="width:38%"></div></div>
          <div class="row"><div><h3>Transport</h3><p>11% of spending</p></div><div class="amount">€27.10</div></div>
          <div class="bar"><div class="fill" style="width:22%"></div></div>
        </div>
        <div class="card">
          <div class="row"><div><h3>Green Market</h3><p>4 receipts</p></div><div class="amount">${money("€116.40")}</div></div>
          <div class="row"><div><h3>City Fuel</h3><p>1 receipt</p></div><div class="amount">${money("€58.20")}</div></div>
        </div>
      </div>`,
  },
  {
    file: "06-months.png",
    title: "Browse receipts by month",
    subtitle: "Receipts are sorted by the date printed on the receipt.",
    active: 2,
    body: `
      <div class="phone-title"><h2>Monthly Receipts</h2><p>Choose a month to see every receipt.</p></div>
      <div class="grid">
        <div class="card soft">
          <div class="row"><div><h3>July 2026</h3><p>12 receipts</p></div><div class="amount">€246.80</div></div>
        </div>
        <div class="card">
          <div class="row"><div><h3>June 2026</h3><p>9 receipts</p></div><div class="amount">€188.20</div></div>
          <div class="row"><div><h3>May 2026</h3><p>14 receipts</p></div><div class="amount">€312.45</div></div>
          <div class="row"><div><h3>April 2026</h3><p>8 receipts</p></div><div class="amount">€174.90</div></div>
        </div>
        <div class="card">
          <div class="row"><div><h3>13.07.2026 - Green Market</h3><p>Groceries</p></div><div class="amount">€42.80</div></div>
          <div class="row"><div><h3>12.07.2026 - City Fuel</h3><p>Fuel</p></div><div class="amount">€58.20</div></div>
        </div>
      </div>`,
  },
  {
    file: "07-products.png",
    title: "See what you buy most",
    subtitle: "Product summaries are grouped by month, year, or all time.",
    active: 3,
    body: `
      <div class="phone-title"><h2>Product Summary</h2><p>July 2026</p></div>
      <div class="grid">
        <div class="card">
          <div class="row"><div><h3>Water</h3><p>18 pcs - 3 receipts</p></div><div class="amount">€10.80</div></div>
          <div class="row"><div><h3>Bread</h3><p>8 pcs - 4 receipts</p></div><div class="amount">€9.60</div></div>
          <div class="row"><div><h3>Tomatoes</h3><p>4.5 kg - 2 receipts</p></div><div class="amount">€13.50</div></div>
          <div class="row"><div><h3>Chicken</h3><p>2 kg - 2 receipts</p></div><div class="amount">€19.60</div></div>
          <div class="row"><div><h3>Yogurt</h3><p>6 pcs - 3 receipts</p></div><div class="amount">€9.60</div></div>
        </div>
        <div class="card soft"><h3 style="font-size:38px;margin:0 0 10px">Sorted by quantity</h3><p style="font-size:27px;color:${muted};font-weight:700">Know the products you buy most, not only the most expensive ones.</p></div>
      </div>`,
  },
  {
    file: "08-settings.png",
    title: "Stay in control",
    subtitle: "Budgets, monthly payments, privacy, and exports are easy to manage.",
    active: 4,
    body: `
      <div class="phone-title"><h2>Settings</h2><p>Your data stays on your device.</p></div>
      <div class="grid">
        <div class="card">
          <div class="row"><div><h3>Money & Budget</h3><p>Income, budgets, monthly payments</p></div><div class="amount">›</div></div>
          <div class="row"><div><h3>Receipt Analysis</h3><p>Default category, scan preferences</p></div><div class="amount">›</div></div>
          <div class="row"><div><h3>My Data</h3><p>Export, import, clear data</p></div><div class="amount">›</div></div>
          <div class="row"><div><h3>Privacy & Legal</h3><p>Privacy policy and terms</p></div><div class="amount">›</div></div>
          <div class="row"><div><h3>Help & Feedback</h3><p>Send feedback directly</p></div><div class="amount">›</div></div>
        </div>
        <div class="card soft"><h3 style="font-size:38px;margin:0 0 10px">Private by design</h3><p style="font-size:27px;color:${muted};font-weight:700">Reciro stores receipts locally unless you choose to export your own backup.</p></div>
      </div>`,
  },
];

for (const screen of screens) {
  const html = shell(screen);
  const htmlPath = path.join(htmlDir, screen.file.replace(".png", ".html"));
  const pngPath = path.join(iosDir, screen.file);
  fs.writeFileSync(htmlPath, html, "utf8");
  execFileSync(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1242,2688",
    `--screenshot=${pngPath}`,
    `file:///${htmlPath.replace(/\\/g, "/")}`,
  ], { stdio: "inherit" });
}

const readme = `# Reciro App Store Assets

Generated screenshots are clean sample images without private receipts.

## App icon

- icon-1024.png

## iPhone screenshots

Upload these under the iPhone 6.5-inch screenshot area in App Store Connect:

1. screenshots/ios/01-home.png
2. screenshots/ios/02-add-receipt.png
3. screenshots/ios/03-ai-review.png
4. screenshots/ios/04-detail.png
5. screenshots/ios/05-reports.png
6. screenshots/ios/06-months.png
7. screenshots/ios/07-products.png
8. screenshots/ios/08-settings.png

All screenshots are 1242 x 2688 PNG.
`;

fs.writeFileSync(path.join(outRoot, "README.md"), readme, "utf8");
console.log(`Generated ${screens.length} screenshots in ${iosDir}`);
console.log(`Copied app icon to ${iconTarget}`);
