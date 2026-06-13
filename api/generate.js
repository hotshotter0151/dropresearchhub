<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>DropResearch Hub — Members</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#1E3A5F;--navy-light:#2B4F82;--navy-dark:#142840;
  --gold:#F59E0B;--gold-light:#FCD34D;
  --white:#fff;--off:#F8FAFF;
  --g50:#F9FAFB;--g100:#F3F4F6;--g200:#E5E7EB;--g300:#D1D5DB;
  --g400:#9CA3AF;--g500:#6B7280;--g700:#374151;--g900:#111827;
  --green:#16A34A;--green-bg:#DCFCE7;
  --red:#DC2626;--red-bg:#FEE2E2;
  --amber:#D97706;--amber-bg:#FEF3C7;
}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:var(--g50);color:var(--g900);line-height:1.6;overflow-x:hidden}

/* NAV */
.topnav{position:sticky;top:0;z-index:100;background:var(--navy-dark);height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 3%;box-shadow:0 2px 20px rgba(0,0,0,.18)}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.nav-logo-icon{width:36px;height:36px;background:#fff;border-radius:9px;display:flex;align-items:flex-end;justify-content:center;gap:3px;padding:7px 6px}
.nav-logo-bar{width:5px;border-radius:2px;background:var(--navy)}
.nav-logo-bar.g{background:var(--gold)}
.nav-logo-text{font-size:16px;font-weight:800;color:#fff;letter-spacing:-.3px}
.nav-logo-text span{color:var(--gold)}
.nav-tabs{display:flex;gap:4px}
.nav-tab{background:none;border:none;color:rgba(255,255,255,.6);font-family:inherit;font-size:13px;font-weight:700;padding:8px 16px;border-radius:8px;cursor:pointer;transition:all .15s}
.nav-tab:hover{color:#fff;background:rgba(255,255,255,.08)}
.nav-tab.active{background:#fff;color:var(--navy)}
.nav-right{display:flex;align-items:center;gap:10px}
.nav-user{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:999px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer}
.nav-signout{color:rgba(255,255,255,.5);font-size:12px;background:none;border:none;cursor:pointer;font-family:inherit}
.nav-signout:hover{color:#fff}

/* VIEWS */
.view{display:none}.view.active{display:block}

/* EMERGING PRODUCTS VIEW */
.page-header{background:var(--navy);padding:40px 3% 36px;color:#fff}
.page-header h1{font-size:32px;font-weight:900;letter-spacing:-1px;margin-bottom:8px}
.page-header p{color:rgba(255,255,255,.7);font-size:15px;max-width:560px}
.header-meta{display:flex;align-items:center;gap:16px;margin-top:16px;flex-wrap:wrap}
.header-badge{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700}
.header-badge.green{background:rgba(22,163,74,.2);border-color:rgba(22,163,74,.4);color:#86efac}

.products-section{padding:28px 3%}
.products-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.toolbar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.filter-btn{background:#fff;border:1px solid var(--g200);color:var(--g500);border-radius:999px;padding:7px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
.filter-btn.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.filter-btn:hover:not(.active){border-color:var(--navy);color:var(--navy)}
.toolbar-right{font-size:13px;color:var(--g400)}

.products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.product-card{background:#fff;border:1px solid var(--g200);border-radius:20px;overflow:hidden;transition:all .18s;cursor:pointer;display:flex;flex-direction:column}
.product-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(30,58,95,.1);border-color:var(--g300)}
.product-card-img{height:200px;background:#fff;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:52px;border-bottom:1px solid var(--g100);flex-shrink:0}
.product-card-img img{max-width:100%;max-height:196px;width:auto;height:auto;object-fit:contain;display:block;padding:12px}
.trend-badge{position:absolute;top:12px;left:12px;border-radius:999px;color:#fff;font-size:11px;font-weight:900;padding:5px 10px;z-index:2}
.stage-badge{position:absolute;top:12px;right:12px;background:rgba(255,255,255,.95);border:1px solid var(--g200);border-radius:999px;color:var(--navy);font-size:11px;font-weight:800;padding:5px 9px;z-index:2}
.product-card-body{padding:16px;display:flex;flex-direction:column;flex:1}
.mini-scores{display:flex;gap:8px;margin-top:auto;margin-bottom:14px}
.product-card-name{font-size:15px;font-weight:800;color:var(--g900);letter-spacing:-.2px;margin-bottom:3px}
.product-card-niche{font-size:12px;color:var(--g400);margin-bottom:12px}
.product-card-why{font-size:12px;color:var(--g600);line-height:1.55;margin-bottom:0;padding:10px;background:var(--g50);border-radius:10px;border-left:3px solid var(--gold)}
.mini-scores{display:flex;gap:8px;margin-bottom:14px}
.mini-score{flex:1;text-align:center;background:var(--g50);border-radius:10px;padding:8px 4px;border:1px solid var(--g100)}
.mini-score-label{font-size:9px;color:var(--g400);text-transform:uppercase;letter-spacing:.5px;font-weight:700}
.mini-score-val{font-size:14px;font-weight:900;color:var(--g900);margin-top:2px}
.analyse-btn{width:100%;background:var(--navy);color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px}
.analyse-btn:hover{background:var(--navy-light)}
.analyse-btn svg{width:16px;height:16px}

/* LOADING STATE */
.loading-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.loading-card{background:#fff;border:1px solid var(--g200);border-radius:20px;overflow:hidden;animation:shimmer 1.5s infinite}
.loading-card-img{height:160px;background:linear-gradient(90deg,var(--g100) 25%,var(--g50) 50%,var(--g100) 75%);background-size:200% 100%}
.loading-card-body{padding:16px}
.loading-line{height:12px;background:linear-gradient(90deg,var(--g100) 25%,var(--g50) 50%,var(--g100) 75%);background-size:200% 100%;border-radius:6px;margin-bottom:10px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.empty-state{text-align:center;padding:80px 20px;color:var(--g400)}
.empty-state h3{font-size:20px;color:var(--g600);margin-bottom:8px}
.empty-state p{font-size:14px;margin-bottom:24px}
.empty-state-btn{background:var(--navy);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}

/* PRODUCT ANALYSIS VIEW */
.analysis-header{background:var(--navy);padding:28px 3%;color:#fff;display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap}
.back-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;transition:all .15s}
.back-btn:hover{background:rgba(255,255,255,.18)}
.analysis-header-info{flex:1}
.analysis-header-info h1{font-size:28px;font-weight:900;letter-spacing:-.8px;margin-bottom:4px}
.analysis-header-info p{color:rgba(255,255,255,.65);font-size:14px}
.analysis-body{padding:28px 3%;display:flex;flex-direction:column;gap:20px;max-width:1200px;margin:0 auto}

/* SCORE CARDS */
.score-row{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.score-card{background:#fff;border:1px solid var(--g200);border-radius:16px;padding:18px;text-align:center}
.score-card-label{font-size:11px;color:var(--g400);text-transform:uppercase;letter-spacing:.8px;font-weight:800;margin-bottom:8px}
.score-card-value{font-size:36px;font-weight:900;letter-spacing:-1px}
.score-card-sub{font-size:12px;color:var(--g400);margin-top:4px}

/* ANALYSIS PANELS */
.analysis-panel{background:#fff;border:1px solid var(--g200);border-radius:20px;overflow:hidden}
.analysis-panel-head{padding:18px 22px;border-bottom:1px solid var(--g200);display:flex;align-items:center;gap:10px}
.analysis-panel-head h2{font-size:17px;font-weight:800;color:var(--g900);letter-spacing:-.3px}
.analysis-panel-body{padding:20px 22px}

/* GRAPH */
.graph-wrap{display:flex;gap:6px;align-items:flex-end;height:140px;border-left:1px solid var(--g100);border-bottom:1px solid var(--g100);padding:8px 0 0}
.graph-bar{flex:1;border-radius:6px 6px 0 0;min-height:6px;background:linear-gradient(180deg,var(--gold),var(--navy));transition:height .4s}
.graph-labels{display:flex;gap:6px;margin-top:8px}
.graph-labels span{flex:1;font-size:10px;color:var(--g400);text-align:center;font-weight:600}
.graph-note{font-size:12px;color:var(--g400);margin-top:10px}

/* INSIGHT COLS */
.insight-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.insight-col{border-radius:14px;padding:16px}
.insight-col.green{background:var(--green-bg);border:1px solid #bbf7d0}
.insight-col.red{background:var(--red-bg);border:1px solid #fecaca}
.insight-col.blue{background:#eff6ff;border:1px solid #bfdbfe}
.insight-col h3{font-size:13px;font-weight:800;margin-bottom:10px}
.insight-col.green h3{color:#15803d}
.insight-col.red h3{color:#b91c1c}
.insight-col.blue h3{color:#1d4ed8}
.insight-col ul{padding-left:16px;font-size:13px;line-height:1.75}
.insight-col.green ul{color:#166534}
.insight-col.red ul{color:#991b1b}
.insight-col.blue ul{color:#1e40af}

/* RESEARCH LINKS */
.research-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.research-link{display:flex;align-items:center;gap:10px;background:var(--g50);border:1px solid var(--g200);border-radius:12px;padding:14px;text-decoration:none;color:var(--navy);font-size:13px;font-weight:700;transition:all .15s}
.research-link:hover{background:var(--off);border-color:var(--navy);transform:translateY(-1px)}
.research-link-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}

/* CREATIVE SECTION */
.creative-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.creative-label{font-size:11px;color:var(--g500);text-transform:uppercase;letter-spacing:.6px;font-weight:700;display:block;margin-bottom:5px}
.creative-select{width:100%;border:1px solid var(--g200);border-radius:10px;padding:11px 12px;font-size:14px;font-family:inherit;background:#fff;color:var(--g900);outline:none}
.creative-select:focus{border-color:var(--navy)}
.generate-creative-btn{background:var(--gold);color:var(--navy);border:none;border-radius:12px;padding:13px 22px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;transition:all .15s;display:flex;align-items:center;gap:8px}
.generate-creative-btn:hover{background:var(--gold-light)}
.generate-creative-btn:disabled{background:var(--g200);color:var(--g400);cursor:default}
.creative-output{display:none;margin-top:18px}
.creative-output.show{display:block}
.variation-tabs{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap}
.var-tab{background:var(--g100);border:1px solid var(--g200);color:var(--g500);border-radius:999px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
.var-tab.active{background:var(--navy);color:#fff;border-color:var(--navy)}
.script-tabs{display:flex;gap:6px;margin-bottom:12px}
.script-tab{background:none;border:1px solid var(--g200);color:var(--g500);border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
.script-tab.active{background:var(--navy-dark);color:#fff;border-color:var(--navy-dark)}
.script-box{background:var(--g50);border:1px solid var(--g200);border-radius:12px;padding:16px;font-size:13px;color:var(--g700);line-height:1.8;white-space:pre-wrap;min-height:120px}
.brief-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;font-size:13px;color:#166534;line-height:1.8;white-space:pre-wrap}
.copy-row{display:flex;gap:8px;margin-top:10px}
.copy-btn{background:#fff;border:1px solid var(--g200);color:var(--g700);border-radius:8px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
.copy-btn:hover{border-color:var(--navy);color:var(--navy)}
.meta-info-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.meta-info-card{background:var(--g50);border:1px solid var(--g200);border-radius:10px;padding:12px}
.meta-info-card-label{font-size:10px;color:var(--g400);text-transform:uppercase;letter-spacing:.6px;font-weight:700;margin-bottom:4px}
.meta-info-card-val{font-size:13px;color:var(--g700);font-weight:500}

/* VALIDATOR VIEW */
.validator-hero{background:var(--navy);padding:48px 3%;text-align:center;color:#fff}
.validator-hero h1{font-size:34px;font-weight:900;letter-spacing:-1px;margin-bottom:10px}
.validator-hero p{color:rgba(255,255,255,.7);font-size:15px;max-width:520px;margin:0 auto 28px}
.validator-input-wrap{display:flex;gap:0;background:#fff;border-radius:14px;padding:6px;max-width:640px;margin:0 auto 12px;box-shadow:0 8px 32px rgba(0,0,0,.2)}
.validator-input{flex:1;border:none;outline:none;padding:12px 14px;font-size:14px;font-family:inherit;color:var(--g900);background:transparent;border-radius:10px}
.validator-submit{background:var(--gold);color:var(--navy);border:none;border-radius:10px;padding:12px 20px;font-size:14px;font-weight:900;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all .15s}
.validator-submit:hover{background:var(--gold-light)}
.validator-hint{color:rgba(255,255,255,.5);font-size:12px}
.validator-supported{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap}
.supported-tag{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.8);border-radius:999px;padding:5px 12px;font-size:12px;font-weight:700}
.validator-result-area{padding:28px 3%;max-width:1200px;margin:0 auto}
.validator-empty{text-align:center;padding:60px 20px;color:var(--g400)}
.validator-empty h3{font-size:18px;color:var(--g600);margin-bottom:8px}

/* ADMIN VIEW */
.admin-wrap{max-width:800px;margin:0 auto;padding:32px 3%}
.admin-lock{background:#fff;border:1px solid var(--g200);border-radius:20px;padding:40px;text-align:center}
.admin-lock h2{font-size:22px;font-weight:800;color:var(--g900);margin-bottom:8px}
.admin-lock p{font-size:14px;color:var(--g500);margin-bottom:24px}
.admin-pw-input{border:1px solid var(--g200);border-radius:10px;padding:12px 16px;font-size:15px;font-family:inherit;outline:none;width:260px;text-align:center;display:block;margin:0 auto 12px}
.admin-pw-input:focus{border-color:var(--navy)}
.admin-unlock-btn{background:var(--navy);color:#fff;border:none;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.admin-pw-error{color:var(--red);font-size:13px;margin-top:8px;display:none}
.admin-panel{display:none}
.admin-panel.visible{display:block}
.admin-card{background:#fff;border:1px solid var(--g200);border-radius:20px;padding:24px;margin-bottom:16px}
.admin-card h2{font-size:18px;font-weight:800;color:var(--g900);margin-bottom:6px}
.admin-card p{font-size:13px;color:var(--g500);margin-bottom:20px}
.admin-generate-btn{background:var(--navy);color:#fff;border:none;border-radius:12px;padding:14px 24px;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:10px;transition:all .15s}
.admin-generate-btn:hover{background:var(--navy-light)}
.admin-generate-btn:disabled{background:var(--g300);cursor:default}
.admin-status{margin-top:14px;font-size:13px;color:var(--g500)}
.admin-status.success{color:var(--green)}
.admin-status.error{color:var(--red)}
.admin-products-list{display:flex;flex-direction:column;gap:10px;margin-top:16px}
.admin-product-row{display:flex;align-items:center;gap:12px;background:var(--g50);border:1px solid var(--g200);border-radius:12px;padding:12px 16px}
.admin-product-emoji{font-size:24px;width:36px;text-align:center;flex-shrink:0}
.admin-product-info{flex:1}
.admin-product-name{font-size:14px;font-weight:700;color:var(--g900)}
.admin-product-meta{font-size:12px;color:var(--g400)}
.admin-product-grade{font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;flex-shrink:0}

.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.status-messages{margin-top:14px;background:var(--g50);border:1px solid var(--g200);border-radius:12px;padding:14px;display:none}
.status-messages.show{display:block}
.status-line{font-size:13px;color:var(--g500);padding:3px 0;display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .4s}
.status-line.show{opacity:1}
.status-line.done{color:var(--green)}
.status-line.done::before{content:'✓ '}
.status-line.active::before{content:'→ ';color:var(--navy)}
.admin-product-toggle{width:40px;height:22px;border-radius:11px;background:var(--g200);border:none;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0}
.admin-product-toggle.on{background:var(--green)}
.admin-product-toggle::after{content:'';position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.admin-product-toggle.on::after{left:20px}

.toast{position:fixed;bottom:24px;right:24px;background:var(--navy);color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;opacity:0;transition:opacity .3s;z-index:999;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.2)}
.toast.show{opacity:1}

@media(max-width:900px){.score-row{grid-template-columns:repeat(2,1fr)}.insight-cols{grid-template-columns:1fr}.research-grid{grid-template-columns:repeat(2,1fr)}.creative-form{grid-template-columns:1fr}.meta-info-row{grid-template-columns:1fr}.products-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.products-grid{grid-template-columns:1fr}.score-row{grid-template-columns:repeat(2,1fr)}.research-grid{grid-template-columns:1fr}.nav-tabs{display:none}.analysis-header{flex-direction:column}}
</style>
</head>
<body>

<nav class="topnav">
  <a class="nav-logo" href="index.html">
    <div class="nav-logo-icon">
      <div class="nav-logo-bar" style="height:10px;opacity:.4"></div>
      <div class="nav-logo-bar" style="height:16px;opacity:.7"></div>
      <div class="nav-logo-bar" style="height:22px"></div>
      <div class="nav-logo-bar g" style="height:17px"></div>
    </div>
    <div class="nav-logo-text">Drop<span>Research</span> Hub</div>
  </a>
  <div class="nav-tabs">
    <button class="nav-tab active" onclick="showView('products',this)">📈 Emerging Products</button>
    <button class="nav-tab" onclick="showView('validator',this)">✅ Product Validator</button>
    <button class="nav-tab" onclick="showView('admin',this)">⚙️ Admin</button>
  </div>
  <div class="nav-right">
    <div class="nav-user">👋 Members</div>
    <button class="nav-signout" onclick="window.location.href='index.html'">Sign out</button>
  </div>
</nav>

<!-- VIEW 1: EMERGING PRODUCTS -->
<div class="view active" id="view-products">
  <div class="page-header">
    <h1>Emerging Products</h1>
    <p>Products showing early growth signals. These are trending before they hit mainstream social media — find them first, move fast.</p>
    <div class="header-meta">
      <div class="header-badge green">🟢 Feed live</div>
      <div class="header-badge" id="product-count-badge">Loading products...</div>
      <div class="header-badge" id="last-updated-badge">Updated by admin</div>
    </div>
  </div>
  <div class="products-section">
    <div class="products-toolbar">
      <div class="toolbar-left" id="niche-filters">
        <button class="filter-btn active" onclick="setNicheFilter('all',this)">All niches</button>
      </div>
      <div class="toolbar-right" id="toolbar-count"></div>
    </div>
    <div class="products-grid" id="products-grid">
      <div class="empty-state" style="grid-column:1/-1">
        <h3>No products yet</h3>
        <p>The admin generates the weekly product feed. Check back soon or ask the admin to publish new products.</p>
      </div>
    </div>
  </div>
</div>

<!-- VIEW 2: FULL PRODUCT ANALYSIS -->
<div class="view" id="view-analysis">
  <div class="analysis-header">
    <button class="back-btn" onclick="showView('products',document.querySelector('.nav-tab'))">← Back to products</button>
    <div class="analysis-header-info">
      <h1 id="analysis-product-name">Product Analysis</h1>
      <p id="analysis-product-niche">Loading...</p>
    </div>
  </div>
  <div class="analysis-body" id="analysis-body"></div>
</div>

<!-- VIEW 3: PRODUCT VALIDATOR -->
<div class="view" id="view-validator">
  <div class="validator-hero">
    <h1>Is it worth building a brand around?</h1>
    <p>You've found a product. Paste the link below and we'll tell you whether it's worth your time and money to launch a brand and run ads.</p>
    <div class="validator-input-wrap">
      <input class="validator-input" id="validator-input" placeholder="Paste AliExpress, Temu or Alibaba product URL...">
      <button class="validator-submit" onclick="runValidator()">Analyse →</button>
    </div>
    <div class="validator-hint">We extract the product details from your link and give you a full brand-readiness assessment</div>
    <div class="validator-supported">
      <span class="supported-tag">AliExpress</span>
      <span class="supported-tag">Temu</span>
      <span class="supported-tag">Alibaba</span>
    </div>
  </div>
  <div class="validator-result-area" id="validator-result">
    <div class="validator-empty">
      <h3>Paste a product URL above to get started</h3>
      <p>We'll analyse market demand, competition level, brand potential and give you a clear verdict on whether this is worth launching.</p>
    </div>
  </div>
</div>

<!-- VIEW 4: ADMIN -->
<div class="view" id="view-admin">
  <div class="admin-wrap">
    <div class="admin-lock" id="admin-lock">
      <div style="font-size:40px;margin-bottom:16px">🔒</div>
      <h2>Admin access only</h2>
      <p>This area is for the DropResearch Hub team only. Enter your password to continue.</p>
      <input class="admin-pw-input" type="password" id="admin-pw" placeholder="••••••••" onkeydown="if(event.key==='Enter')unlockAdmin()">
      <button class="admin-unlock-btn" onclick="unlockAdmin()">Unlock</button>
      <div class="admin-pw-error" id="admin-pw-error">Incorrect password. Try again.</div>
    </div>
    <div class="admin-panel" id="admin-panel">
      <div class="admin-card">
        <h2>🤖 Generate weekly product feed</h2>
        <p>Generates fresh emerging products — micro-niche items just starting to trend. Toggle on the ones you want, then hit Publish.</p>
        <button class="admin-generate-btn" id="admin-gen-btn" onclick="adminGenerate()">
          <span id="admin-gen-text">✨ Generate emerging products</span>
        </button>
        <div class="status-messages" id="status-messages">
          <div class="status-line" id="sl-1">Connecting to research engine...</div>
          <div class="status-line" id="sl-2">Scanning for micro-niche emerging products...</div>
          <div class="status-line" id="sl-3">Analysing market signals and trend data...</div>
          <div class="status-line" id="sl-4">Calculating saturation and margin scores...</div>
          <div class="status-line" id="sl-5">Building product intelligence cards...</div>
          <div class="status-line" id="sl-6">Fetching product images...</div>
          <div class="status-line" id="sl-7">Combining and finalising results...</div>
          <div class="status-line" id="sl-8">Products ready — review and publish below</div>
        </div>
      </div>
      <div class="admin-card" id="admin-products-card" style="display:none">
        <h2>Review generated products</h2>
        <p>Toggle on the products you want to send to members. Toggle off any you don't want to include. Then hit Publish.</p>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
          <button class="admin-generate-btn" onclick="publishProducts()" style="background:var(--green)">
            <span>🚀 Publish selected to feed</span>
          </button>
          <button onclick="toggleAll(true)" style="background:none;border:1px solid var(--g200);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--g700)">✓ Select all</button>
          <button onclick="toggleAll(false)" style="background:none;border:1px solid var(--g200);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--g700)">✕ Deselect all</button>
          <button onclick="selectGradeA()" style="background:var(--green-bg);border:1px solid #bbf7d0;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--green)">⭐ Select Grade A only</button>
          <span id="selected-count" style="font-size:13px;color:var(--g400)"></span>
        </div>
        <div class="admin-products-list" id="admin-products-list"></div>
      </div>
      <div class="admin-card" id="admin-live-card">
        <h2>🗂️ Manage live feed</h2>
        <p>Remove products currently showing in the member feed.</p>
        <div class="admin-products-list" id="admin-live-list"><div style="font-size:13px;color:var(--g400);padding:8px 0">No products published yet.</div></div>
      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const ADMIN_PW = 'Billy1234.';

let allProducts = [];
let pendingProducts = [];
let activeNiche = 'all';
let creativeVariations = [];
let currentVariation = 0;

// ── NAVIGATION ────────────────────────────────────────────
function showView(name, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo(0, 0);
}

// ── PRODUCTS FEED ─────────────────────────────────────────
function gradeColor(g) {
  if (!g) return '#6B7280';
  const s = String(g).toUpperCase();
  if (s.startsWith('A')) return '#16A34A';
  if (s === 'B') return '#D97706';
  if (s === 'C') return '#EA580C';
  return '#DC2626';
}

function gradeColorBg(g) {
  const s = String(g || '').toUpperCase();
  if (s.startsWith('A')) return '#DCFCE7';
  if (s === 'B') return '#FEF3C7';
  if (s === 'C') return '#FEE2E2';
  return '#FEE2E2';
}

function renderProductsGrid() {
  const grid = document.getElementById('products-grid');
  const list = activeNiche === 'all' ? allProducts : allProducts.filter(p => (p.niche || '').toLowerCase() === activeNiche.toLowerCase());
  document.getElementById('toolbar-count').textContent = `${list.length} product${list.length !== 1 ? 's' : ''}`;
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No products yet</h3><p>The admin generates the weekly product feed. Check back Monday when new products drop.</p></div>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => `
    <div class="product-card" onclick="openAnalysis(${i})">
      <div class="product-card-img" style="background:#fff">
        ${p.img
          ? `<img src="${p.img}" alt="${p.name}" style="max-width:100%;max-height:196px;width:auto;height:auto;object-fit:contain;display:block;padding:8px" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;font-size:52px;width:100%;height:100%;align-items:center;justify-content:center">${p.emoji||'📦'}</span>`
          : `<span>${p.emoji||'📦'}</span>`}
        <div class="trend-badge" style="background:${gradeColor(p.grade)}">Grade ${p.grade || '?'}</div>
        <div class="stage-badge">${p.stage || 'Emerging'}</div>
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${p.name}</div>
        <div class="product-card-niche">${p.niche} · ${p.season || 'Evergreen'}</div>
        <div class="product-card-why">${p.whyNow || 'Early growth signal detected.'}</div>
        <div class="mini-scores">
          <div class="mini-score">
            <div class="mini-score-label">Trend</div>
            <div class="mini-score-val" style="color:var(--navy)">${p.trendScore || '—'}</div>
          </div>
          <div class="mini-score">
            <div class="mini-score-label">Margin</div>
            <div class="mini-score-val" style="color:var(--green)">${p.margin || '—'}</div>
          </div>
          <div class="mini-score">
            <div class="mini-score-label">Sat.</div>
            <div class="mini-score-val" style="color:${parseInt(p.saturation)<40?'var(--green)':parseInt(p.saturation)<60?'var(--amber)':'var(--red)'}">${p.saturation || '—'}</div>
          </div>
        </div>
        <button class="analyse-btn" onclick="event.stopPropagation();openAnalysis(${i})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Analyse this product
        </button>
      </div>
    </div>
  `).join('');
}

function buildNicheFilters() {
  const niches = [...new Set(allProducts.map(p => p.niche).filter(Boolean))];
  const wrap = document.getElementById('niche-filters');
  wrap.innerHTML = `<button class="filter-btn active" onclick="setNicheFilter('all',this)">All niches</button>` +
    niches.map(n => `<button class="filter-btn" onclick="setNicheFilter('${n}',this)">${n}</button>`).join('');
}

function setNicheFilter(niche, btn) {
  activeNiche = niche;
  document.querySelectorAll('#niche-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProductsGrid();
}

// ── PRODUCT ANALYSIS ──────────────────────────────────────
function openAnalysis(idx) {
  const p = allProducts[idx];
  if (!p) return;
  showView('analysis', null);
  document.querySelector('.nav-tab').classList.add('active');
  document.getElementById('analysis-product-name').textContent = p.name;
  document.getElementById('analysis-product-niche').textContent = `${p.niche} · ${p.stage || 'Emerging'} · ${p.season || 'Evergreen'}`;
  buildAnalysisBody(p);
}

function buildAnalysisBody(p) {
  const body = document.getElementById('analysis-body');
  const growthGraphHtml = buildGrowthGraph(p.growthData);
  const aliQ = encodeURIComponent(p.aliSearchTerm || p.name);
  const tiktokQ = encodeURIComponent(p.name);
  const metaQ = encodeURIComponent(p.name);
  const trendsQ = encodeURIComponent(p.googleTrendsKeyword || p.name);

  body.innerHTML = `
    <div class="score-row">
      <div class="score-card">
        <div class="score-card-label">Opportunity</div>
        <div class="score-card-value" style="color:${gradeColor(p.grade)}">${p.grade || '?'}</div>
        <div class="score-card-sub">Overall grade</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">Trend score</div>
        <div class="score-card-value" style="color:var(--navy)">${p.trendScore || '—'}<span style="font-size:16px;color:var(--g400)">/100</span></div>
        <div class="score-card-sub">Google Trends signal</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">Saturation</div>
        <div class="score-card-value" style="color:${parseInt(p.saturation)<40?'var(--green)':parseInt(p.saturation)<60?'var(--amber)':'var(--red)'}">${p.saturation || '—'}<span style="font-size:16px;color:var(--g400)">/100</span></div>
        <div class="score-card-sub">${parseInt(p.saturation)<40?'Low — good entry':'Medium — competitive'}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">Est. margin</div>
        <div class="score-card-value" style="color:var(--green)">${p.margin || '—'}</div>
        <div class="score-card-sub">Estimated margin</div>
      </div>
    </div>

    <div class="analysis-panel">
      <div class="analysis-panel-head"><span style="font-size:20px">📈</span><h2>Growth signal — last 6 weeks</h2></div>
      <div class="analysis-panel-body">
        ${growthGraphHtml}
        <div class="graph-note">Indicative growth signal based on search trend data. Verify on Google Trends for live data.</div>
      </div>
    </div>

    <div class="analysis-panel">
      <div class="analysis-panel-head"><span style="font-size:20px">🔍</span><h2>Opportunity breakdown</h2></div>
      <div class="analysis-panel-body">
        <div class="insight-cols">
          <div class="insight-col green">
            <h3>✅ Why it could work</h3>
            <ul>${(p.whyItCouldWork || []).map(i => `<li>${i}</li>`).join('') || '<li>Strong early trend signal</li>'}</ul>
          </div>
          <div class="insight-col red">
            <h3>⚠️ Risks to check</h3>
            <ul>${(p.risks || []).map(i => `<li>${i}</li>`).join('') || '<li>Research competition before launching</li>'}</ul>
          </div>
          <div class="insight-col blue">
            <h3>🎬 Creative angles</h3>
            <ul>${(p.creativeAngles || []).map(i => `<li>${i}</li>`).join('') || '<li>Problem → solution demo</li>'}</ul>
          </div>
        </div>
        <div style="margin-top:14px;background:var(--g50);border:1px solid var(--g200);border-radius:14px;padding:16px;">
          <div style="font-size:12px;color:var(--g400);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Verdict</div>
          <div style="font-size:14px;color:var(--g700);line-height:1.65">${p.verdict || 'Analyse this product further before committing budget.'}</div>
        </div>
      </div>
    </div>

    <div class="analysis-panel">
      <div class="analysis-panel-head"><span style="font-size:20px">🔗</span><h2>Research hub</h2></div>
      <div class="analysis-panel-body">
        <p style="font-size:13px;color:var(--g500);margin-bottom:14px">Check who's already selling this, what ads are running and how search is trending.</p>
        <div class="research-grid">
          <a class="research-link" href="https://trends.google.com/trends/explore?geo=GB&q=${trendsQ}" target="_blank">
            <div class="research-link-icon" style="background:#e8f0fe">📊</div>
            <div><div style="font-size:11px;color:var(--g400);margin-bottom:2px">GOOGLE TRENDS</div>Live search trend</div>
          </a>
          <a class="research-link" href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=GB&q=${metaQ}" target="_blank">
            <div class="research-link-icon" style="background:#e7f3ff">📺</div>
            <div><div style="font-size:11px;color:var(--g400);margin-bottom:2px">META ADS LIBRARY</div>Who's running ads</div>
          </a>
          <a class="research-link" href="https://www.tiktok.com/search?q=${tiktokQ}" target="_blank">
            <div class="research-link-icon" style="background:#f3e8ff">🎵</div>
            <div><div style="font-size:11px;color:var(--g400);margin-bottom:2px">TIKTOK SEARCH</div>Content & trends</div>
          </a>
          <a class="research-link" href="https://www.aliexpress.com/wholesale?SearchText=${aliQ}" target="_blank">
            <div class="research-link-icon" style="background:#fff0e6">🛒</div>
            <div><div style="font-size:11px;color:var(--g400);margin-bottom:2px">ALIEXPRESS</div>Find suppliers</div>
          </a>
          <a class="research-link" href="https://www.amazon.co.uk/s?k=${aliQ}" target="_blank">
            <div class="research-link-icon" style="background:#fff8e6">📦</div>
            <div><div style="font-size:11px;color:var(--g400);margin-bottom:2px">AMAZON UK</div>Demand & reviews</div>
          </a>
          <a class="research-link" href="https://www.google.com/search?tbm=shop&q=${metaQ}" target="_blank">
            <div class="research-link-icon" style="background:#e6ffe6">🏪</div>
            <div><div style="font-size:11px;color:var(--g400);margin-bottom:2px">COMPETITOR STORES</div>Who's selling it</div>
          </a>
        </div>
      </div>
    </div>

    <div class="analysis-panel">
      <div class="analysis-panel-head"><span style="font-size:20px">🎬</span><h2>Ad creative generator — 3 variations</h2></div>
      <div class="analysis-panel-body">
        <p style="font-size:13px;color:var(--g500);margin-bottom:16px">Generate 3 complete video ad scripts with hooks, shot list and a ready-to-send production brief.</p>
        <div class="creative-form">
          <div>
            <label class="creative-label">Platform</label>
            <select class="creative-select" id="creative-platform">
              <option>TikTok</option>
              <option>Meta (Facebook/Instagram)</option>
              <option>Both TikTok + Meta</option>
            </select>
          </div>
          <div>
            <label class="creative-label">Primary angle</label>
            <select class="creative-select" id="creative-angle">
              <option>Problem → Solution</option>
              <option>Curiosity / Pattern interrupt</option>
              <option>Social proof / Testimonial</option>
              <option>Lifestyle / Aspirational</option>
              <option>Before & After</option>
            </select>
          </div>
        </div>
        <button class="generate-creative-btn" id="creative-gen-btn" onclick="generateCreative('${p.name.replace(/'/g,"\\'")}')">
          ✨ Generate 3 creative variations
        </button>
        <div class="creative-output" id="creative-output">
          <div class="variation-tabs" id="variation-tabs"></div>
          <div class="script-tabs">
            <button class="script-tab active" onclick="setScriptTab('script',this)">Video script</button>
            <button class="script-tab" onclick="setScriptTab('hooks',this)">5 hooks</button>
            <button class="script-tab" onclick="setScriptTab('brief',this)">Brief to send</button>
          </div>
          <div id="tab-script"><div class="script-box" id="script-content"></div><div class="copy-row"><button class="copy-btn" onclick="copyEl('script-content')">📋 Copy script</button></div></div>
          <div id="tab-hooks" style="display:none"><div class="script-box" id="hooks-content"></div><div class="copy-row"><button class="copy-btn" onclick="copyEl('hooks-content')">📋 Copy hooks</button></div></div>
          <div id="tab-brief" style="display:none"><div class="brief-box" id="brief-content"></div><div class="copy-row"><button class="copy-btn" onclick="copyEl('brief-content')">📋 Copy brief</button></div></div>
          <div class="meta-info-row">
            <div class="meta-info-card"><div class="meta-info-card-label">🎵 TikTok music vibe</div><div class="meta-info-card-val" id="music-val">—</div></div>
            <div class="meta-info-card"><div class="meta-info-card-label">🎯 Meta target audience</div><div class="meta-info-card-val" id="audience-val">—</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildGrowthGraph(data) {
  const points = data && data.length ? data : [
    {label:'W1',value:18},{label:'W2',value:28},{label:'W3',value:42},
    {label:'W4',value:58},{label:'W5',value:72},{label:'W6',value:86}
  ];
  const max = Math.max(...points.map(p => p.value), 1);
  return `
    <div class="graph-wrap">
      ${points.map(p => `<div class="graph-bar" style="height:${Math.max(6, p.value/max*100)}%" title="${p.label}: ${p.value}"></div>`).join('')}
    </div>
    <div class="graph-labels">${points.map(p => `<span>${p.label}</span>`).join('')}</div>
  `;
}

// ── AD CREATIVE GENERATOR ─────────────────────────────────
async function generateCreative(productName) {
  const btn = document.getElementById('creative-gen-btn');
  const platform = document.getElementById('creative-platform').value;
  const angle = document.getElementById('creative-angle').value;
  btn.disabled = true;
  btn.textContent = '✨ Generating 3 variations...';
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        system: `You are an expert ecom ad creative strategist for ${platform}. Generate 3 complete ad creative variations. Respond ONLY with a valid JSON object (no markdown, no backticks). Format:
{"variations":[{"script":"punchy video script hook+middle+CTA max 120 words, use line breaks","hooks":"5 alternative hook lines numbered 1-5 one per line","brief":"ready-to-send production brief with: Product, Platform, Video length, Angle, Tone, Key shots to capture, CTA — formatted clearly","music":"TikTok music vibe suggestion","audience":"Meta target audience description"},{"script":"...","hooks":"...","brief":"...","music":"...","audience":"..."},{"script":"...","hooks":"...","brief":"...","music":"...","audience":"..."}]}
Variation 1: angle ${angle}. Variation 2: different unexpected angle. Variation 3: most creative angle.`,
        messages: [{role:'user',content:`Product: ${productName}. Platform: ${platform}.`}],
        max_tokens: 2000
      })
    });
    const data = await res.json();
    const text = (data.content || []).map(i => i.text || '').join('');
    let parsed;
    try { parsed = JSON.parse(text.replace(/```json|```/g,'').trim()); }
    catch(e) { parsed = {variations:[{script:text,hooks:'',brief:'',music:'',audience:''}]}; }
    creativeVariations = parsed.variations || [];
    currentVariation = 0;
    renderCreativeOutput();
    document.getElementById('creative-output').classList.add('show');
  } catch(e) {
    showToast('Could not generate creatives — try again');
  }
  btn.disabled = false;
  btn.textContent = '✨ Generate 3 creative variations';
}

function renderCreativeOutput() {
  const tabs = document.getElementById('variation-tabs');
  tabs.innerHTML = creativeVariations.map((_, i) => `
    <button class="var-tab ${i===currentVariation?'active':''}" onclick="setVariation(${i},this)">Variation ${i+1}</button>
  `).join('');
  loadVariation(currentVariation);
}

function setVariation(idx, btn) {
  currentVariation = idx;
  document.querySelectorAll('.var-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadVariation(idx);
  setScriptTab('script', document.querySelector('.script-tab'));
}

function loadVariation(idx) {
  const v = creativeVariations[idx];
  if (!v) return;
  document.getElementById('script-content').textContent = v.script || '';
  document.getElementById('hooks-content').textContent = v.hooks || '';
  document.getElementById('brief-content').textContent = v.brief || '';
  document.getElementById('music-val').textContent = v.music || '—';
  document.getElementById('audience-val').textContent = v.audience || '—';
}

function setScriptTab(tab, btn) {
  document.querySelectorAll('.script-tab').forEach(b => b.classList.remove('active'));
  ['tab-script','tab-hooks','tab-brief'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  if (btn) btn.classList.add('active');
  const el = document.getElementById('tab-' + tab);
  if (el) el.style.display = 'block';
}

function copyEl(id) {
  const text = document.getElementById(id)?.textContent || '';
  navigator.clipboard.writeText(text).then(() => showToast('Copied ✓'));
}

// ── PRODUCT VALIDATOR ─────────────────────────────────────
async function runValidator() {
  const input = document.getElementById('validator-input').value.trim();
  const resultArea = document.getElementById('validator-result');
  if (!input) { showToast('Paste a product URL first'); return; }
  let productName = extractProductName(input);
  resultArea.innerHTML = `<div class="validator-empty"><h3>Analysing your product...</h3><p>Checking market demand, competition and brand potential for: <strong>${productName}</strong></p></div>`;
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ productName, niche: 'General', costPrice: 'Unknown', sellPrice: 'Unknown' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Analysis failed');
    const p = {
      name: data.productName || productName,
      niche: 'Validator result',
      stage: data.marketStage || 'Assessed',
      season: 'Assessed',
      grade: data.opportunityScore || 'B',
      trendScore: data.growthScore || 50,
      saturation: data.competitionScore || 50,
      margin: data.marginScore ? data.marginScore + '%' : '—',
      verdict: data.verdict || '',
      whyItCouldWork: data.whyItCouldWork || [],
      risks: data.risks || [],
      creativeAngles: data.creativeAngles || [],
      growthData: data.growthGraph || null,
      aliSearchTerm: productName,
      googleTrendsKeyword: productName,
      bgColor: '#F3F4F6',
      emoji: '🔍'
    };
    const tempBody = document.createElement('div');
    tempBody.id = 'analysis-body';
    tempBody.className = 'analysis-body';
    resultArea.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding:16px;background:var(--navy);border-radius:16px;color:#fff">
        <div>
          <div style="font-size:18px;font-weight:800">${p.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.6)">Brand readiness assessment</div>
        </div>
        <div style="margin-left:auto;background:${gradeColor(p.grade)};color:#fff;border-radius:999px;padding:8px 18px;font-size:18px;font-weight:900">${p.grade}</div>
      </div>
    `;
    resultArea.appendChild(tempBody);
    buildAnalysisBody(p);
    const built = document.getElementById('analysis-body');
    resultArea.appendChild(built);
  } catch(e) {
    resultArea.innerHTML = `<div class="validator-empty"><h3>Could not complete assessment</h3><p>Check your connection and try again.</p></div>`;
  }
}

function extractProductName(url) {
  try {
    const decoded = decodeURIComponent(url);
    const words = decoded.replace(/[-_+]/g,' ')
      .split(/[\/\?&#]/)
      .filter(s => s.length > 3 && !/^\d+$/.test(s) && !['http','https','www','com','aliexpress','alibaba','temu','item','product','p','pd','goods'].includes(s.toLowerCase()))
      .sort((a,b) => b.length - a.length);
    if (words.length) return words[0].replace(/[^a-zA-Z0-9 ]/g,' ').replace(/\s+/g,' ').trim().slice(0,60);
  } catch(e) {}
  return url.slice(0,60);
}

// ── ADMIN ─────────────────────────────────────────────────
function unlockAdmin() {
  const pw = document.getElementById('admin-pw').value;
  if (pw === ADMIN_PW) {
    document.getElementById('admin-lock').style.display = 'none';
    document.getElementById('admin-panel').classList.add('visible');
    renderLiveFeed();
  } else {
    document.getElementById('admin-pw-error').style.display = 'block';
    document.getElementById('admin-pw').value = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const pw = document.getElementById('admin-pw');
  if (pw) pw.addEventListener('keydown', e => { if (e.key === 'Enter') unlockAdmin(); });
});

async function adminGenerate() {
  const btn = document.getElementById('admin-gen-btn');
  btn.disabled = true;
  document.getElementById('admin-gen-text').innerHTML = '<span class="spinner"></span> Generating...';
  const statusBox = document.getElementById('status-messages');
  statusBox.className = 'status-messages show';
  const lines = ['sl-1','sl-2','sl-3','sl-4','sl-5','sl-6','sl-7','sl-8'];
  lines.forEach(id => { const el = document.getElementById(id); if(el) el.className = 'status-line'; });
  let lineIdx = 0;
  function nextLine() {
    if(lineIdx > 0) { const prev = document.getElementById(lines[lineIdx-1]); if(prev) prev.className = 'status-line done show'; }
    if(lineIdx < lines.length) { const curr = document.getElementById(lines[lineIdx]); if(curr) curr.className = 'status-line active show'; lineIdx++; }
  }
  nextLine();
  const statusTimer = setInterval(nextLine, 7000);

  try {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ mode: 'emerging' })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Generate failed');
    const t = (d.content || []).map(i => i.text || '').join('');
    let c = t.replace(/```json|```/g,'').trim();
    const s = c.indexOf('['), e = c.lastIndexOf(']');
    if (s === -1 || e === -1) throw new Error('No product array found');
    let products = JSON.parse(c.slice(s, e + 1));
    pendingProducts = products;
    clearInterval(statusTimer);
    lines.forEach(id => { const el = document.getElementById(id); if(el) el.className = 'status-line done show'; });
    renderAdminProductsList();
    document.getElementById('admin-products-card').style.display = 'block';
  } catch(e) {
    clearInterval(statusTimer);
    const errLine = document.createElement('div');
    errLine.className = 'status-line show';
    errLine.style.color = 'var(--red)';
    errLine.textContent = '✕ Error: ' + e.message;
    document.getElementById('status-messages').appendChild(errLine);
  }
  btn.disabled = false;
  document.getElementById('admin-gen-text').textContent = '✨ Generate emerging products';
}

function renderAdminProductsList() {
  const list = document.getElementById('admin-products-list');
  list.innerHTML = pendingProducts.map((p, i) => `
    <div class="admin-product-row" id="apr-${i}" style="flex-wrap:wrap;gap:10px;align-items:flex-start;padding:14px 16px">
      <div style="font-size:32px;width:44px;text-align:center;flex-shrink:0">${p.emoji || '📦'}</div>
      <div class="admin-product-info" style="min-width:200px">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-meta">${p.niche} · Trend: ${p.trendScore}/100 · Sat: ${p.saturation}/100 · ${p.margin} margin</div>
        <div style="font-size:12px;color:var(--g500);margin-top:4px;font-style:italic;line-height:1.5">${p.whyNow || ''}</div>
        ${p.img ? `<img src="${p.img}" alt="${p.name}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;margin-top:8px;border:1px solid var(--g200)" onerror="this.style.display='none'">` : ''}
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
          <a href="https://trends.google.com/trends/explore?geo=GB&q=${encodeURIComponent(p.googleTrendsKeyword||p.name)}" target="_blank" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;background:#e8f0fe;color:#1d4ed8;text-decoration:none;border:1px solid #bfdbfe">📊 Google Trends</a>
          <a href="https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=GB&q=${encodeURIComponent(p.name)}" target="_blank" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;background:#eff6ff;color:#2563eb;text-decoration:none;border:1px solid #bfdbfe">📺 Meta Ads</a>
          <a href="https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(p.aliSearchTerm||p.name)}" target="_blank" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;background:#fff0e6;color:#c2410c;text-decoration:none;border:1px solid #fed7aa">🛒 AliExpress</a>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-left:auto">
        <div class="admin-product-grade" style="background:${gradeColorBg(p.grade)};color:${gradeColor(p.grade)}">Grade ${p.grade}</div>
        <button class="admin-product-toggle on" id="toggle-${i}" onclick="toggleProduct(${i})" title="Toggle product"></button>
        <button onclick="deletePending(${i})" style="background:none;border:1px solid var(--g200);border-radius:6px;padding:4px 8px;font-size:11px;color:var(--g400);cursor:pointer;font-family:inherit" title="Remove">🗑️ Remove</button>
      </div>
    </div>
  `).join('');
  updateSelectedCount();
}

function deletePending(i) { pendingProducts.splice(i, 1); renderAdminProductsList(); }
function toggleProduct(i) { document.getElementById('toggle-' + i).classList.toggle('on'); updateSelectedCount(); }

function renderLiveFeed() {
  const list = document.getElementById('admin-live-list');
  if (!list) return;
  if (!allProducts.length) {
    list.innerHTML = '<div style="font-size:13px;color:var(--g400);padding:8px 0">No products published yet.</div>';
    return;
  }
  list.innerHTML = allProducts.map((p, i) => `
    <div class="admin-product-row" style="flex-wrap:wrap;gap:10px;align-items:center;padding:12px 16px" id="live-row-${i}">
      <div style="font-size:26px;width:36px;text-align:center;flex-shrink:0">${p.emoji || '📦'}</div>
      <div class="admin-product-info" style="flex:1;min-width:150px">
        <div class="admin-product-name">${p.name}</div>
        <div class="admin-product-meta">${p.niche} · Grade ${p.grade}</div>
      </div>
      <button onclick="removePublished(${i})" style="background:var(--red-bg);border:1px solid #fecaca;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;cursor:pointer;color:var(--red);font-family:inherit;white-space:nowrap">🗑️ Remove</button>
    </div>
  `).join('');
}

function removePublished(i) {
  const name = allProducts[i]?.name;
  allProducts.splice(i, 1);
  buildNicheFilters();
  renderProductsGrid();
  renderLiveFeed();
  document.getElementById('product-count-badge').textContent = `${allProducts.length} products live`;
  showToast(`Removed: ${name}`);
}
function toggleAll(on) {
  pendingProducts.forEach((_, i) => {
    const btn = document.getElementById('toggle-' + i);
    if(btn) btn.className = 'admin-product-toggle' + (on ? ' on' : '');
  });
  updateSelectedCount();
}
function selectGradeA() {
  pendingProducts.forEach((p, i) => {
    const btn = document.getElementById('toggle-' + i);
    const isA = p.grade && (p.grade === 'A+' || p.grade === 'A');
    if(btn) btn.className = 'admin-product-toggle' + (isA ? ' on' : '');
  });
  updateSelectedCount();
  showToast('Grade A and A+ products selected');
}
function updateSelectedCount() {
  const total = pendingProducts.length;
  const selected = document.querySelectorAll('.admin-product-toggle.on').length;
  const el = document.getElementById('selected-count');
  if(el) el.textContent = selected + ' of ' + total + ' selected';
}

function publishProducts() {
  if (!pendingProducts.length) { showToast('Generate products first'); return; }
  const selected = pendingProducts.filter((_, i) => {
    const btn = document.getElementById('toggle-' + i);
    return btn && btn.classList.contains('on');
  });
  if (!selected.length) { showToast('Toggle on at least one product first'); return; }
  allProducts = [...allProducts, ...selected];
  pendingProducts = [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', {weekday:'short',day:'numeric',month:'short'});
  document.getElementById('product-count-badge').textContent = `${allProducts.length} products live`;
  document.getElementById('last-updated-badge').textContent = `Updated ${dateStr}`;
  buildNicheFilters();
  renderProductsGrid();
  renderLiveFeed();
  showToast(`✅ ${allProducts.length} products published to member feed!`);
  showView('products', document.querySelector('.nav-tab'));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

renderProductsGrid();
</script>
</body>
</html>
