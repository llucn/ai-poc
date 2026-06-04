# 样式规范
项目采用 **CSS 自定义属性（CSS Variables）** 方案，遵循组件化设计原则。

包含浅色/深色双主题，用户可以切换主题。系统保存主题选择，下次进入系统自动显示保存的主题。

# 标题栏
页面上部显示贯通式标题栏，高度 48 像素。标题栏从左向右依次显示：

1. 菜单按钮：窗口宽度小于 1024 像素时显示菜单按钮，大于登录 1024 像素是隐藏菜单按钮。点击菜单按钮显示菜单。不显示菜单时菜单按钮显示为汉堡图标，显示菜单时菜单按钮显示为叉号图标。
2. 系统标题：显示系统标题“Work Order System”
3. 主题切换按钮：靠右显示
4. 登录用户名：靠右显示
5. 用户图标：靠右显示。点击图标打开菜单，菜单上显示“Profile”、“Logout”项目

# 菜单栏
菜单栏显示在窗口左侧，宽度 225 像素，高度全屏，显示时不遮挡标题栏。

菜单分两级，使用字体大小和缩进区分两级菜单。初始状态一级菜单收起，右侧显示收起图标。点击一级菜单标题展开菜单，右侧显示展开图标，显示二级菜单。活动菜单标识选中颜色。

菜单栏从收起状态打开，点击菜单栏外的区域，菜单栏自动收回。

# 登录页
系统使用 AWS Cognito 认证系统，使用 Cognito 登录页面，不需要开发登录页。

# 页面样式表
以下样式表**仅供参考**，使用其中的色调和样式：

```css
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    padding: calc(20px + env(safe-area-inset-top,0px)) calc(20px + env(safe-area-inset-right,0px)) calc(20px + env(safe-area-inset-bottom,0px)) calc(20px + env(safe-area-inset-left,0px))
}

.login-card {
    width: 100%;
    max-width: 480px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 36px;
    animation: fadeUp .35s ease both
}

.login-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px
}

.login-logo-img {
    height: 36px;
    width: auto;
    flex-shrink: 0
}

.login-logo-t1 {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: .08em
}

.login-logo-t2 {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: .04em
}

.login-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px
}

.login-subtitle {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 24px;
    line-height: 1.4
}

.login-accounts {
    display: flex;
    flex-direction: column;
    gap: 10px
}

.login-account-btn {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-body);
    transition: all .15s;
    position: relative
}

.login-account-btn:hover:not(:disabled) {
    border-color: var(--accent);
    background: var(--hover-subtle);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px #0000000f
}

.login-account-btn:disabled {
    opacity: .6;
    cursor: not-allowed
}

.login-account-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px
}

.login-account-info {
    flex: 1;
    min-width: 0
}

.login-account-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 1px
}

.login-account-org {
    font-size: 12px;
    font-weight: 500;
    color: var(--muted2);
    margin-bottom: 4px
}

.login-account-desc {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.4
}

.login-account-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .6s linear infinite;
    position: absolute;
    top: 16px;
    right: 16px
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px
}

.login-form .form-group {
    display: flex;
    flex-direction: column;
    gap: 4px
}

.login-form label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text)
}

.login-form input {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
    background: var(--card);
    color: var(--text);
    transition: border-color .15s
}

.login-form input:focus {
    outline: none;
    border-color: var(--accent)
}

.login-submit-btn {
    width: 100%;
    padding: 10px;
    font-size: 14px;
    font-weight: 600;
    margin-top: 4px
}

.login-error {
    font-size: 13px;
    color: var(--red);
    padding: 8px 12px;
    background: #ef444414;
    border-radius: 8px
}

.login-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px
}

.login-divider:before,.login-divider:after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--border)
}

.login-divider span {
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap
}

.login-social-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 24px
}

.login-social-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    cursor: pointer;
    transition: all .15s
}

.login-social-btn:hover:not(:disabled) {
    border-color: var(--accent);
    background: var(--hover-subtle)
}

.login-social-btn:disabled {
    opacity: .6;
    cursor: not-allowed
}

.login-demo-section {
    border-top: 1px solid var(--border);
    padding-top: 16px
}

.login-demo-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--muted);
    font-family: var(--font-body);
    margin-bottom: 8px
}

.login-demo-toggle:hover {
    color: var(--text)
}

.sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow-y: auto;
    transition: transform .25s ease;
    z-index: 200
}

.sidebar::-webkit-scrollbar {
    width: 0
}

.sidebar-logo {
    padding: 20px 18px 16px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px
}

.logo-img {
    height: 28px;
    width: auto;
    flex-shrink: 0
}

.logo-text {
    line-height: 1.2
}

.logo-text .t1 {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: .08em
}

.logo-text .t2 {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: .04em
}

.nav {
    padding: 10px 0;
    flex: 1;
    overflow-y: auto
}

.nav-section {
    padding: 14px 18px 4px;
    font-size: 10px;
    color: var(--muted);
    letter-spacing: .14em;
    text-transform: uppercase
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 18px;
    color: var(--muted);
    cursor: pointer;
    border-left: 2px solid transparent;
    transition: all .15s;
    font-size: 13px;
    font-weight: 500;
    -webkit-user-select: none;
    user-select: none;
    position: relative;
    text-decoration: none
}

.nav-item:hover {
    color: var(--text);
    background: var(--hover-subtle)
}

.nav-item.active {
    color: var(--accent);
    border-left-color: var(--accent);
    background: var(--accent-dim)
}

.nav-item svg {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    opacity: .7
}

.nav-item.active svg {
    opacity: 1
}

.nav-item.disabled {
    opacity: .5;
    cursor: default
}

.nav-badge {
    margin-left: auto;
    background: var(--accent);
    color: #000;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 20px;
    font-family: var(--font-mono)
}

.sidebar-bottom {
    padding: 14px 18px;
    border-top: 1px solid var(--border)
}

.sidebar-collapse-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
    padding: 4px 0;
    font-family: var(--font-body)
}

.sidebar-collapse-btn:hover {
    color: var(--text)
}

.sidebar-overlay {
    display: none;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #0000008c;
    z-index: 199
}

.sidebar-overlay.active {
    display: block
}

@media(max-width: 900px) {
    .sidebar {
        position:fixed;
        top: 0;
        left: 0;
        bottom: 0;
        transform: translate(-100%)
    }

    .sidebar.open {
        transform: translate(0)
    }
}

.ai-search-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--muted2);
    font-size: 12px;
    font-family: var(--font-body);
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap
}

.ai-search-trigger:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--hover-subtle)
}

.ai-search-trigger svg {
    color: var(--accent)
}

.ai-search-trigger-text {
    color: var(--muted)
}

.ai-search-kbd {
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
    background: #ffffff0f;
    border: 1px solid var(--border);
    color: var(--muted);
    font-family: var(--font-mono)
}

.ai-search-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #00000080;
    z-index: 999;
    animation: fadeIn .15s ease
}

.ai-search-modal {
    position: fixed;
    top: 15%;
    left: 50%;
    transform: translate(-50%);
    width: 560px;
    max-width: 90vw;
    background: var(--surface);
    border: 1px solid var(--border-hi);
    border-radius: 14px;
    box-shadow: 0 24px 64px #0006;
    z-index: 1000;
    overflow: hidden;
    animation: slideDown .2s ease
}

@keyframes slideDown {
    0% {
        opacity: 0;
        transform: translate(-50%) translateY(-10px)
    }

    to {
        opacity: 1;
        transform: translate(-50%) translateY(0)
    }
}

.ai-search-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border)
}

.ai-search-icon {
    color: var(--accent);
    flex-shrink: 0
}

.ai-search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 15px;
    color: var(--text);
    font-family: var(--font-body)
}

.ai-search-input::placeholder {
    color: var(--muted)
}

.ai-search-close {
    padding: 4px;
    color: var(--muted);
    cursor: pointer;
    border-radius: 4px
}

.ai-search-close:hover {
    color: var(--text);
    background: var(--hover-subtle)
}

.ai-search-spinner {
    color: var(--accent);
    animation: spin 1s linear infinite
}

.ai-search-body {
    padding: 12px 16px;
    max-height: 300px;
    overflow-y: auto
}

.ai-search-result {
    display: flex;
    flex-direction: column;
    gap: 10px
}

.ai-search-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--muted2)
}

.ai-search-summary svg {
    color: var(--accent);
    flex-shrink: 0
}

.ai-search-go {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    font-family: var(--font-body);
    transition: all .15s
}

.ai-search-go:hover {
    border-color: var(--accent);
    background: var(--hover-subtle)
}

.ai-search-go svg {
    margin-left: auto;
    color: var(--accent)
}

.ai-search-filters {
    font-size: 11px;
    font-weight: 400;
    color: var(--muted);
    margin-left: 4px
}

.ai-search-count {
    font-size: 11px;
    color: var(--accent);
    font-weight: 600;
    margin-left: auto
}

.ai-search-items {
    display: flex;
    flex-direction: column;
    gap: 2px
}

.ai-search-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    font-family: var(--font-body);
    transition: background .1s;
    text-align: left
}

.ai-search-item-clickable {
    cursor: pointer
}

.ai-search-item-clickable:hover {
    background: var(--hover-subtle)
}

.ai-search-item svg {
    color: var(--muted);
    flex-shrink: 0
}

.ai-search-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px
}

.ai-search-item-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.ai-search-item-sub {
    font-size: 11px;
    color: var(--muted)
}

.ai-search-item-type {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--accent);
    background: #0ea5e91a;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
    flex-shrink: 0
}

.ai-search-more {
    font-size: 11px;
    color: var(--muted);
    text-align: center;
    padding: 6px
}

.ai-search-view-all {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    margin-top: 4px;
    border-radius: 8px;
    border: 1px dashed var(--border);
    font-size: 12px;
    font-weight: 500;
    color: var(--accent);
    cursor: pointer;
    font-family: var(--font-body);
    transition: all .15s
}

.ai-search-view-all:hover {
    background: #0ea5e90f;
    border-color: var(--accent)
}

.ai-search-empty {
    font-size: 13px;
    color: var(--muted);
    text-align: center;
    padding: 16px
}

.ai-search-hint {
    font-size: 11px;
    color: var(--muted)
}

.ai-search-recent {
    display: flex;
    flex-direction: column;
    gap: 2px
}

.ai-search-recent-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: 4px
}

.ai-search-recent-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--muted2);
    cursor: pointer;
    font-family: var(--font-body);
    transition: background .1s
}

.ai-search-recent-item:hover {
    background: var(--hover-subtle);
    color: var(--text)
}

.ai-search-hints {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 8px;
    font-size: 12px;
    color: var(--muted)
}

.ai-search-hints button {
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--muted2);
    font-size: 11px;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all .1s
}

.ai-search-hints button:hover {
    border-color: var(--accent);
    color: var(--accent)
}

.ai-search-error {
    font-size: 12px;
    color: var(--red);
    padding: 8px;
    background: #ef444414;
    border-radius: 6px
}

@media(max-width: 600px) {
    .ai-search-trigger-text,.ai-search-kbd {
        display:none
    }

    .ai-search-modal {
        top: 10%;
        width: 95vw
    }
}

.sync-modal-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1100;
    background: var(--overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fade-in .15s ease
}

@keyframes fade-in {
    0% {
        opacity: 0
    }

    to {
        opacity: 1
    }
}

.sync-modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 420px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg)
}

.sync-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border)
}

.sync-modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text)
}

.sync-modal-header-actions {
    display: flex;
    align-items: center;
    gap: 8px
}

.sync-modal-close {
    background: none;
    border: none;
    color: var(--muted2);
    font-size: 22px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    min-height: auto
}

.sync-modal-close:hover {
    color: var(--text)
}

.btn-sm {
    padding: 4px 10px;
    font-size: 12px;
    min-height: auto
}

.sync-modal-body {
    overflow-y: auto;
    padding: 12px 20px 20px;
    flex: 1
}

.sync-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 0;
    color: var(--green)
}

.sync-empty p {
    color: var(--muted2);
    font-size: 14px;
    margin: 0
}

.sync-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px
}

.sync-item {
    position: relative;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px
}

.sync-item-info {
    flex: 1;
    min-width: 0
}

.sync-item-tag {
    display: block;
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 600;
    color: var(--accent)
}

.sync-item-name {
    display: block;
    font-size: 12px;
    color: var(--muted2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.sync-item-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600
}

.sync-item-error {
    width: 100%;
    font-size: 11px;
    color: var(--red);
    background: var(--red-dim);
    padding: 6px 10px;
    border-radius: 6px;
    margin-top: 4px
}

.sync-item-remove {
    position: absolute;
    top: 4px;
    right: 6px;
    background: none;
    border: none;
    color: var(--muted);
    font-size: 16px;
    cursor: pointer;
    min-height: auto;
    padding: 2px;
    line-height: 1
}

.sync-item-remove:hover {
    color: var(--red)
}

.spin {
    animation: spin 1s linear infinite
}

@keyframes spin {
    0% {
        transform: rotate(0)
    }

    to {
        transform: rotate(360deg)
    }
}

.offline-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--red-dim);
    color: var(--red);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    transition: opacity .3s ease
}

.offline-indicator-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--red)
}

.sync-badge-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--muted2);
    cursor: pointer;
    padding: 6px;
    min-height: auto;
    transition: all var(--transition-fast)
}

.sync-badge-btn:hover {
    color: var(--text);
    background: var(--hover-subtle)
}

.sync-badge-count {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    background: var(--amber);
    color: #000;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px
}

.topbar {
    height: calc(var(--topbar-h) + env(safe-area-inset-top,0px));
    padding-top: env(safe-area-inset-top,0px);
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding-left: calc(24px + env(safe-area-inset-left,0px));
    padding-right: calc(24px + env(safe-area-inset-right,0px));
    gap: 12px;
    flex-shrink: 0
}

.hamburger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: none;
    border: 1px solid var(--border);
    color: var(--muted2);
    cursor: pointer
}

.hamburger:hover {
    color: var(--text);
    background: var(--hover-subtle)
}

.topbar-title {
    display: flex;
    align-items: center;
    gap: 6px
}

.topbar-breadcrumb {
    font-size: 13px;
    color: var(--muted);
    cursor: pointer
}

.topbar-breadcrumb:hover {
    color: var(--accent)
}

.topbar-breadcrumb-sep {
    font-size: 13px;
    color: var(--muted);
    opacity: .5
}

.topbar-page-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text)
}

.topbar-spacer {
    flex: 1
}

.topbar-actions {
    display: flex;
    align-items: center;
    gap: 8px
}

.role-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border: 1px solid;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: .02em
}

.role-badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0
}

.role-badge-label {
    white-space: nowrap
}

.topbar-avatar-wrapper {
    position: relative
}

.topbar-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg,var(--accent),var(--blue));
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    flex-shrink: 0
}

.avatar-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--card);
    border: 1px solid var(--border-hi);
    border-radius: 10px;
    min-width: 200px;
    z-index: 300;
    animation: fadeDown .15s ease both;
    box-shadow: var(--shadow-lg);
    overflow: hidden
}

.avatar-dropdown-info {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border)
}

.avatar-dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    width: 100%;
    background: none;
    border: none;
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all .1s
}

.avatar-dropdown-item:hover {
    background: var(--hover-subtle)
}

.avatar-dropdown-comfort {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border)
}

.comfort-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    cursor: pointer
}

.comfort-toggle input[type=checkbox] {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    cursor: pointer
}

.comfort-toggle svg {
    color: var(--accent);
    flex-shrink: 0
}

@media(max-width: 900px) {
    .topbar {
        padding-left:calc(16px + env(safe-area-inset-left,0px));
        padding-right: calc(16px + env(safe-area-inset-right,0px));
        gap: 8px
    }

    .hamburger {
        display: flex
    }

    .role-badge-label,.topbar-actions .btn span {
        display: none
    }

    .topbar-actions .btn {
        padding: 7px 10px
    }
}

@media(max-width: 480px) {
    .topbar {
        padding-left:calc(14px + env(safe-area-inset-left,0px));
        padding-right: calc(14px + env(safe-area-inset-right,0px));
        gap: 8px
    }
}

.app-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg)
}

.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden
}

.content {
    flex: 1;
    overflow-y: auto;
    padding: 20px calc(24px + env(safe-area-inset-right,0px)) calc(40px + env(safe-area-inset-bottom,0px)) calc(24px + env(safe-area-inset-left,0px))
}

@media(max-width: 900px) {
    .content {
        padding:16px calc(16px + env(safe-area-inset-right,0px)) calc(32px + env(safe-area-inset-bottom,0px)) calc(16px + env(safe-area-inset-left,0px))
    }
}

@media(max-width: 480px) {
    .content {
        padding:12px calc(12px + env(safe-area-inset-right,0px)) calc(12px + env(safe-area-inset-bottom,0px)) calc(12px + env(safe-area-inset-left,0px))
    }
}

.offline-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 20px;
    background: linear-gradient(135deg,#f59e0b26,#ef44441a);
    border-bottom: 1px solid rgba(245,158,11,.25);
    animation: slideDown .3s ease;
    flex-shrink: 0
}

.offline-banner-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #f59e0b
}

.offline-banner-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: #f59e0b;
    color: #000;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    white-space: nowrap;
    transition: all .15s
}

.offline-banner-btn:hover {
    background: #fbbf24
}

@keyframes slideDown {
    0% {
        transform: translateY(-100%);
        opacity: 0
    }

    to {
        transform: translateY(0);
        opacity: 1
    }
}

@media(max-width: 480px) {
    .offline-banner {
        flex-direction:column;
        padding: 10px 14px;
        gap: 8px
    }

    .offline-banner-btn {
        width: 100%;
        justify-content: center
    }
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap
}

.badge-green {
    color: var(--green);
    background: var(--green-dim)
}

.badge-blue {
    color: var(--blue);
    background: var(--blue-dim)
}

.badge-red {
    color: var(--red);
    background: var(--red-dim)
}

.badge-amber {
    color: var(--amber);
    background: var(--amber-dim)
}

.badge-purple {
    color: var(--purple);
    background: var(--purple-dim)
}

.badge-gray {
    color: var(--muted2);
    background: var(--gray-dim)
}

.badge-cyan {
    color: var(--cyan);
    background: var(--cyan-dim)
}

.badge-default {
    color: var(--muted2);
    background: var(--card2)
}

.new-dashboard {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.new-dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center
}

.new-dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px
}

.dash-span-full {
    grid-column: 1 / -1
}

.dash-span-half {
    grid-column: span 1
}

.dash-widget-wrapper {
    transition: all .15s
}

.dash-widget-editable {
    border: 2px dashed var(--border);
    border-radius: 14px;
    padding: 2px;
    cursor: grab
}

.dash-widget-editable:active {
    cursor: grabbing;
    opacity: .7
}

.dash-widget-editable:hover {
    border-color: var(--accent)
}

.dash-widget-edit-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #0ea5e90f;
    border-radius: 10px 10px 0 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent)
}

.dash-drag-handle {
    cursor: grab;
    color: var(--muted)
}

.dash-widget-edit-title {
    flex: 1
}

.dash-widget-toggle {
    color: var(--muted);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px
}

.dash-widget-toggle:hover {
    color: var(--red);
    background: var(--card)
}

.dash-widget-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 18px 20px;
    cursor: pointer;
    transition: all .15s
}

.dash-widget-card:hover {
    border-color: var(--accent);
    transform: translateY(-1px)
}

.dash-widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px
}

.dash-widget-header h3 {
    font-size: 14px;
    font-weight: 700;
    color: var(--text)
}

.dash-widget-metrics {
    display: flex;
    gap: 0
}

.dash-metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center
}

.dash-metric-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    line-height: 1
}

.dash-metric-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .04em
}

.dash-widget-list {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 18px
}

.dash-widget-link {
    font-size: 11px;
    font-weight: 600;
    color: var(--accent);
    cursor: pointer;
    font-family: var(--font-body)
}

.dash-widget-link:hover {
    text-decoration: underline
}

.dash-widget-empty {
    font-size: 13px;
    color: var(--muted);
    text-align: center;
    padding: 16px
}

.dash-widget-rows {
    display: flex;
    flex-direction: column;
    gap: 2px
}

.dash-widget-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background .1s
}

.dash-widget-row:hover {
    background: var(--hover-subtle)
}

.dash-widget-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap
}

.dash-action-btn {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
    color: var(--text);
    transition: all .15s
}

.dash-action-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
    transform: translateY(-2px)
}

.dash-action-btn svg {
    color: var(--accent)
}

.dash-hidden-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--border)
}

.dash-hidden-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: 10px
}

.dash-hidden-grid {
    display: flex;
    gap: 8px;
    flex-wrap: wrap
}

.dash-hidden-card {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--card2);
    border: 1px dashed var(--border);
    border-radius: 8px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
    transition: all .1s
}

.dash-hidden-card:hover {
    border-color: var(--accent);
    color: var(--accent)
}

@media(max-width: 768px) {
    .new-dashboard-grid {
        grid-template-columns:1fr
    }

    .dash-span-half {
        grid-column: span 1
    }

    .dash-widget-metrics {
        flex-wrap: wrap
    }

    .dash-metric {
        min-width: 50%
    }
}

.stats-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit,minmax(160px,1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden
}

.stat-card {
    background: var(--card);
    padding: 16px 20px
}

.stat-num {
    font-family: var(--font-mono);
    font-size: 28px;
    font-weight: 700;
    color: var(--text);
    line-height: 1
}

.stat-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    margin-top: 4px
}

@media(max-width: 900px) {
    .stats-bar {
        grid-template-columns:repeat(2,1fr)
    }
}

@media(max-width: 480px) {
    .stats-bar {
        padding:12px 14px
    }

    .stat-num {
        font-size: 22px
    }
}

.filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    flex-wrap: wrap
}

.filter-search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 200px;
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0 12px
}

.filter-search-icon {
    color: var(--muted);
    flex-shrink: 0
}

.filter-search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-body);
    padding: 9px 0;
    outline: none
}

.filter-search-input::placeholder {
    color: var(--muted)
}

.filter-select {
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-body);
    padding: 9px 32px 9px 12px;
    cursor: pointer;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center
}

.filter-select:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

@media(max-width: 900px) {
    .filter-bar {
        flex-direction:column;
        align-items: stretch
    }

    .filter-select {
        flex: 1;
        min-width: 140px
    }
}

.table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--card)
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 720px
}

.data-table thead {
    background: var(--card2)
}

.data-table th {
    padding: 10px 14px;
    font-size: 10px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    -webkit-user-select: none;
    user-select: none
}

.data-table th.sortable {
    cursor: pointer
}

.data-table th.sortable:hover {
    color: var(--text)
}

.th-content {
    display: inline-flex;
    align-items: center;
    gap: 4px
}

.data-table td {
    padding: 10px 14px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    color: var(--text)
}

.data-table tbody tr {
    background: var(--card);
    transition: background .1s
}

.data-table tbody tr:hover {
    background: var(--card2)
}

.data-table tbody tr.clickable {
    cursor: pointer
}

.data-table tbody tr:last-child td {
    border-bottom: none
}

.table-empty {
    text-align: center!important;
    padding: 40px 14px!important;
    color: var(--muted)!important;
    font-size: 14px!important
}

.table-footer {
    padding: 12px 14px;
    border-top: 2px solid var(--border-hi);
    background: var(--card2);
    display: flex;
    align-items: center;
    justify-content: space-between
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px
}

.pagination-info {
    font-size: 12px;
    color: var(--muted);
    font-family: var(--font-mono)
}

.pagination-btns {
    display: flex;
    align-items: center;
    gap: 4px
}

.pagination-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-mono);
    transition: all .15s
}

.pagination-btn:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--border-hi);
    background: var(--hover-subtle)
}

.pagination-btn.active {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--accent-dim)
}

.pagination-btn:disabled {
    opacity: .3;
    cursor: default
}

.modal-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #000000b3;
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-backdrop-filter: blur(4px);
    backdrop-filter: blur(4px);
    padding: 20px
}

.modal {
    background: var(--card);
    border: 1px solid var(--border-hi);
    border-radius: 16px;
    padding: 28px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: fadeUp .25s ease both
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px
}

.modal-title {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: var(--text)
}

.modal-close {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all .15s
}

.modal-close:hover {
    background: var(--hover-subtle);
    color: var(--text)
}

.modal-body {
    color: var(--text)
}

.modal-footer {
    margin-top: 22px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px
}

.skeleton {
    background: var(--card2);
    animation: skeletonPulse 1.5s ease-in-out infinite
}

@keyframes skeletonPulse {
    0%,to {
        opacity: .4
    }

    50% {
        opacity: .8
    }
}

.skeleton-table {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px
}

.skeleton-row {
    display: flex;
    gap: 16px
}

.skeleton-row>* {
    flex: 1
}

.fab {
    display: none;
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    z-index: 900;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px #0ea5e966;
    transition: transform var(--transition-fast),box-shadow var(--transition-fast);
    animation: fab-pulse 2s ease-out 1
}

.fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 24px #0ea5e980
}

.fab:active {
    transform: scale(.95)
}

@keyframes fab-pulse {
    0% {
        box-shadow: 0 4px 16px #0ea5e966
    }

    50% {
        box-shadow: 0 4px 24px #0ea5e9b3
    }

    to {
        box-shadow: 0 4px 16px #0ea5e966
    }
}

@media(max-width: 768px) {
    .fab {
        display:flex
    }
}

.asset-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px
}

.page-title {
    font-size: 22px;
    font-weight: 700
}

@media(max-width: 900px) {
    .page-header {
        flex-direction:column;
        align-items: flex-start
    }
}

.sync-pending-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--amber-dim);
    border: 1px solid var(--amber);
    border-radius: var(--radius);
    color: var(--amber);
    font-size: 13px;
    font-weight: 600
}

.card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    animation: fadeUp .35s ease both
}

.card-head {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--card-head-bg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px
}

.card-head-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    text-transform: uppercase;
    letter-spacing: .04em
}

.card-head-subtitle {
    font-size: 12px;
    color: var(--muted);
    margin-top: 2px
}

.card-head-actions {
    display: flex;
    align-items: center;
    gap: 6px
}

.card-body {
    padding: 16px 20px
}

.card:nth-child(1) {
    animation-delay: .04s
}

.card:nth-child(2) {
    animation-delay: .08s
}

.card:nth-child(3) {
    animation-delay: .12s
}

.card:nth-child(4) {
    animation-delay: .16s
}

.tabs-container {
    display: flex;
    flex-direction: column
}

.tabs-bar {
    display: flex;
    gap: 2px;
    padding: 0 24px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    overflow-x: auto
}

.tabs-bar::-webkit-scrollbar {
    height: 0
}

.tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 16px 11px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-body);
    white-space: nowrap;
    transition: all .15s
}

.tab-btn:hover {
    color: var(--muted2)
}

.tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent)
}

.tab-count {
    font-size: 10px;
    font-weight: 700;
    font-family: var(--font-mono);
    background: var(--card2);
    padding: 1px 6px;
    border-radius: 10px
}

.tab-btn.active .tab-count {
    background: var(--accent-dim);
    color: var(--accent)
}

.tab-content {
    padding: 20px 24px
}

@media(max-width: 900px) {
    .tabs-bar {
        padding:0 16px
    }

    .tab-content {
        padding: 16px
    }
}

.timeline {
    display: flex;
    flex-direction: column;
    gap: 0
}

.timeline-event {
    display: flex;
    gap: 12px;
    padding: 14px 0;
    position: relative
}

.timeline-event:not(:last-child):after {
    content: "";
    position: absolute;
    left: 13px;
    top: 42px;
    bottom: -2px;
    width: 2px;
    background: var(--border)
}

.timeline-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--accent)
}

.timeline-icon svg {
    width: 14px;
    height: 14px
}

.timeline-content {
    flex: 1;
    min-width: 0
}

.timeline-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap
}

.timeline-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text)
}

.timeline-time {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono)
}

.timeline-desc {
    font-size: 12px;
    color: var(--muted2);
    margin-top: 4px;
    line-height: 1.5
}

.asset-detail {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.active-rework-banner {
    border: 1px solid var(--red);
    border-radius: 12px;
    background: #ef44440d;
    overflow: hidden
}

.active-rework-banner-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #ef444414;
    color: var(--red);
    font-size: 14px;
    font-weight: 700
}

.active-rework-item {
    padding: 12px 16px;
    border-top: 1px solid rgba(239,68,68,.15)
}

.active-rework-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px
}

.active-rework-type {
    font-size: 13px;
    font-weight: 600;
    color: var(--text)
}

.active-rework-wo {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono)
}

.active-rework-desc {
    font-size: 12px;
    color: var(--muted2);
    line-height: 1.4;
    margin-bottom: 8px
}

.asset-detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    animation: fadeUp .3s ease both
}

.asset-detail-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap
}

.asset-tag {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-dim);
    padding: 4px 10px;
    border-radius: 6px
}

.asset-name {
    font-size: 20px;
    font-weight: 700
}

.asset-detail-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0
}

.overview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px
}

.meta-grid {
    display: flex;
    flex-direction: column;
    gap: 10px
}

.meta-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border)
}

.meta-item:last-child {
    border-bottom: none
}

.meta-label {
    font-size: 12px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .06em
}

.meta-value {
    font-size: 13px;
    font-weight: 500;
    color: var(--text)
}

.doc-list {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.doc-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: all .15s
}

.doc-item[style*=pointer]:hover {
    border-color: var(--accent);
    background: var(--accent-dim)
}

.doc-thumb {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--border)
}

.doc-icon {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    gap: 1px
}

.doc-ext {
    font-size: 8px;
    font-weight: 700;
    font-family: var(--font-mono);
    letter-spacing: .04em;
    opacity: .8
}

.image-preview-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2000;
    background: #000000d9;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    animation: fadeIn .2s ease
}

.image-preview-container {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    cursor: default
}

.image-preview-img {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px
}

.image-preview-close {
    position: absolute;
    top: -12px;
    right: -12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--red);
    color: #fff;
    border: none;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center
}

.integration-tab {
    display: flex;
    flex-direction: column;
    gap: 24px
}

.integration-section {
    padding-bottom: 0
}

.sync-status-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 20px
}

.sync-status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap
}

.sync-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0
}

.sync-dot.synced {
    background: #10b981;
    box-shadow: 0 0 6px #10b98180
}

.sync-dot.pending {
    background: #f59e0b;
    box-shadow: 0 0 6px #f59e0b66
}

.sync-dot.not-synced {
    background: #64748b
}

.pm-list {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.pm-card {
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--surface)
}

.pm-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;
    transition: background .15s
}

.pm-card-header:hover {
    background: var(--hover-subtle)
}

.pm-code {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-dim);
    padding: 2px 8px;
    border-radius: 4px
}

.pm-desc {
    font-size: 13px;
    font-weight: 500;
    color: var(--text)
}

.pm-card-body {
    padding: 12px 16px 16px;
    border-top: 1px solid var(--border)
}

.pm-meta-row {
    display: flex;
    gap: 24px;
    font-size: 12px;
    color: var(--muted2);
    flex-wrap: wrap
}

.pm-meta-row strong {
    color: var(--muted)
}

.pm-materials-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px
}

.pm-materials-table th {
    text-align: left;
    padding: 6px 10px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    font-weight: 600
}

.pm-materials-table td {
    padding: 7px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text2)
}

.pm-materials-table tr:last-child td {
    border-bottom: none
}

.pm-materials-table code {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
    background: var(--accent-dim);
    padding: 1px 5px;
    border-radius: 3px
}

@media(max-width: 900px) {
    .asset-detail-header {
        flex-direction:column
    }

    .overview-grid {
        grid-template-columns: 1fr
    }

    .sync-status-header,.pm-card-header {
        flex-direction: column;
        align-items: flex-start
    }
}

.asset-import-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1100px
}

.asset-import-page .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px
}

.asset-import-page .page-title {
    font-size: 22px;
    font-weight: 700
}

.import-step {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px
}

.import-step .step-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px
}

.step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0
}

.step-title {
    font-size: 15px;
    font-weight: 600
}

.step-description {
    font-size: 13px;
    color: var(--muted);
    margin-bottom: 16px;
    line-height: 1.5
}

.column-list {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(220px,1fr));
    gap: 8px;
    margin-top: 12px
}

.column-item {
    display: flex;
    gap: 6px;
    font-size: 12px;
    padding: 6px 10px;
    background: var(--bg);
    border-radius: 6px;
    border: 1px solid var(--border)
}

.column-item .col-name {
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--accent);
    white-space: nowrap
}

.column-item .col-desc {
    color: var(--muted)
}

.drop-zone {
    border: 2px dashed var(--border);
    border-radius: 12px;
    padding: 48px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    cursor: pointer;
    transition: all .2s;
    background: var(--bg)
}

.drop-zone:hover,.drop-zone.drag-over {
    border-color: var(--accent);
    background: color-mix(in srgb,var(--accent) 5%,var(--bg))
}

.drop-zone .drop-icon {
    color: var(--muted);
    opacity: .6
}

.drop-zone:hover .drop-icon,.drop-zone.drag-over .drop-icon {
    color: var(--accent);
    opacity: 1
}

.drop-zone .drop-text {
    font-size: 14px;
    color: var(--muted);
    text-align: center
}

.drop-zone .drop-text strong {
    color: var(--accent)
}

.drop-zone .drop-hint {
    font-size: 11px;
    color: var(--muted2, var(--muted));
    opacity: .7
}

.file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border)
}

.file-info .file-icon {
    color: var(--accent)
}

.file-info-details {
    flex: 1
}

.file-info-name {
    font-size: 13px;
    font-weight: 600
}

.file-info-meta {
    font-size: 11px;
    color: var(--muted);
    margin-top: 2px
}

.file-info .btn-ghost {
    padding: 4px 8px;
    font-size: 11px
}

.import-summary {
    display: flex;
    gap: 16px;
    padding: 12px 16px;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
    margin-bottom: 12px;
    flex-wrap: wrap
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500
}

.summary-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%
}

.summary-dot.total {
    background: var(--text)
}

.summary-dot.valid {
    background: var(--green)
}

.summary-dot.error {
    background: var(--red)
}

.preview-table-wrap {
    overflow-x: auto;
    border-radius: 10px;
    border: 1px solid var(--border)
}

.preview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px
}

.preview-table th {
    text-align: left;
    padding: 8px 12px;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .03em;
    color: var(--muted);
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    white-space: nowrap
}

.preview-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap
}

.preview-table tr:last-child td {
    border-bottom: none
}

.preview-table tr.row-error {
    background: color-mix(in srgb,var(--red) 6%,transparent)
}

.row-status-valid {
    color: var(--green)
}

.row-status-error {
    color: var(--red);
    cursor: pointer;
    position: relative
}

.row-error-detail td {
    padding: 0!important;
    border-bottom: 1px solid var(--border)!important;
    background: #ef44440f
}

.error-detail-content {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 14px;
    color: var(--red)
}

.error-detail-content svg {
    flex-shrink: 0;
    margin-top: 1px
}

.error-detail-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px
}

.error-detail-item {
    font-size: 11px;
    background: #ef44441a;
    border: 1px solid rgba(239,68,68,.2);
    color: var(--red);
    padding: 2px 8px;
    border-radius: 4px
}

.import-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap
}

.import-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
    text-align: center
}

.import-success .success-icon {
    color: var(--green)
}

.import-success .success-title {
    font-size: 16px;
    font-weight: 600
}

.import-success .success-detail {
    font-size: 13px;
    color: var(--muted)
}

.role-restriction {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 64px 24px;
    text-align: center
}

.role-restriction .restrict-icon {
    color: var(--muted);
    opacity: .5
}

.role-restriction .restrict-title {
    font-size: 16px;
    font-weight: 600
}

.role-restriction .restrict-detail {
    font-size: 13px;
    color: var(--muted)
}

.review-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.role-restricted {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    color: var(--muted)
}

.role-restricted h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text);
    margin-top: 16px;
    margin-bottom: 8px
}

.role-restricted p {
    font-size: 14px;
    max-width: 400px
}

.review-asset-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0!important
}

.review-asset-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--border);
    transition: background .1s
}

.review-asset-item:last-child {
    border-bottom: none
}

.review-asset-item:hover {
    background: var(--card2)
}

.review-asset-info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0
}

.review-asset-tag {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-dim);
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap
}

.review-asset-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap
}

.review-asset-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0
}

@media(max-width: 600px) {
    .review-asset-item {
        flex-direction:column;
        align-items: flex-start
    }

    .review-asset-actions {
        width: 100%
    }

    .review-asset-actions .btn {
        flex: 1
    }
}

.wo-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.wo-list {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.wo-list-item {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 18px;
    cursor: pointer;
    transition: all .15s
}

.wo-list-item:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px #00000014
}

.wo-list-item-top {
    margin-bottom: 6px
}

.wo-list-item-badges {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap
}

.wo-list-item-number {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--font-mono)
}

.wo-list-item-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px
}

.wo-list-item-desc {
    font-size: 12px;
    color: var(--muted2);
    line-height: 1.5;
    margin-bottom: 6px
}

.wo-list-item-meta {
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: var(--muted);
    flex-wrap: wrap
}

.wo-asset-selected {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500
}

.wo-asset-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border-hi);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 8px 24px #0000004d;
    margin-top: 2px
}

.wo-asset-option {
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    transition: background .1s
}

.wo-asset-option:hover {
    background: var(--hover-subtle)
}

.wo-ai-suggest-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    margin: 8px 0;
    border-radius: 8px;
    border: 1px dashed rgba(14,165,233,.3);
    background: #0ea5e90a;
    color: var(--accent);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body);
    transition: all .15s
}

.wo-ai-suggest-btn:hover:not(:disabled) {
    background: #0ea5e91a;
    border-color: var(--accent)
}

.wo-ai-suggest-btn:disabled {
    opacity: .7;
    cursor: wait
}

.wo-ai-reasoning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px;
    margin: 8px 0;
    background: #0ea5e90f;
    border: 1px solid rgba(14,165,233,.15);
    border-radius: 8px;
    font-size: 12px;
    color: var(--accent);
    line-height: 1.5
}

.wo-ai-reasoning svg {
    flex-shrink: 0;
    margin-top: 2px
}

.wo-ai-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 4px;
    background: #0ea5e926;
    color: var(--accent);
    margin-left: 6px;
    vertical-align: middle;
    letter-spacing: .05em
}

@media(max-width: 480px) {
    .wo-list-item {
        padding:12px 14px
    }

    .wo-list-item-meta {
        flex-direction: column;
        gap: 4px
    }
}

.fr-fields {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.fr-field-wrapper {
    overflow: hidden;
    transition: max-height .2s ease,opacity .2s ease,margin .2s ease
}

.fr-field-visible {
    max-height: 500px;
    opacity: 1
}

.fr-field-hidden {
    max-height: 0;
    opacity: 0;
    margin: 0
}

.fr-field-conditional.fr-field-visible {
    border-left: 2px solid var(--accent);
    padding-left: 12px;
    margin-left: 4px
}

.fr-group {
    display: flex;
    flex-direction: column;
    gap: 6px
}

.fr-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text2)
}

.fr-req {
    color: var(--red)
}

.fr-help {
    font-size: 11px;
    color: var(--muted)
}

.fr-input,.fr-textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 15px;
    background: var(--card2);
    color: var(--text);
    font-family: var(--font-body);
    transition: border-color var(--transition-fast);
    -webkit-appearance: none
}

.fr-input:focus,.fr-textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.fr-input::placeholder,.fr-textarea::placeholder {
    color: var(--muted)
}

.fr-input:disabled,.fr-textarea:disabled {
    opacity: .7;
    cursor: default
}

.fr-textarea {
    min-height: 80px;
    resize: vertical
}

.fr-input[type=date] {
    min-height: 44px
}

select.fr-input {
    min-height: 44px;
    cursor: pointer
}

.fr-section {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    padding: 12px 0 6px;
    border-bottom: 2px solid var(--border);
    margin-top: 4px
}

.fr-options {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.fr-option {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--text);
    cursor: pointer;
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card2);
    transition: border-color var(--transition-fast),background var(--transition-fast);
    min-height: 44px
}

.fr-option:has(input:checked) {
    border-color: var(--accent);
    background: var(--accent-dim)
}

.fr-option input {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
    flex-shrink: 0
}

.fr-option-single {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card2);
    min-height: 44px
}

.fr-option-single:has(input:checked) {
    border-color: var(--accent);
    background: var(--accent-dim)
}

.fr-file-input {
    padding: 10px;
    font-size: 13px;
    color: var(--text)
}

.fr-photo-preview {
    max-width: 100%;
    max-height: 200px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    object-fit: contain;
    margin-top: 4px
}

.fr-signature-pad {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px;
    background: var(--card2);
    min-height: 60px
}

.fr-sig-img {
    max-width: 100%;
    max-height: 80px
}

.fr-sigpad-wrap {
    position: relative
}

.fr-sigpad-canvas {
    width: 100%;
    height: 120px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--card2);
    cursor: crosshair;
    touch-action: none
}

.fr-sigpad-clear {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 11px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--card);
    color: var(--muted);
    cursor: pointer
}

.fr-sigpad-clear:hover {
    color: var(--red);
    border-color: var(--red)
}

.fr-muted {
    font-size: 12px;
    color: var(--muted)
}

@media(max-width: 480px) {
    .fr-input,.fr-textarea {
        font-size:16px;
        padding: 14px
    }

    .fr-option {
        padding: 12px 14px;
        min-height: 48px
    }

    .fr-label {
        font-size: 14px
    }
}

.ffm-template-list {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.ffm-template-item {
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    background: var(--card2);
    transition: border-color var(--transition-fast),background var(--transition-fast)
}

.ffm-template-item:hover {
    border-color: var(--accent);
    background: var(--accent-dim)
}

.ffm-template-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 2px
}

.ffm-template-desc {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 4px
}

.ffm-template-meta {
    font-size: 11px;
    color: var(--muted)
}

.ffm-empty {
    text-align: center;
    color: var(--muted);
    padding: 20px;
    font-size: 13px
}

.ffm-form {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.ffm-back {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0
}

.ffm-back:hover {
    text-decoration: underline
}

.ffm-desc {
    font-size: 12px;
    color: var(--muted);
    margin: 0
}

.ffm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid var(--border);
    position: sticky;
    bottom: 0;
    background: var(--card);
    margin: 0 -20px -20px;
    padding: 12px 20px
}

.fvm-content {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.fvm-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--muted)
}

.fvm-by,.fvm-date {
    font-size: 12px;
    color: var(--muted)
}

.wo-forms-section {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--border)
}

.wo-forms-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px
}

.wo-forms-header h4 {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted2);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin: 0
}

.wo-forms-list {
    display: flex;
    flex-direction: column;
    gap: 6px
}

.wo-form-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    background: var(--card2);
    font-size: 12px;
    transition: border-color var(--transition-fast)
}

.wo-form-item:hover {
    border-color: var(--border-hi)
}

.wo-form-item-name {
    flex: 1;
    font-weight: 500;
    color: var(--text)
}

.wo-form-item-by {
    color: var(--muted);
    font-size: 11px
}

.wo-forms-empty {
    font-size: 12px;
    color: var(--muted);
    padding: 8px 0
}

@media(max-width: 480px) {
    .ffm-actions {
        flex-direction:column
    }

    .ffm-actions .btn {
        width: 100%;
        justify-content: center
    }
}

.wo-detail-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.wo-detail-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border)
}

.wo-detail-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
    align-items: start
}

.wo-detail-main,.wo-detail-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px
}

.wo-detail-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px
}

.wo-detail-meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text)
}

.wo-detail-meta-item svg {
    color: var(--muted);
    flex-shrink: 0
}

.wo-detail-meta-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    min-width: 70px
}

.wo-detail-response {
    margin-top: 16px;
    padding: 12px 16px;
    background: #10b9810f;
    border: 1px solid rgba(16,185,129,.15);
    border-radius: 10px
}

.wo-detail-response h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--green);
    margin-bottom: 6px
}

.wo-detail-response p {
    font-size: 13px;
    color: var(--text);
    line-height: 1.6
}

.wo-detail-response-date {
    font-size: 11px;
    color: var(--muted);
    margin-top: 6px;
    display: block
}

.wo-detail-materials {
    display: flex;
    flex-direction: column;
    gap: 6px
}

.wo-detail-material-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 10px;
    background: var(--card2);
    border-radius: 6px;
    font-size: 13px
}

.wo-detail-documents {
    display: flex;
    flex-direction: column;
    gap: 6px
}

.wo-detail-doc-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--card2);
    border-radius: 6px;
    font-size: 13px
}

.wo-detail-doc-row svg {
    color: var(--muted);
    flex-shrink: 0
}

.wo-detail-assignees {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.wo-detail-assignee {
    display: flex;
    align-items: center;
    gap: 10px
}

.wo-detail-assignee-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg,var(--accent),var(--blue));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0
}

.wo-detail-timeline {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    padding-left: 20px
}

.wo-detail-timeline:before {
    content: "";
    position: absolute;
    left: 5px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: var(--border)
}

.wo-detail-timeline-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    position: relative
}

.wo-detail-timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    position: absolute;
    left: -20px;
    top: 2px;
    border: 2px solid var(--surface)
}

@media(max-width: 900px) {
    .wo-detail-grid,.wo-detail-meta-grid {
        grid-template-columns:1fr
    }
}

.loc-tree-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.loc-view-toggle {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden
}

.loc-view-btn {
    padding: 6px 10px;
    color: var(--muted2);
    cursor: pointer;
    transition: all .1s;
    display: flex;
    align-items: center
}

.loc-view-btn:hover {
    color: var(--text);
    background: var(--hover-subtle)
}

.loc-view-btn.active {
    color: var(--accent);
    background: #0ea5e91a
}

.loc-tree-row {
    cursor: pointer
}

.loc-tree {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px
}

.loc-tree-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    transition: background .1s;
    font-size: 13px
}

.loc-tree-row:hover {
    background: var(--hover-subtle)
}

.loc-tree-toggle {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: var(--muted);
    flex-shrink: 0;
    cursor: pointer
}

.loc-tree-toggle:hover {
    background: var(--card2);
    color: var(--text)
}

.loc-tree-name {
    font-weight: 500;
    color: var(--text)
}

.loc-tree-code {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--muted);
    background: var(--card2);
    padding: 1px 5px;
    border-radius: 3px
}

.loc-tree-count {
    font-size: 10px;
    color: var(--muted);
    background: var(--card2);
    padding: 1px 6px;
    border-radius: 10px
}

.loc-tree-actions {
    display: none;
    margin-left: auto;
    gap: 2px
}

.loc-tree-row:hover .loc-tree-actions {
    display: flex
}

.loc-tree-action {
    padding: 3px;
    border-radius: 4px;
    color: var(--muted);
    cursor: pointer
}

.loc-tree-action:hover {
    background: var(--card2);
    color: var(--accent)
}

.loc-tree-action-danger:hover {
    color: var(--red)
}

.loc-tree-children {
    padding-left: 28px;
    border-left: 1px solid var(--border);
    margin-left: 10px
}

.loc-detail-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.loc-detail-topbar {
    display: flex;
    align-items: center;
    gap: 8px
}

.loc-breadcrumb {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
    flex-wrap: wrap
}

.loc-breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 2px;
    color: var(--accent);
    cursor: pointer
}

.loc-breadcrumb-item:hover {
    text-decoration: underline
}

.loc-breadcrumb-current {
    font-weight: 600;
    color: var(--text)
}

.loc-detail-header {
    display: flex;
    align-items: center;
    gap: 10px
}

.loc-detail-grid {
    display: grid;
    grid-template-columns: 1fr 260px;
    gap: 16px;
    align-items: start
}

.loc-detail-main,.loc-detail-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px
}

.loc-children-list {
    display: flex;
    flex-direction: column;
    gap: 4px
}

.loc-child-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: background .1s
}

.loc-child-row:hover {
    background: var(--hover-subtle)
}

.loc-info-list {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.loc-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px
}

.loc-info-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    min-width: 60px
}

@media(max-width: 900px) {
    .loc-detail-grid {
        grid-template-columns:1fr
    }
}

.loc-import-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.loc-import-topbar {
    display: flex;
    align-items: center;
    gap: 12px
}

.loc-import-preview {
    overflow-x: auto;
    margin-top: 8px
}

.loc-import-preview table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px
}

.loc-import-preview th {
    text-align: left;
    padding: 6px 10px;
    background: var(--card2);
    color: var(--muted);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .05em;
    border-bottom: 1px solid var(--border)
}

.loc-import-preview td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text)
}

.loc-import-preview tr:hover td {
    background: var(--hover-subtle)
}

.loc-import-errors {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 200px;
    overflow-y: auto
}

.loc-import-error {
    font-size: 12px;
    color: var(--red);
    padding: 4px 8px;
    background: #ef44440f;
    border-radius: 4px
}

.role-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.role-app-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background .1s
}

@media(max-width: 600px) {
    .role-app-grid {
        grid-template-columns:repeat(2,1fr)
    }
}

.role-detail-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.role-detail-topbar {
    display: flex;
    align-items: center;
    gap: 8px
}

.role-detail-header {
    display: flex;
    align-items: flex-start;
    gap: 12px
}

.role-detail-grid,.role-detail-main {
    display: flex;
    flex-direction: column;
    gap: 12px
}

.role-app-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px
}

.role-app-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    background: var(--card2);
    color: var(--muted);
    border: 1px solid var(--border)
}

.role-app-badge.active {
    background: #0ea5e91a;
    color: var(--accent);
    border-color: #0ea5e94d
}

.role-app-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 6px
}

.role-app-check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px
}

.role-app-check:hover {
    background: var(--hover-subtle)
}

.role-app-check input {
    accent-color: var(--accent)
}

/*!
 * TOAST UI ImageEditor
 * @version 3.15.3
 * @license MIT
 */
body>textarea {
    position: fixed!important
}

.tui-image-editor-container {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    min-height: 300px;
    height: 100%;
    position: relative;
    background-color: #282828;
    overflow: hidden;
    letter-spacing: .3px
}

.tui-image-editor-container div,.tui-image-editor-container ul,.tui-image-editor-container label,.tui-image-editor-container input,.tui-image-editor-container li {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -ms-user-select: none;
    -moz-user-select: -moz-none;
    -khtml-user-select: none;
    -webkit-user-select: none;
    user-select: none
}

.tui-image-editor-container .tui-image-editor-header {
    min-width: 533px;
    position: absolute;
    background-color: #151515;
    top: 0;
    width: 100%
}

.tui-image-editor-container .tui-image-editor-header-buttons,.tui-image-editor-container .tui-image-editor-controls-buttons {
    float: right;
    margin: 8px
}

.tui-image-editor-container .tui-image-editor-header-logo,.tui-image-editor-container .tui-image-editor-controls-logo {
    float: left;
    width: 30%;
    padding: 17px
}

.tui-image-editor-container .tui-image-editor-controls-logo,.tui-image-editor-container .tui-image-editor-controls-buttons {
    width: 270px;
    height: 100%;
    display: none
}

.tui-image-editor-container .tui-image-editor-header-buttons button,.tui-image-editor-container .tui-image-editor-header-buttons div,.tui-image-editor-container .tui-image-editor-controls-buttons button,.tui-image-editor-container .tui-image-editor-controls-buttons div {
    display: inline-block;
    position: relative;
    width: 120px;
    height: 40px;
    padding: 0;
    line-height: 40px;
    outline: none;
    border-radius: 20px;
    border: 1px solid #ddd;
    font-family: Noto Sans,sans-serif;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    vertical-align: middle;
    letter-spacing: .3px;
    text-align: center
}

.tui-image-editor-container .tui-image-editor-download-btn {
    background-color: #fdba3b;
    border-color: #fdba3b;
    color: #fff
}

.tui-image-editor-container .tui-image-editor-load-btn {
    position: absolute;
    left: 0;
    right: 0;
    display: inline-block;
    top: 0;
    bottom: 0;
    width: 100%;
    cursor: pointer;
    opacity: 0
}

.tui-image-editor-container .tui-image-editor-main-container {
    position: absolute;
    width: 100%;
    top: 0;
    bottom: 64px
}

.tui-image-editor-container .tui-image-editor-main {
    position: absolute;
    text-align: center;
    top: 64px;
    bottom: 0;
    right: 0;
    left: 0
}

.tui-image-editor-container .tui-image-editor-wrap {
    position: absolute;
    bottom: 0;
    width: 100%;
    overflow: auto
}

.tui-image-editor-container .tui-image-editor-wrap .tui-image-editor-size-wrap {
    display: table;
    width: 100%;
    height: 100%
}

.tui-image-editor-container .tui-image-editor-wrap .tui-image-editor-size-wrap .tui-image-editor-align-wrap {
    display: table-cell;
    vertical-align: middle
}

.tui-image-editor-container .tui-image-editor {
    position: relative;
    display: inline-block
}

.tui-image-editor-container .tui-image-editor-menu,.tui-image-editor-container .tui-image-editor-help-menu {
    width: auto;
    list-style: none;
    padding: 0;
    margin: 0 auto;
    display: table-cell;
    text-align: center;
    vertical-align: middle;
    white-space: nowrap
}

.tui-image-editor-container .tui-image-editor-menu>.tui-image-editor-item,.tui-image-editor-container .tui-image-editor-help-menu>.tui-image-editor-item {
    position: relative;
    display: inline-block;
    border-radius: 2px;
    padding: 7px 8px 3px;
    cursor: pointer;
    margin: 0 4px
}

.tui-image-editor-container .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:hover:before,.tui-image-editor-container .tui-image-editor-help-menu>.tui-image-editor-item[tooltip-content]:hover:before {
    content: "";
    position: absolute;
    display: inline-block;
    margin: 0 auto;
    width: 0;
    height: 0;
    border-right: 7px solid transparent;
    border-top: 7px solid #2f2f2f;
    border-left: 7px solid transparent;
    left: 13px;
    top: -2px
}

.tui-image-editor-container .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:hover:after,.tui-image-editor-container .tui-image-editor-help-menu>.tui-image-editor-item[tooltip-content]:hover:after {
    content: attr(tooltip-content);
    position: absolute;
    display: inline-block;
    background-color: #2f2f2f;
    color: #fff;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: lighter;
    border-radius: 3px;
    max-height: 23px;
    top: -25px;
    left: 0;
    min-width: 24px
}

.tui-image-editor-container .tui-image-editor-menu>.tui-image-editor-item.active,.tui-image-editor-container .tui-image-editor-help-menu>.tui-image-editor-item.active {
    background-color: #fff;
    transition: all .3s ease
}

.tui-image-editor-container .tui-image-editor-wrap {
    position: absolute
}

.tui-image-editor-container .tui-image-editor-grid-visual {
    display: none;
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid rgba(255,255,255,.7)
}

.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-flip .tui-image-editor,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-rotate .tui-image-editor {
    transition: none
}

.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-flip .tui-image-editor-grid-visual,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-rotate .tui-image-editor-grid-visual,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-resize .tui-image-editor-grid-visual {
    display: block
}

.tui-image-editor-container .tui-image-editor-grid-visual table {
    width: 100%;
    height: 100%;
    border-collapse: collapse
}

.tui-image-editor-container .tui-image-editor-grid-visual table td {
    border: 1px solid rgba(255,255,255,.3)
}

.tui-image-editor-container .tui-image-editor-grid-visual table td.dot:before {
    content: "";
    position: absolute;
    box-sizing: border-box;
    width: 10px;
    height: 10px;
    border: 0;
    box-shadow: 0 0 1px #0000004d;
    border-radius: 100%;
    background-color: #fff
}

.tui-image-editor-container .tui-image-editor-grid-visual table td.dot.left-top:before {
    top: -5px;
    left: -5px
}

.tui-image-editor-container .tui-image-editor-grid-visual table td.dot.right-top:before {
    top: -5px;
    right: -5px
}

.tui-image-editor-container .tui-image-editor-grid-visual table td.dot.left-bottom:before {
    bottom: -5px;
    left: -5px
}

.tui-image-editor-container .tui-image-editor-grid-visual table td.dot.right-bottom:before {
    bottom: -5px;
    right: -5px
}

.tui-image-editor-container .tui-image-editor-submenu {
    display: none;
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 150px;
    white-space: nowrap;
    z-index: 2
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-button:hover svg>use.active {
    display: block
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-item li {
    display: inline-block;
    vertical-align: top
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-item .tui-image-editor-newline {
    display: block;
    margin-top: 0
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-item .tui-image-editor-button {
    position: relative;
    cursor: pointer;
    display: inline-block;
    font-weight: 400;
    font-size: 11px;
    margin: 0 9px
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-item .tui-image-editor-button.preset {
    margin: 0 9px 20px 5px
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-item label>span {
    display: inline-block;
    cursor: pointer;
    padding-top: 5px;
    font-family: Noto Sans,sans-serif;
    font-size: 11px
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-item .tui-image-editor-button.apply label,.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-item .tui-image-editor-button.cancel label {
    vertical-align: 7px
}

.tui-image-editor-container .tui-image-editor-submenu>div {
    display: none;
    vertical-align: bottom
}

.tui-image-editor-container .tui-image-editor-submenu .tui-image-editor-submenu-style {
    opacity: .95;
    z-index: -1;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: block
}

.tui-image-editor-container .tui-image-editor-partition>div {
    width: 1px;
    height: 52px;
    border-left: 1px solid #3c3c3c;
    margin: 0 8px
}

.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-filter .tui-image-editor-partition>div {
    height: 108px;
    margin: 0 29px 0 0
}

.tui-image-editor-container .tui-image-editor-submenu-align {
    text-align: left;
    margin-right: 30px
}

.tui-image-editor-container .tui-image-editor-submenu-align label>span {
    width: 55px;
    white-space: nowrap
}

.tui-image-editor-container .tui-image-editor-submenu-align:first-child {
    margin-right: 0
}

.tui-image-editor-container .tui-image-editor-submenu-align:first-child label>span {
    width: 70px
}

.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-crop .tui-image-editor-submenu>div.tui-image-editor-menu-crop,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-resize .tui-image-editor-submenu>div.tui-image-editor-menu-resize,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-flip .tui-image-editor-submenu>div.tui-image-editor-menu-flip,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-rotate .tui-image-editor-submenu>div.tui-image-editor-menu-rotate,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-shape .tui-image-editor-submenu>div.tui-image-editor-menu-shape,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-text .tui-image-editor-submenu>div.tui-image-editor-menu-text,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-mask .tui-image-editor-submenu>div.tui-image-editor-menu-mask,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-icon .tui-image-editor-submenu>div.tui-image-editor-menu-icon,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-draw .tui-image-editor-submenu>div.tui-image-editor-menu-draw,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-filter .tui-image-editor-submenu>div.tui-image-editor-menu-filter,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-zoom .tui-image-editor-submenu>div.tui-image-editor-menu-zoom {
    display: table-cell
}

.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-crop .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-resize .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-flip .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-rotate .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-shape .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-text .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-mask .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-icon .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-draw .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-filter .tui-image-editor-submenu,.tui-image-editor-container .tui-image-editor-main.tui-image-editor-menu-zoom .tui-image-editor-submenu {
    display: table
}

.tui-image-editor-container .tui-image-editor-help-menu {
    list-style: none;
    padding: 0;
    margin: 0 auto;
    text-align: center;
    vertical-align: middle;
    border-radius: 20px;
    background-color: #ffffff0f;
    z-index: 2;
    position: absolute
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history {
    display: none;
    background-color: #fff;
    color: #444;
    position: absolute;
    width: 196px;
    height: 276px;
    padding: 4px 2px;
    box-shadow: 0 2px 6px #00000026;
    cursor: auto;
    transform: translate(calc(-50% + 12px))
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list {
    height: 268px;
    padding: 0;
    overflow: hidden scroll;
    list-style: none
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item {
    height: 24px;
    font-size: 11px;
    line-height: 24px
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item .tui-image-editor-history-item {
    position: relative;
    height: 24px;
    cursor: pointer
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item .tui-image-editor-history-item svg {
    width: 24px;
    height: 24px
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item .tui-image-editor-history-item span {
    display: inline-block;
    width: 128px;
    height: 24px;
    text-align: left
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item .tui-image-editor-history-item .history-item-icon {
    display: inline-block;
    width: 24px;
    height: 24px;
    position: absolute;
    top: 6px;
    left: 6px
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item .tui-image-editor-history-item .history-item-checkbox {
    display: none;
    width: 24px;
    height: 24px;
    position: absolute;
    top: 5px;
    right: -6px
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item.selected-item {
    background-color: #7777771f
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item.selected-item .history-item-checkbox {
    display: inline-block
}

.tui-image-editor-container .tui-image-editor-help-menu .tie-panel-history .history-list .history-item.disabled-item {
    color: #333;
    opacity: .3
}

.tui-image-editor-container .tui-image-editor-help-menu .opened .tie-panel-history {
    display: block
}

.tui-image-editor-container .tui-image-editor-help-menu .opened .tie-panel-history:before {
    content: "";
    position: absolute;
    display: inline-block;
    margin: 0 auto;
    width: 0;
    height: 0
}

.tui-image-editor-container .filter-color-item {
    display: inline-block
}

.tui-image-editor-container .filter-color-item .tui-image-editor-checkbox {
    display: block
}

.tui-image-editor-container .tui-image-editor-checkbox-wrap {
    display: inline-block!important;
    text-align: left
}

.tui-image-editor-container .tui-image-editor-checkbox-wrap.fixed-width {
    width: 187px;
    white-space: normal
}

.tui-image-editor-container .tui-image-editor-checkbox {
    display: inline-block;
    margin: 1px 0
}

.tui-image-editor-container .tui-image-editor-checkbox input {
    width: 14px;
    height: 14px;
    opacity: 0
}

.tui-image-editor-container .tui-image-editor-checkbox>label>span {
    color: #fff;
    height: 14px;
    position: relative
}

.tui-image-editor-container .tui-image-editor-checkbox input+label:before,.tui-image-editor-container .tui-image-editor-checkbox>label>span:before {
    content: "";
    position: absolute;
    width: 14px;
    height: 14px;
    background-color: #fff;
    top: 6px;
    left: -19px;
    display: inline-block;
    margin: 0;
    text-align: center;
    font-size: 11px;
    border: 0;
    border-radius: 2px;
    padding-top: 1px;
    box-sizing: border-box
}

.tui-image-editor-container .tui-image-editor-checkbox input[type=checkbox]:checked+span:before {
    background-size: cover;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAAXNSR0IArs4c6QAAAMBJREFUKBWVkjEOwjAMRe2WgZW7IIHEDdhghhuwcQ42rlJugAQS54Cxa5cq1QM5TUpByZfS2j9+dlJVt/tX5ZxbS4ZU9VLkQvSHKTIGRaVJYFmKrBbTCJxE2UgCdDzMZDkHrOV6b95V0US6UmgKodujEZbJg0B0ZgEModO5lrY1TMQf1TpyJGBEjD+E2NPN7ukIUDiF/BfEXgRiGEw8NgkffYGYwCi808fpn/6OvfUfsDr/Vc1IfRf8sKnFVqeiVQfDu0tf/nWH9gAAAABJRU5ErkJggg==)
}

.tui-image-editor-container .tui-image-editor-selectlist-wrap {
    position: relative
}

.tui-image-editor-container .tui-image-editor-selectlist-wrap select {
    width: 100%;
    height: 28px;
    margin-top: 4px;
    border: 0;
    outline: 0;
    border-radius: 0;
    border: 1px solid #cbdbdb;
    background-color: #fff;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    padding: 0 7px 0 10px
}

.tui-image-editor-container .tui-image-editor-selectlist-wrap .tui-image-editor-selectlist {
    display: none;
    position: relative;
    top: -1px;
    border: 1px solid #ccc;
    background-color: #fff;
    border-top: 0;
    padding: 4px 0
}

.tui-image-editor-container .tui-image-editor-selectlist-wrap .tui-image-editor-selectlist li {
    display: block;
    text-align: left;
    padding: 7px 10px;
    font-family: Noto Sans,sans-serif
}

.tui-image-editor-container .tui-image-editor-selectlist-wrap .tui-image-editor-selectlist li:hover {
    background-color: #515ce60d
}

.tui-image-editor-container .tui-image-editor-selectlist-wrap:before {
    content: "";
    position: absolute;
    display: inline-block;
    width: 14px;
    height: 14px;
    right: 5px;
    top: 10px;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAAAXNSR0IArs4c6QAAAHlJREFUKBVjYBgFOEOAEVkmPDxc89+/f6eAYjzI4kD2FyYmJrOVK1deh4kzwRggGiQBVJCELAZig8SQNYHEmEEEMrh69eo1HR0dfqCYJUickZGxf9WqVf3IakBsFBthklpaWmVA9mEQhrJhUoTp0NBQCRAmrHL4qgAAuu4cWZOZIGsAAAAASUVORK5CYII=);
    background-size: cover
}

.tui-image-editor-container .tui-image-editor-selectlist-wrap select::-ms-expand {
    display: none
}

.tui-image-editor-container .tui-image-editor-virtual-range-bar .tui-image-editor-disabled,.tui-image-editor-container .tui-image-editor-virtual-range-subbar .tui-image-editor-disabled,.tui-image-editor-container .tui-image-editor-virtual-range-pointer .tui-image-editor-disabled {
    backbround-color: #f00
}

.tui-image-editor-container .tui-image-editor-range {
    position: relative;
    top: 5px;
    width: 166px;
    height: 17px;
    display: inline-block
}

.tui-image-editor-container .tui-image-editor-virtual-range-bar {
    top: 7px;
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: #666
}

.tui-image-editor-container .tui-image-editor-virtual-range-subbar {
    position: absolute;
    height: 100%;
    left: 0;
    right: 0;
    background-color: #d1d1d1
}

.tui-image-editor-container .tui-image-editor-virtual-range-pointer {
    position: absolute;
    cursor: pointer;
    top: -5px;
    left: 0;
    width: 12px;
    height: 12px;
    background-color: #fff;
    border-radius: 100%
}

.tui-image-editor-container .tui-image-editor-range-wrap {
    display: inline-block;
    margin-left: 4px
}

.tui-image-editor-container .tui-image-editor-range-wrap.short .tui-image-editor-range {
    width: 100px
}

.tui-image-editor-container .color-picker-control .tui-image-editor-range {
    width: 108px;
    margin-left: 10px
}

.tui-image-editor-container .color-picker-control .tui-image-editor-virtual-range-pointer {
    background-color: #333
}

.tui-image-editor-container .color-picker-control .tui-image-editor-virtual-range-bar {
    background-color: #ccc
}

.tui-image-editor-container .color-picker-control .tui-image-editor-virtual-range-subbar {
    background-color: #606060
}

.tui-image-editor-container .tui-image-editor-range-wrap.tui-image-editor-newline.short {
    margin-top: -2px;
    margin-left: 19px
}

.tui-image-editor-container .tui-image-editor-range-wrap.tui-image-editor-newline.short label {
    color: #8e8e8e;
    font-weight: 400
}

.tui-image-editor-container .tui-image-editor-range-wrap label {
    vertical-align: baseline;
    font-size: 11px;
    margin-right: 7px;
    color: #fff
}

.tui-image-editor-container .tui-image-editor-range-value {
    cursor: default;
    width: 40px;
    height: 24px;
    outline: none;
    border-radius: 2px;
    box-shadow: none;
    border: 1px solid #d5d5d5;
    text-align: center;
    background-color: #1c1c1c;
    color: #fff;
    font-weight: lighter;
    vertical-align: baseline;
    font-family: Noto Sans,sans-serif;
    margin-top: 15px;
    margin-left: 4px
}

.tui-image-editor-container .tui-image-editor-controls {
    position: absolute;
    background-color: #151515;
    width: 100%;
    height: 64px;
    display: table;
    bottom: 0;
    z-index: 2
}

.tui-image-editor-container .tui-image-editor-icpartition {
    display: inline-block;
    background-color: #444;
    width: 1px;
    height: 24px
}

.tui-image-editor-container.left .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:before {
    left: 28px;
    top: 11px;
    border-right: 7px solid #2f2f2f;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent
}

.tui-image-editor-container.left .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:after {
    top: 7px;
    left: 42px;
    white-space: nowrap
}

.tui-image-editor-container.left .tui-image-editor-submenu {
    left: 0;
    height: 100%;
    width: 248px
}

.tui-image-editor-container.left .tui-image-editor-main-container {
    left: 64px;
    width: calc(100% - 64px);
    height: 100%
}

.tui-image-editor-container.left .tui-image-editor-controls {
    width: 64px;
    height: 100%;
    display: table
}

.tui-image-editor-container.left .tui-image-editor-menu,.tui-image-editor-container.right .tui-image-editor-menu {
    white-space: inherit
}

.tui-image-editor-container.left .tui-image-editor-submenu,.tui-image-editor-container.right .tui-image-editor-submenu {
    white-space: normal
}

.tui-image-editor-container.left .tui-image-editor-submenu>div,.tui-image-editor-container.right .tui-image-editor-submenu>div {
    vertical-align: middle
}

.tui-image-editor-container.left .tui-image-editor-controls li,.tui-image-editor-container.right .tui-image-editor-controls li {
    display: inline-block;
    margin: 4px auto
}

.tui-image-editor-container.left .tui-image-editor-icpartition,.tui-image-editor-container.right .tui-image-editor-icpartition {
    position: relative;
    top: -7px;
    width: 24px;
    height: 1px
}

.tui-image-editor-container.left .tui-image-editor-submenu .tui-image-editor-partition,.tui-image-editor-container.right .tui-image-editor-submenu .tui-image-editor-partition {
    display: block;
    width: 75%;
    margin: auto
}

.tui-image-editor-container.left .tui-image-editor-submenu .tui-image-editor-partition>div,.tui-image-editor-container.right .tui-image-editor-submenu .tui-image-editor-partition>div {
    border-left: 0;
    height: 10px;
    border-bottom: 1px solid #3c3c3c;
    width: 100%;
    margin: 0
}

.tui-image-editor-container.left .tui-image-editor-submenu .tui-image-editor-submenu-align,.tui-image-editor-container.right .tui-image-editor-submenu .tui-image-editor-submenu-align {
    margin-right: 0
}

.tui-image-editor-container.left .tui-image-editor-submenu .tui-image-editor-submenu-item li,.tui-image-editor-container.right .tui-image-editor-submenu .tui-image-editor-submenu-item li {
    margin-top: 15px
}

.tui-image-editor-container.left .tui-image-editor-submenu .tui-image-editor-submenu-item .tui-colorpicker-clearfix li,.tui-image-editor-container.right .tui-image-editor-submenu .tui-image-editor-submenu-item .tui-colorpicker-clearfix li {
    margin-top: 0
}

.tui-image-editor-container.left .tui-image-editor-checkbox-wrap.fixed-width,.tui-image-editor-container.right .tui-image-editor-checkbox-wrap.fixed-width {
    width: 182px;
    white-space: normal
}

.tui-image-editor-container.left .tui-image-editor-range-wrap.tui-image-editor-newline label.range,.tui-image-editor-container.right .tui-image-editor-range-wrap.tui-image-editor-newline label.range {
    display: block;
    text-align: left;
    width: 75%;
    margin: auto
}

.tui-image-editor-container.left .tui-image-editor-range,.tui-image-editor-container.right .tui-image-editor-range {
    width: 136px
}

.tui-image-editor-container.right .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:before {
    left: -3px;
    top: 11px;
    border-left: 7px solid #2f2f2f;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent
}

.tui-image-editor-container.right .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:after {
    top: 7px;
    left: unset;
    right: 43px;
    white-space: nowrap
}

.tui-image-editor-container.right .tui-image-editor-submenu {
    right: 0;
    height: 100%;
    width: 248px
}

.tui-image-editor-container.right .tui-image-editor-main-container {
    right: 64px;
    width: calc(100% - 64px);
    height: 100%
}

.tui-image-editor-container.right .tui-image-editor-controls {
    right: 0;
    width: 64px;
    height: 100%;
    display: table
}

.tui-image-editor-container.top .tui-image-editor-submenu .tui-image-editor-partition.only-left-right,.tui-image-editor-container.bottom .tui-image-editor-submenu .tui-image-editor-partition.only-left-right {
    display: none
}

.tui-image-editor-container.bottom .tui-image-editor-submenu>div {
    padding-bottom: 24px
}

.tui-image-editor-container.top .color-picker-control .triangle {
    top: -8px;
    border-right: 7px solid transparent;
    border-top: 0;
    border-left: 7px solid transparent;
    border-bottom: 8px solid #fff
}

.tui-image-editor-container.top .tui-image-editor-size-wrap {
    height: 100%
}

.tui-image-editor-container.top .tui-image-editor-main-container {
    bottom: 0
}

.tui-image-editor-container.top .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:before {
    left: 13px;
    border-top: 0;
    border-bottom: 7px solid #2f2f2f;
    top: 33px
}

.tui-image-editor-container.top .tui-image-editor-menu>.tui-image-editor-item[tooltip-content]:after {
    top: 38px
}

.tui-image-editor-container.top .tui-image-editor-submenu {
    top: 0;
    bottom: auto
}

.tui-image-editor-container.top .tui-image-editor-submenu>div {
    padding-top: 24px;
    vertical-align: top
}

.tui-image-editor-container.top .tui-image-editor-controls-logo,.tui-image-editor-container.top .tui-image-editor-controls-buttons {
    display: table-cell
}

.tui-image-editor-container.top .tui-image-editor-main {
    top: 64px;
    height: calc(100% - 64px)
}

.tui-image-editor-container.top .tui-image-editor-controls {
    top: 0;
    bottom: inherit
}

.tui-image-editor-container .tui-image-editor-help-menu.top {
    white-space: nowrap;
    width: 506px;
    height: 40px;
    top: 8px;
    left: 50%;
    transform: translate(-50%)
}

.tui-image-editor-container .tui-image-editor-help-menu.top .tie-panel-history {
    top: 45px
}

.tui-image-editor-container .tui-image-editor-help-menu.top .opened .tie-panel-history:before {
    border-right: 8px solid transparent;
    border-left: 8px solid transparent;
    border-bottom: 8px solid #fff;
    left: 90px;
    top: -8px
}

.tui-image-editor-container .tui-image-editor-help-menu.top>.tui-image-editor-item[tooltip-content]:before {
    left: 13px;
    top: 35px;
    border: none;
    border-bottom: 7px solid #2f2f2f;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent
}

.tui-image-editor-container .tui-image-editor-help-menu.top>.tui-image-editor-item[tooltip-content]:after {
    top: 41px;
    left: -4px;
    white-space: nowrap
}

.tui-image-editor-container .tui-image-editor-help-menu.top>.tui-image-editor-item[tooltip-content].opened:before,.tui-image-editor-container .tui-image-editor-help-menu.top>.tui-image-editor-item[tooltip-content].opened:after {
    content: none
}

.tui-image-editor-container .tui-image-editor-help-menu.bottom {
    white-space: nowrap;
    width: 506px;
    height: 40px;
    bottom: 8px;
    left: 50%;
    transform: translate(-50%)
}

.tui-image-editor-container .tui-image-editor-help-menu.bottom .tie-panel-history {
    bottom: 45px
}

.tui-image-editor-container .tui-image-editor-help-menu.bottom .opened .tie-panel-history:before {
    border-right: 8px solid transparent;
    border-left: 8px solid transparent;
    border-top: 8px solid #fff;
    left: 90px;
    bottom: -8px
}

.tui-image-editor-container .tui-image-editor-help-menu.bottom>.tui-image-editor-item[tooltip-content]:before {
    left: 13px;
    top: auto;
    bottom: 36px;
    border: none;
    border-top: 7px solid #2f2f2f;
    border-left: 7px solid transparent;
    border-right: 7px solid transparent
}

.tui-image-editor-container .tui-image-editor-help-menu.bottom>.tui-image-editor-item[tooltip-content]:after {
    top: auto;
    left: -4px;
    bottom: 41px;
    white-space: nowrap
}

.tui-image-editor-container .tui-image-editor-help-menu.bottom>.tui-image-editor-item[tooltip-content].opened:before,.tui-image-editor-container .tui-image-editor-help-menu.bottom>.tui-image-editor-item[tooltip-content].opened:after {
    content: none
}

.tui-image-editor-container .tui-image-editor-help-menu.left {
    white-space: inherit;
    width: 40px;
    height: 506px;
    left: 8px;
    top: 50%;
    transform: translateY(-50%)
}

.tui-image-editor-container .tui-image-editor-help-menu.left .tie-panel-history {
    left: 140px;
    top: -4px
}

.tui-image-editor-container .tui-image-editor-help-menu.left .opened .tie-panel-history:before {
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-right: 8px solid #fff;
    left: -8px;
    top: 14px
}

.tui-image-editor-container .tui-image-editor-help-menu.left .tui-image-editor-item {
    margin: 4px auto;
    padding: 6px 8px
}

.tui-image-editor-container .tui-image-editor-help-menu.left>.tui-image-editor-item[tooltip-content]:before {
    left: 27px;
    top: 11px;
    border: none;
    border-right: 7px solid #2f2f2f;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent
}

.tui-image-editor-container .tui-image-editor-help-menu.left>.tui-image-editor-item[tooltip-content]:after {
    top: 7px;
    left: 40px;
    white-space: nowrap
}

.tui-image-editor-container .tui-image-editor-help-menu.left>.tui-image-editor-item[tooltip-content].opened:before,.tui-image-editor-container .tui-image-editor-help-menu.left>.tui-image-editor-item[tooltip-content].opened:after {
    content: none
}

.tui-image-editor-container .tui-image-editor-help-menu.right {
    white-space: inherit;
    width: 40px;
    height: 506px;
    right: 8px;
    top: 50%;
    transform: translateY(-50%)
}

.tui-image-editor-container .tui-image-editor-help-menu.right .tie-panel-history {
    right: -30px;
    top: -4px
}

.tui-image-editor-container .tui-image-editor-help-menu.right .opened .tie-panel-history:before {
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    border-left: 8px solid #fff;
    right: -8px;
    top: 14px
}

.tui-image-editor-container .tui-image-editor-help-menu.right .tui-image-editor-item {
    margin: 4px auto;
    padding: 6px 8px
}

.tui-image-editor-container .tui-image-editor-help-menu.right>.tui-image-editor-item[tooltip-content]:before {
    left: -6px;
    top: 11px;
    border: none;
    border-left: 7px solid #2f2f2f;
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent
}

.tui-image-editor-container .tui-image-editor-help-menu.right>.tui-image-editor-item[tooltip-content]:after {
    top: 7px;
    left: auto;
    right: 39px;
    white-space: nowrap
}

.tui-image-editor-container .tui-image-editor-help-menu.right>.tui-image-editor-item[tooltip-content].opened:before,.tui-image-editor-container .tui-image-editor-help-menu.right>.tui-image-editor-item[tooltip-content].opened:after {
    content: none
}

.tui-image-editor-container .tie-icon-add-button .tui-image-editor-button {
    min-width: 42px
}

.tui-image-editor-container .svg_ic-menu,.tui-image-editor-container .svg_ic-helpmenu {
    width: 24px;
    height: 24px
}

.tui-image-editor-container .svg_ic-submenu {
    width: 32px;
    height: 32px
}

.tui-image-editor-container .svg_img-bi {
    width: 257px;
    height: 26px
}

.tui-image-editor-container .tui-image-editor-help-menu svg>use,.tui-image-editor-container .tui-image-editor-controls svg>use {
    display: none
}

.tui-image-editor-container .tui-image-editor-help-menu .enabled svg:hover>use.hover,.tui-image-editor-container .tui-image-editor-controls .enabled svg:hover>use.hover,.tui-image-editor-container .tui-image-editor-help-menu .normal svg:hover>use.hover,.tui-image-editor-container .tui-image-editor-controls .normal svg:hover>use.hover {
    display: block
}

.tui-image-editor-container .tui-image-editor-help-menu .active svg:hover>use.hover,.tui-image-editor-container .tui-image-editor-controls .active svg:hover>use.hover {
    display: none
}

.tui-image-editor-container .tui-image-editor-help-menu .on svg>use.hover,.tui-image-editor-container .tui-image-editor-controls .on svg>use.hover,.tui-image-editor-container .tui-image-editor-help-menu .opened svg>use.hover,.tui-image-editor-container .tui-image-editor-controls .opened svg>use.hover {
    display: block
}

.tui-image-editor-container .tui-image-editor-help-menu svg>use.normal,.tui-image-editor-container .tui-image-editor-controls svg>use.normal {
    display: block
}

.tui-image-editor-container .tui-image-editor-help-menu .active svg>use.active,.tui-image-editor-container .tui-image-editor-controls .active svg>use.active {
    display: block
}

.tui-image-editor-container .tui-image-editor-help-menu .enabled svg>use.enabled,.tui-image-editor-container .tui-image-editor-controls .enabled svg>use.enabled {
    display: block
}

.tui-image-editor-container .tui-image-editor-help-menu .active svg>use.normal,.tui-image-editor-container .tui-image-editor-controls .active svg>use.normal,.tui-image-editor-container .tui-image-editor-help-menu .enabled svg>use.normal,.tui-image-editor-container .tui-image-editor-controls .enabled svg>use.normal {
    display: none
}

.tui-image-editor-container .tui-image-editor-help-menu .help svg>use.disabled,.tui-image-editor-container .tui-image-editor-controls .help svg>use.disabled,.tui-image-editor-container .tui-image-editor-help-menu .help.enabled svg>use.normal,.tui-image-editor-container .tui-image-editor-controls .help.enabled svg>use.normal {
    display: block
}

.tui-image-editor-container .tui-image-editor-help-menu .help.enabled svg>use.disabled,.tui-image-editor-container .tui-image-editor-controls .help.enabled svg>use.disabled {
    display: none
}

.tui-image-editor-container .tui-image-editor-controls:hover {
    z-index: 3
}

.tui-image-editor-container div.tui-colorpicker-clearfix {
    width: 159px;
    height: 28px;
    border: 1px solid #d5d5d5;
    border-radius: 2px;
    background-color: #f5f5f5;
    margin-top: 6px;
    padding: 4px 7px
}

.tui-image-editor-container .tui-colorpicker-palette-hex {
    width: 114px;
    background-color: #f5f5f5;
    border: 0;
    font-size: 11px;
    margin-top: 2px;
    font-family: Noto Sans,sans-serif
}

.tui-image-editor-container .tui-colorpicker-palette-hex[value="#ffffff"]+.tui-colorpicker-palette-preview,.tui-image-editor-container .tui-colorpicker-palette-hex[value=""]+.tui-colorpicker-palette-preview {
    border: 1px solid #ccc
}

.tui-image-editor-container .tui-colorpicker-palette-hex[value=""]+.tui-colorpicker-palette-preview {
    background-size: cover;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAdBJREFUWAnFl0FuwjAQRZ0ukiugHqFSOQNdseuKW3ALzkA4BateICvUGyCxrtRFd4WuunH/TzykaYJrnLEYaTJJsP2+x8GZZCbQrLU5mj7Bn+EP8HvnCObd+R7xBV5lWfaNON4AnsA38E94qLEt+0yiFaBzAV/Bv+Cxxr4co7hKCDpw1q9wLeNYYdlAwyn8TYt8Hme3+8D5ozcTaMCZ68PXa2tnM2sbEcOZAJhrrpl2DAcTOGNjZPSfCdzkw6JrfbiMv+osBe4y9WOedhm4jZfhbENWuxS44H9Wz/xw4WzqLOAqh1+zycgAwzEMzr5k5gaHOa9ULBwuuDkFlHI1Kl4PJ66kgIpnoywOTmRFAYcbwYk9UMApWkD8zAV5ihcwHk4Rx7gl0IFTQL0EFc+CTQ9OZHWH3YhlVJiVpTHbrTGLhTHLZVgff6s9lyBsI9KduSS83oj+34rTwJutmBmCnMsvozRwZqB5GTkBw6/jdPDu69iJ6BYk6eCcfbcgcQIK/MByaaiMqm8rHcjol2TnpWDhyAKSGdA3FrxtJUToX0ODqatetfGE+8tyEUOV8GY5dGRwLP/MBS4RHQr4bT7NRAQjlcOTfZxmv2G+c4hI8nn+Ax5PG/zhI393AAAAAElFTkSuQmCC)
}

.tui-image-editor-container .tui-colorpicker-palette-preview {
    border-radius: 100%;
    float: left;
    width: 17px;
    height: 17px;
    border: 0
}

.tui-image-editor-container .color-picker-control {
    position: absolute;
    display: none;
    z-index: 99;
    width: 192px;
    background-color: #fff;
    box-shadow: 0 3px 22px 6px #00000026;
    padding: 16px;
    border-radius: 2px
}

.tui-image-editor-container .color-picker-control .tui-colorpicker-palette-toggle-slider {
    display: none
}

.tui-image-editor-container .color-picker-control .tui-colorpicker-palette-button {
    border: 0;
    border-radius: 100%;
    margin: 2px;
    background-size: cover;
    font-size: 1px
}

.tui-image-editor-container .color-picker-control .tui-colorpicker-palette-button[title="#ffffff"],.tui-image-editor-container .color-picker-control .tui-colorpicker-palette-button[title=""] {
    border: 1px solid #ccc
}

.tui-image-editor-container .color-picker-control .triangle {
    width: 0;
    height: 0;
    border-right: 7px solid transparent;
    border-top: 8px solid #fff;
    border-left: 7px solid transparent;
    position: absolute;
    bottom: -8px;
    left: 84px
}

.tui-image-editor-container .color-picker-control .tui-colorpicker-container,.tui-image-editor-container .color-picker-control .tui-colorpicker-palette-container ul,.tui-image-editor-container .color-picker-control .tui-colorpicker-palette-container {
    width: 100%;
    height: auto
}

.tui-image-editor-container .filter-color-item .color-picker-control label {
    font-color: #333;
    font-weight: 400;
    margin-right: 7pxleft
}

.tui-image-editor-container .filter-color-item .tui-image-editor-checkbox {
    margin-top: 0
}

.tui-image-editor-container .filter-color-item .tui-image-editor-checkbox input+label:before,.tui-image-editor-container .filter-color-item .tui-image-editor-checkbox>label:before {
    left: -16px
}

.tui-image-editor-container .color-picker {
    width: 100%;
    height: auto
}

.tui-image-editor-container .color-picker-value {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 100%;
    margin: auto auto 1px
}

.tui-image-editor-container .color-picker-value.transparent {
    border: 1px solid #cbcbcb;
    background-size: cover;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAdBJREFUWAnFl0FuwjAQRZ0ukiugHqFSOQNdseuKW3ALzkA4BateICvUGyCxrtRFd4WuunH/TzykaYJrnLEYaTJJsP2+x8GZZCbQrLU5mj7Bn+EP8HvnCObd+R7xBV5lWfaNON4AnsA38E94qLEt+0yiFaBzAV/Bv+Cxxr4co7hKCDpw1q9wLeNYYdlAwyn8TYt8Hme3+8D5ozcTaMCZ68PXa2tnM2sbEcOZAJhrrpl2DAcTOGNjZPSfCdzkw6JrfbiMv+osBe4y9WOedhm4jZfhbENWuxS44H9Wz/xw4WzqLOAqh1+zycgAwzEMzr5k5gaHOa9ULBwuuDkFlHI1Kl4PJ66kgIpnoywOTmRFAYcbwYk9UMApWkD8zAV5ihcwHk4Rx7gl0IFTQL0EFc+CTQ9OZHWH3YhlVJiVpTHbrTGLhTHLZVgff6s9lyBsI9KduSS83oj+34rTwJutmBmCnMsvozRwZqB5GTkBw6/jdPDu69iJ6BYk6eCcfbcgcQIK/MByaaiMqm8rHcjol2TnpWDhyAKSGdA3FrxtJUToX0ODqatetfGE+8tyEUOV8GY5dGRwLP/MBS4RHQr4bT7NRAQjlcOTfZxmv2G+c4hI8nn+Ax5PG/zhI393AAAAAElFTkSuQmCC)
}

.tui-image-editor-container .color-picker-value+label {
    color: #fff
}

.tui-image-editor-container .tui-image-editor-submenu svg>use {
    display: none
}

.tui-image-editor-container .tui-image-editor-submenu svg>use.normal {
    display: block
}

.tie-icon-add-button.icon-bubble .tui-image-editor-button[data-icontype=icon-bubble] svg>use.active,.tie-icon-add-button.icon-heart .tui-image-editor-button[data-icontype=icon-heart] svg>use.active,.tie-icon-add-button.icon-location .tui-image-editor-button[data-icontype=icon-location] svg>use.active,.tie-icon-add-button.icon-polygon .tui-image-editor-button[data-icontype=icon-polygon] svg>use.active,.tie-icon-add-button.icon-star .tui-image-editor-button[data-icontype=icon-star] svg>use.active,.tie-icon-add-button.icon-star-2 .tui-image-editor-button[data-icontype=icon-star-2] svg>use.active,.tie-icon-add-button.icon-arrow-3 .tui-image-editor-button[data-icontype=icon-arrow-3] svg>use.active,.tie-icon-add-button.icon-arrow-2 .tui-image-editor-button[data-icontype=icon-arrow-2] svg>use.active,.tie-icon-add-button.icon-arrow .tui-image-editor-button[data-icontype=icon-arrow] svg>use.active {
    display: block
}

.tie-draw-line-select-button.line .tui-image-editor-button.line svg>use.normal,.tie-draw-line-select-button.free .tui-image-editor-button.free svg>use.normal {
    display: none
}

.tie-draw-line-select-button.line .tui-image-editor-button.line svg>use.active,.tie-draw-line-select-button.free .tui-image-editor-button.free svg>use.active {
    display: block
}

.tie-flip-button.resetFlip .tui-image-editor-button.resetFlip svg>use.normal,.tie-flip-button.flipX .tui-image-editor-button.flipX svg>use.normal,.tie-flip-button.flipY .tui-image-editor-button.flipY svg>use.normal {
    display: none
}

.tie-flip-button.resetFlip .tui-image-editor-button.resetFlip svg>use.active,.tie-flip-button.flipX .tui-image-editor-button.flipX svg>use.active,.tie-flip-button.flipY .tui-image-editor-button.flipY svg>use.active {
    display: block
}

.tie-mask-apply.apply.active .tui-image-editor-button.apply label {
    color: #fff
}

.tie-mask-apply.apply.active .tui-image-editor-button.apply svg>use.active {
    display: block
}

.tie-crop-button .tui-image-editor-button.apply,.tie-crop-preset-button .tui-image-editor-button.apply {
    margin-right: 24px
}

.tie-crop-button .tui-image-editor-button.preset.active svg>use.active,.tie-crop-preset-button .tui-image-editor-button.preset.active svg>use.active {
    display: block
}

.tie-crop-button .tui-image-editor-button.apply.active svg>use.active,.tie-crop-preset-button .tui-image-editor-button.apply.active svg>use.active {
    display: block
}

.tie-resize-button .tui-image-editor-button.apply,.tie-resize-preset-button .tui-image-editor-button.apply {
    margin-right: 24px
}

.tie-resize-button .tui-image-editor-button.preset.active svg>use.active,.tie-resize-preset-button .tui-image-editor-button.preset.active svg>use.active {
    display: block
}

.tie-resize-button .tui-image-editor-button.apply.active svg>use.active,.tie-resize-preset-button .tui-image-editor-button.apply.active svg>use.active {
    display: block
}

.tie-shape-button.rect .tui-image-editor-button.rect svg>use.normal,.tie-shape-button.circle .tui-image-editor-button.circle svg>use.normal,.tie-shape-button.triangle .tui-image-editor-button.triangle svg>use.normal {
    display: none
}

.tie-shape-button.rect .tui-image-editor-button.rect svg>use.active,.tie-shape-button.circle .tui-image-editor-button.circle svg>use.active,.tie-shape-button.triangle .tui-image-editor-button.triangle svg>use.active {
    display: block
}

.tie-text-effect-button .tui-image-editor-button.active svg>use.active {
    display: block
}

.tie-text-align-button.tie-text-align-left .tui-image-editor-button.left svg>use.active,.tie-text-align-button.tie-text-align-center .tui-image-editor-button.center svg>use.active,.tie-text-align-button.tie-text-align-right .tui-image-editor-button.right svg>use.active {
    display: block
}

.tie-mask-image-file,.tie-icon-image-file {
    opacity: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid #008000;
    cursor: inherit;
    left: 0;
    top: 0
}

.tie-zoom-button.resetFlip .tui-image-editor-button.resetFlip svg>use.normal,.tie-zoom-button.flipX .tui-image-editor-button.flipX svg>use.normal,.tie-zoom-button.flipY .tui-image-editor-button.flipY svg>use.normal {
    display: none
}

.tie-zoom-button.resetFlip .tui-image-editor-button.resetFlip svg>use.active,.tie-zoom-button.flipX .tui-image-editor-button.flipX svg>use.active,.tie-zoom-button.flipY .tui-image-editor-button.flipY svg>use.active {
    display: block
}

.tui-image-editor-container.top.tui-image-editor-top-optimization .tui-image-editor-controls ul {
    text-align: right
}

.tui-image-editor-container.top.tui-image-editor-top-optimization .tui-image-editor-controls-logo {
    display: none
}

.collect-page {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    background: var(--bg);
    display: flex;
    flex-direction: column
}

.collect-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    padding: 0 16px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0
}

.collect-header-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    color: var(--muted2);
    cursor: pointer;
    border-radius: 8px;
    transition: all var(--transition-fast)
}

.collect-header-close:hover {
    background: var(--hover-subtle);
    color: var(--text)
}

.collect-progress {
    display: flex;
    gap: 8px;
    align-items: center
}

.progress-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--border);
    transition: all var(--transition)
}

.progress-dot.completed {
    background: var(--accent)
}

.progress-dot.current {
    background: transparent;
    border: 2px solid var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.collect-header-right {
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-end
}

.offline-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px
}

.offline-dot-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--red);
    animation: pulse-dot 2s infinite
}

@keyframes pulse-dot {
    0%,to {
        opacity: 1
    }

    50% {
        opacity: .4
    }
}

.collect-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px;
    -webkit-overflow-scrolling: touch
}

.collect-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom,0px));
    background: var(--surface);
    border-top: 1px solid var(--border);
    flex-shrink: 0
}

.collect-actions .btn {
    min-height: 48px;
    min-width: 100px;
    font-size: 15px;
    justify-content: center
}

.collect-actions .btn-primary {
    flex: 1;
    max-width: 200px
}

.step-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 4px;
    font-family: var(--font-display)
}

.step-subtitle {
    font-size: 14px;
    color: var(--muted2);
    margin: 0 0 24px
}

.step-loading {
    font-size: 14px;
    color: var(--muted);
    padding: 16px 0
}

.step-input-large {
    width: 100%;
    font-size: 24px;
    text-align: center;
    font-family: var(--font-mono);
    font-weight: 600;
    padding: 16px;
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    transition: all var(--transition-fast);
    letter-spacing: .05em
}

.step-input-large:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.step-input-large::placeholder {
    color: var(--muted);
    font-weight: 400
}

.scan-camera-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 16px;
    min-height: 48px;
    font-size: 15px
}

.scanner-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px
}

.scanner-header {
    display: flex;
    align-items: center;
    justify-content: space-between
}

.scanner-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--accent);
    font-weight: 600
}

.scanner-close {
    padding: 6px!important;
    min-height: auto!important
}

.scanner-viewport {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid var(--accent);
    background: #000
}

.scanner-viewport video {
    border-radius: 10px
}

#scanner-reader {
    border: none!important
}

#scanner-reader video {
    border-radius: 10px
}

#scanner-reader__scan_region {
    min-height: 200px
}

#scanner-reader__dashboard {
    display: none!important
}

.scanner-manual {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    min-height: 44px
}

.scan-success {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: #10b9811a;
    border: 1px solid rgba(16,185,129,.3);
    border-radius: 8px;
    color: #10b981;
    font-size: 13px;
    margin-top: 12px
}

.scan-error {
    padding: 10px 14px;
    background: #ef44441a;
    border: 1px solid rgba(239,68,68,.2);
    border-radius: 8px;
    color: #ef4444;
    font-size: 12px;
    margin-top: 12px
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(140px,1fr));
    gap: 12px
}

.card-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 64px;
    padding: 12px 8px;
    background: var(--card2);
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    color: var(--muted2);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font-body);
    transition: all var(--transition-fast)
}

.card-option:hover {
    border-color: var(--border-hi);
    color: var(--text)
}

.card-option.selected {
    border-color: var(--accent);
    background: var(--accent-dim);
    color: var(--accent)
}

.photo-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px
}

.photo-actions .btn {
    flex: 1;
    min-height: 48px;
    justify-content: center;
    font-size: 14px
}

.photo-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 8px
}

.photo-thumb {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden
}

.photo-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover
}

.photo-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--red);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition-fast)
}

.photo-remove:hover {
    transform: scale(1.1)
}

.photo-annotate {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: .85;
    transition: all .15s
}

.photo-annotate:hover {
    opacity: 1;
    transform: scale(1.1)
}

.photo-thumb img {
    cursor: pointer
}

.review-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px
}

.review-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border)
}

.review-row:last-child {
    border-bottom: none
}

.review-row-full {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px
}

.review-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em
}

.review-value {
    font-size: 14px;
    color: var(--text);
    font-weight: 500
}

.review-tag {
    font-family: var(--font-mono);
    color: var(--accent);
    font-weight: 600;
    font-size: 16px
}

.review-badge {
    display: inline-block;
    padding: 2px 10px;
    background: var(--accent-dim);
    color: var(--accent);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600
}

.review-description {
    font-size: 13px;
    color: var(--muted2);
    line-height: 1.5
}

.review-photos {
    display: flex;
    gap: 8px;
    padding: 12px 0 4px;
    overflow-x: auto
}

.review-photo-thumb {
    width: 56px;
    height: 56px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0
}

.review-error {
    background: var(--red-dim);
    color: var(--red);
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px
}

.review-save-btn {
    width: 100%;
    min-height: 48px;
    font-size: 16px;
    justify-content: center
}

.success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
    min-height: 300px
}

.success-icon {
    color: var(--green);
    margin-bottom: 16px;
    animation: scale-in .4s cubic-bezier(.34,1.56,.64,1)
}

@keyframes scale-in {
    0% {
        transform: scale(0);
        opacity: 0
    }

    to {
        transform: scale(1);
        opacity: 1
    }
}

.success-state h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 8px
}

.success-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
    width: 100%;
    max-width: 280px
}

.success-actions .btn {
    min-height: 48px;
    justify-content: center;
    font-size: 15px
}

.collect-page input,.collect-page select,.collect-page textarea,.collect-page button {
    min-height: 48px
}

.collect-page textarea {
    min-height: 80px
}

.progress-bar-container {
    width: 100%
}

.progress-bar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px
}

.progress-bar-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text)
}

.progress-bar-pct {
    font-size: 12px;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--muted2)
}

.project-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(320px,1fr));
    gap: 16px
}

.project-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px;
    cursor: pointer;
    transition: all .2s ease;
    animation: fadeUp .35s ease both
}

.project-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: var(--shadow)
}

.project-card-photo {
    position: relative;
    margin: -20px -20px 12px;
    height: 140px;
    overflow: hidden;
    border-radius: 14px 14px 0 0
}

.project-card-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover
}

.project-card-photo-overlay {
    position: absolute;
    top: 8px;
    right: 8px
}

.project-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px
}

.project-card-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--accent-dim);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center
}

.project-card-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px
}

.project-card-client {
    font-size: 13px;
    color: var(--muted)
}

.project-card-stats {
    display: flex;
    gap: 16px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--border)
}

.project-card-stat {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--muted2)
}

.project-card-stat svg {
    color: var(--muted)
}

.project-card:nth-child(1) {
    animation-delay: .04s
}

.project-card:nth-child(2) {
    animation-delay: .08s
}

.project-card:nth-child(3) {
    animation-delay: .12s
}

.project-card:nth-child(4) {
    animation-delay: .16s
}

.project-card {
    position: relative
}

.project-card-delete {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 5px;
    border: none;
    background: var(--card);
    color: var(--muted);
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--transition-fast),color var(--transition-fast)
}

.project-card:hover .project-card-delete {
    opacity: 1
}

.project-card-delete:hover {
    color: var(--red)
}

@media(max-width: 700px) {
    .project-grid {
        grid-template-columns:1fr
    }
}

.project-detail {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.project-detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 24px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 14px;
    animation: fadeUp .3s ease both
}

.project-header-photo {
    width: 120px;
    height: 90px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
    border: 1px solid var(--border);
    transition: all .15s
}

.project-header-photo:hover {
    border-color: var(--accent)
}

.project-header-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover
}

.photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--surface);
    color: var(--muted);
    font-size: 10px
}

.photo-placeholder:hover {
    color: var(--accent)
}

.project-header-info {
    flex: 1
}

.project-detail-name {
    font-size: 22px;
    font-weight: 700
}

.project-detail-client {
    font-size: 14px;
    color: var(--accent);
    margin-top: 2px
}

.project-detail-desc {
    font-size: 13px;
    color: var(--muted);
    margin-top: 8px;
    line-height: 1.5
}

.project-header-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0
}

.project-timeline-bar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    padding: 16px 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px
}

.timeline-stat {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--accent);
    flex: 1;
    min-width: 140px
}

.timeline-stat-label {
    font-size: 10px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .06em
}

.timeline-stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--text)
}

.timeline-progress {
    min-width: 200px
}

.project-grid {
    display: grid;
    grid-template-columns: 1.2fr .8fr;
    gap: 16px
}

.project-left,.project-right {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.milestone-list {
    display: flex;
    flex-direction: column;
    gap: 14px
}

.milestone-item {
    display: flex;
    flex-direction: column;
    gap: 2px
}

.milestone-detail {
    font-size: 11px;
    color: var(--muted);
    padding-left: 2px
}

.checklist {
    display: flex;
    flex-direction: column
}

.checklist-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background .15s
}

.checklist-item:last-child {
    border-bottom: none
}

.checklist-item:hover {
    background: var(--accent-dim)
}

.checklist-check {
    flex-shrink: 0;
    color: var(--muted)
}

.checklist-check.checked {
    color: var(--green)
}

.checklist-circle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--border)
}

.checklist-content {
    flex: 1
}

.checklist-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text)
}

.checklist-item.done .checklist-label {
    color: var(--muted);
    text-decoration: line-through
}

.checklist-detail {
    font-size: 11px;
    color: var(--muted)
}

.building-list {
    display: flex;
    flex-direction: column
}

.building-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border)
}

.building-item:last-child {
    border-bottom: none
}

.building-photo {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    cursor: pointer;
    background: var(--accent-dim);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border);
    transition: all .15s
}

.building-photo:hover {
    border-color: var(--accent)
}

.building-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover
}

.building-name {
    font-size: 13px;
    font-weight: 600
}

.building-meta {
    font-size: 11px;
    color: var(--muted)
}

.contractor-list {
    display: flex;
    flex-direction: column
}

.contractor-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background .15s
}

.contractor-item:last-child {
    border-bottom: none
}

.contractor-item:hover {
    background: var(--accent-dim)
}

.contractor-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f59e0b1a;
    color: #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0
}

.contractor-name {
    font-size: 13px;
    font-weight: 600
}

.contractor-contact {
    font-size: 11px;
    color: var(--muted)
}

.project-doc-list {
    display: flex;
    flex-direction: column
}

.project-doc-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background .15s
}

.project-doc-item:last-child {
    border-bottom: none
}

.project-doc-item:hover {
    background: var(--accent-dim)
}

.project-doc-icon {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    gap: 0
}

.project-doc-ext {
    font-size: 7px;
    font-weight: 700;
    font-family: var(--font-mono);
    opacity: .8
}

.project-doc-name {
    font-size: 13px;
    font-weight: 500
}

.project-doc-date {
    font-size: 11px;
    color: var(--muted)
}

.p-0 {
    padding: 0!important
}

@media(max-width: 900px) {
    .project-detail-header {
        flex-direction:column
    }

    .project-grid {
        grid-template-columns: 1fr
    }

    .project-timeline-bar {
        flex-direction: column
    }
}

.contractor-list-page,.user-management-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.user-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border)
}

.user-tab {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all .15s;
    font-family: var(--font-body)
}

.user-tab:hover {
    color: var(--text)
}

.user-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent)
}

.user-tab-badge {
    background: var(--amber);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center
}

.user-detail-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.user-detail-topbar {
    display: flex;
    align-items: center;
    gap: 12px
}

.user-profile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px
}

.user-profile-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg,var(--accent),var(--blue));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0
}

.user-profile-info {
    flex: 1
}

.user-detail-summary {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 12px
}

.user-summary-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center
}

.user-summary-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text)
}

.user-summary-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em
}

.user-detail-grid {
    display: flex;
    flex-direction: column;
    gap: 12px
}

.user-info-list {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.user-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px
}

.user-info-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    min-width: 80px
}

.user-wo-list {
    display: flex;
    flex-direction: column;
    gap: 4px
}

.user-wo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--card2);
    border-radius: 8px;
    cursor: pointer;
    transition: background .1s
}

.user-wo-row:hover {
    background: var(--hover-subtle)
}

@media(max-width: 600px) {
    .user-detail-summary {
        grid-template-columns:1fr
    }

    .user-profile-header {
        flex-direction: column;
        text-align: center
    }
}

.mat-detail-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.mat-detail-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border)
}

.mat-detail-summary {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 12px
}

.mat-summary-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center
}

.mat-summary-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text)
}

.mat-summary-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em
}

.mat-detail-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 16px;
    align-items: start
}

.mat-detail-main,.mat-detail-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px
}

.mat-detail-info {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.mat-info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px
}

.mat-info-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    min-width: 80px
}

.mat-stock-list {
    display: flex;
    flex-direction: column;
    gap: 6px
}

.mat-stock-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--card2);
    border-radius: 8px
}

.mat-stock-low {
    border-left: 3px solid var(--amber)
}

.mat-tx-list {
    display: flex;
    flex-direction: column;
    gap: 4px
}

.mat-tx-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    font-size: 13px
}

.mat-tx-row:last-child {
    border-bottom: none
}

.mat-pm-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--card2);
    border-radius: 8px;
    cursor: pointer;
    transition: background .1s
}

.mat-pm-row:hover {
    background: var(--hover-subtle)
}

@media(max-width: 900px) {
    .mat-detail-grid {
        grid-template-columns:1fr
    }

    .mat-detail-summary {
        grid-template-columns: repeat(2,1fr)
    }
}

.org-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.org-filters {
    display: flex;
    gap: 10px;
    align-items: center
}

.org-filters select {
    padding: 8px 32px 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    font-family: var(--font-body);
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    cursor: pointer
}

.search-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    flex: 1;
    max-width: 320px;
    color: var(--muted)
}

.search-input-wrap input {
    border: none;
    background: none;
    outline: none;
    font-size: 13px;
    color: var(--text);
    width: 100%;
    font-family: var(--font-body)
}

.search-input-wrap input::placeholder {
    color: var(--muted)
}

.org-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px
}

.org-table th {
    text-align: left;
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--muted);
    border-bottom: 1px solid var(--border)
}

.org-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle
}

.org-table tbody tr:hover {
    background: var(--hover-subtle)
}

.org-table tbody tr:last-child td {
    border-bottom: none
}

.org-name-cell {
    display: flex;
    align-items: center;
    gap: 10px
}

.org-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--accent-dim);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0
}

.org-name {
    font-weight: 600;
    color: var(--text)
}

.org-slug {
    font-size: 11px;
    color: var(--muted)
}

.btn-icon {
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px
}

.dispatch-board {
    display: flex;
    height: calc(100vh - var(--topbar-h, 56px));
    overflow: hidden;
    background: var(--bg)
}

.dispatch-pool {
    width: 360px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border-right: 1px solid var(--border)
}

.dispatch-pool-header {
    padding: 16px;
    border-bottom: 1px solid var(--border)
}

.dispatch-pool-header h2 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--text);
    font-family: var(--font-body)
}

.dispatch-pool-hint {
    font-size: 12px;
    color: var(--muted);
    margin: 0 0 10px;
    line-height: 1.4
}

.dispatch-pool-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px
}

.dispatch-pool-actions button {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--card);
    cursor: pointer;
    color: var(--muted2);
    font-family: var(--font-body);
    transition: all var(--transition-fast)
}

.dispatch-pool-actions button:hover {
    background: var(--hover-subtle);
    color: var(--text);
    border-color: var(--border-hi)
}

.dispatch-pool-search {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    outline: none;
    background: var(--card2);
    color: var(--text);
    font-family: var(--font-body);
    transition: all var(--transition-fast)
}

.dispatch-pool-search::placeholder {
    color: var(--muted)
}

.dispatch-pool-search:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.dispatch-pool-filters {
    display: flex;
    gap: 6px;
    margin-top: 8px
}

.dispatch-pool-filters select {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    background: var(--card2);
    color: var(--muted2);
    font-family: var(--font-body);
    cursor: pointer;
    transition: all var(--transition-fast)
}

.dispatch-pool-filters select:focus {
    border-color: var(--accent);
    outline: none
}

.dispatch-pool-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px
}

.dispatch-pool-count {
    font-size: 12px;
    color: var(--muted);
    padding: 6px 8px;
    border-bottom: 1px solid var(--border)
}

.dispatch-lanes {
    flex: 1;
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding: 16px
}

.tech-lane {
    min-width: 280px;
    max-width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: border-color var(--transition-fast),background var(--transition-fast)
}

.tech-lane.is-over {
    border-color: var(--accent);
    background: var(--accent-dim)
}

.tech-lane-header {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px
}

.tech-lane-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--purple-dim);
    color: var(--purple);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0
}

.tech-lane-info {
    flex: 1;
    min-width: 0
}

.tech-lane-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.tech-lane-role {
    font-size: 11px;
    color: var(--muted)
}

.tech-lane-count {
    font-size: 11px;
    font-weight: 600;
    background: var(--gray-dim);
    color: var(--muted2);
    padding: 2px 8px;
    border-radius: 10px
}

.tech-lane-body {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    min-height: 100px
}

.tech-lane-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    color: var(--muted);
    font-size: 12px;
    text-align: center;
    border: 2px dashed var(--border);
    border-radius: var(--radius-sm);
    margin: 4px
}

.wo-card {
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
    background: var(--card);
    cursor: grab;
    transition: box-shadow var(--transition-fast),opacity var(--transition-fast),border-color var(--transition-fast);
    -webkit-user-select: none;
    user-select: none
}

.wo-card:hover {
    box-shadow: var(--shadow);
    border-color: var(--border-hi)
}

.wo-card.selected {
    border-color: var(--accent);
    background: var(--accent-dim)
}

.wo-card.dragging {
    opacity: .4
}

.wo-card-top {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px
}

.wo-card-checkbox {
    width: 14px;
    height: 14px;
    accent-color: var(--accent);
    cursor: pointer;
    flex-shrink: 0
}

.wo-card-number {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    font-family: var(--font-mono)
}

.wo-card-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 6px
}

.wo-card-badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap
}

.wo-card-badges .badge {
    font-size: 10px;
    padding: 1px 6px
}

.wo-card-overlay {
    padding: 10px 12px;
    border: 2px solid var(--accent);
    border-radius: var(--radius-sm);
    background: var(--card);
    box-shadow: var(--shadow-lg);
    max-width: 300px;
    cursor: grabbing
}

.drag-count-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: var(--accent);
    color: var(--accent-text);
    font-size: 11px;
    font-weight: 700;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow)
}

.dispatch-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    color: var(--muted);
    font-size: 14px;
    font-family: var(--font-body)
}

.ai-chat-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: #00000080;
    z-index: 100
}

.ai-chat-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    width: 560px;
    max-width: 95vw;
    height: 600px;
    max-height: 85vh;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 12px);
    box-shadow: 0 20px 60px #0000004d;
    z-index: 101;
    display: flex;
    flex-direction: column;
    overflow: hidden
}

.ai-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--card2)
}

.ai-chat-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text)
}

.ai-chat-header-left svg {
    color: var(--accent)
}

.ai-chat-close {
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm)
}

.ai-chat-close:hover {
    color: var(--text);
    background: var(--hover)
}

.ai-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px
}

.ai-chat-welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 16px;
    gap: 8px
}

.ai-chat-welcome svg {
    color: var(--accent)
}

.ai-chat-welcome h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    margin: 0
}

.ai-chat-welcome p {
    font-size: 13px;
    color: var(--muted);
    margin: 0;
    max-width: 400px;
    line-height: 1.5
}

.ai-chat-suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
    justify-content: center
}

.ai-chat-suggestions button {
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 12px;
    color: var(--muted2);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-family: var(--font-body)
}

.ai-chat-suggestions button:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim)
}

.ai-chat-msg {
    display: flex;
    gap: 8px;
    max-width: 90%
}

.ai-chat-msg-user {
    align-self: flex-end;
    flex-direction: row-reverse
}

.ai-chat-msg-assistant {
    align-self: flex-start
}

.ai-chat-msg-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent-dim);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px
}

.ai-chat-msg-bubble {
    padding: 10px 14px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap
}

.ai-chat-msg-user .ai-chat-msg-bubble {
    background: var(--accent);
    color: #fff;
    border-bottom-right-radius: 4px
}

.ai-chat-msg-assistant .ai-chat-msg-bubble {
    background: var(--card2);
    color: var(--text);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px
}

.ai-chat-typing {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted)
}

.ai-spinner {
    animation: spin 1s linear infinite
}

.ai-chat-error {
    font-size: 12px;
    color: var(--error, #ef4444);
    background: var(--error-bg, rgba(239, 68, 68, .1));
    padding: 8px 12px;
    border-radius: var(--radius-sm)
}

.ai-chat-footer {
    border-top: 1px solid var(--border);
    padding: 12px 16px;
    background: var(--card2);
    display: flex;
    flex-direction: column;
    gap: 10px
}

.ai-chat-input-row {
    display: flex;
    gap: 8px
}

.ai-chat-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    background: var(--card);
    color: var(--text);
    font-family: var(--font-body)
}

.ai-chat-input::placeholder {
    color: var(--muted)
}

.ai-chat-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.ai-chat-send {
    padding: 8px 10px
}

.ai-chat-progress-hint {
    font-size: 12px;
    color: var(--muted2);
    background: var(--accent-dim);
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--accent);
    line-height: 1.4
}

.ai-chat-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px
}

.ai-chat-generate {
    display: flex;
    align-items: center;
    gap: 6px
}

.ai-import-body {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.ai-import-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--transition-fast);
    color: var(--muted);
    text-align: center
}

.ai-import-dropzone:hover,.ai-import-dropzone-active {
    border-color: var(--accent);
    background: var(--accent-dim);
    color: var(--accent)
}

.ai-import-dropzone-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin: 4px 0 0
}

.ai-import-dropzone-hint {
    font-size: 12px;
    color: var(--muted);
    margin: 0
}

.ai-import-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px
}

.ai-import-image-preview {
    max-width: 100%;
    max-height: 300px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    object-fit: contain
}

.ai-import-file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    width: 100%;
    color: var(--muted)
}

.ai-import-filename {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin: 0;
    word-break: break-all
}

.ai-import-filesize {
    font-size: 12px;
    color: var(--muted);
    margin: 2px 0 0
}

.ai-import-remove {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 4px 10px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
    font-family: var(--font-body)
}

.ai-import-remove:hover {
    color: var(--error, #ef4444);
    border-color: var(--error, #ef4444)
}

.ai-import-photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(100px,1fr));
    gap: 8px
}

.ai-import-photo-item {
    position: relative;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    aspect-ratio: 3 / 4
}

.ai-import-photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover
}

.ai-import-photo-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #0009;
    color: #fff;
    font-size: 10px;
    text-align: center;
    padding: 2px
}

.ai-import-photo-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #0009;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0
}

.ai-import-photo-remove:hover {
    background: var(--error, #ef4444)
}

.ai-import-photo-add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 2px dashed var(--border);
    border-radius: var(--radius-sm);
    aspect-ratio: 3 / 4;
    cursor: pointer;
    color: var(--muted);
    transition: all var(--transition-fast);
    font-size: 11px
}

.ai-import-photo-add:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim)
}

.ai-import-photo-count {
    font-size: 12px;
    color: var(--muted);
    margin: 0;
    text-align: center
}

.ai-import-progress-hint {
    font-size: 12px;
    color: var(--muted2);
    background: var(--accent-dim);
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--accent);
    line-height: 1.5
}

.ai-import-error {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--error, #ef4444);
    background: var(--error-bg, rgba(239, 68, 68, .1));
    padding: 8px 12px;
    border-radius: var(--radius-sm)
}

.ai-import-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px
}

.ai-import-actions .btn {
    display: flex;
    align-items: center;
    gap: 6px
}

.ai-spinner {
    animation: ai-spin 1s linear infinite
}

@keyframes ai-spin {
    to {
        transform: rotate(360deg)
    }
}

.form-list-page {
    padding: 24px;
    max-width: 1200px;
    margin: 0 auto
}

.form-list-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px
}

.form-list-header h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    margin: 0
}

.form-list-subtitle {
    font-size: 13px;
    color: var(--muted);
    margin: 4px 0 0
}

.form-list-filters {
    display: flex;
    gap: 8px;
    margin-bottom: 16px
}

.form-list-search {
    flex: 1;
    max-width: 300px;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    background: var(--card2);
    color: var(--text);
    font-family: var(--font-body)
}

.form-list-search::placeholder {
    color: var(--muted)
}

.form-list-search:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.form-list-filters select {
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 12px;
    background: var(--card2);
    color: var(--muted2);
    font-family: var(--font-body);
    cursor: pointer
}

.form-list-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(320px,1fr));
    gap: 12px
}

.form-list-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    cursor: pointer;
    transition: border-color var(--transition-fast),box-shadow var(--transition-fast)
}

.form-list-card:hover {
    border-color: var(--border-hi);
    box-shadow: var(--shadow)
}

.form-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px
}

.form-card-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.form-card-desc {
    font-size: 12px;
    color: var(--muted);
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden
}

.form-card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px
}

.form-card-field-count {
    font-size: 11px;
    color: var(--muted)
}

.form-card-actions {
    display: flex;
    gap: 6px;
    border-top: 1px solid var(--border);
    padding-top: 8px
}

.form-card-actions .btn {
    font-size: 11px;
    padding: 3px 8px
}

.form-list-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--muted);
    gap: 12px
}

.form-list-empty p {
    font-size: 14px;
    margin: 0
}

.form-list-loading {
    padding: 24px
}

.form-ai-cards {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 10px;
    margin-bottom: 20px
}

.form-ai-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    font-family: var(--font-body)
}

.form-ai-card:hover {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.form-ai-card svg {
    color: var(--accent);
    flex-shrink: 0
}

.form-ai-card div {
    display: flex;
    flex-direction: column;
    gap: 2px
}

.form-ai-card strong {
    font-size: 13px;
    font-weight: 600;
    color: var(--text)
}

.form-ai-card span {
    font-size: 11px;
    color: var(--muted)
}

@media(max-width: 768px) {
    .form-ai-cards {
        grid-template-columns:1fr
    }
}

.fd-page {
    display: flex;
    flex-direction: column;
    height: calc(100vh - var(--topbar-h, 56px));
    overflow: hidden
}

.fd-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--muted)
}

.fd-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    flex-shrink: 0
}

.fd-topbar-center {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px
}

.fd-topbar-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text)
}

.fd-topbar-actions {
    display: flex;
    gap: 8px
}

.fd-content {
    flex: 1;
    display: flex;
    overflow: hidden
}

.fd-builder {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    max-width: 700px
}

.fd-builder-full {
    max-width: none
}

.fd-meta {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 20px
}

.fd-fields-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px
}

.fd-fields-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin: 0
}

.fd-fields-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    color: var(--muted);
    cursor: pointer;
    font-size: 13px;
    transition: border-color var(--transition-fast),color var(--transition-fast)
}

.fd-fields-empty:hover {
    border-color: var(--accent);
    color: var(--accent)
}

.fd-fields-list {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.fd-add-bottom {
    margin-top: 12px;
    width: 100%;
    justify-content: center
}

.fd-field-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden
}

.fd-field-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--card-head-bg);
    border-bottom: 1px solid var(--border)
}

.fd-field-index {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    width: 20px;
    text-align: center
}

.fd-field-type {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: 12px;
    background: var(--card2);
    color: var(--text);
    font-family: var(--font-body);
    max-width: 160px
}

.fd-field-actions {
    display: flex;
    gap: 2px
}

.fd-field-actions button {
    padding: 4px;
    border: none;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    border-radius: 4px;
    transition: color var(--transition-fast),background var(--transition-fast)
}

.fd-field-actions button:hover:not(:disabled) {
    color: var(--text);
    background: var(--hover-subtle)
}

.fd-field-actions button:disabled {
    opacity: .3;
    cursor: default
}

.fd-field-body {
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px
}

.fd-field-row {
    display: flex;
    gap: 10px;
    align-items: center
}

.fd-input {
    flex: 1;
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    background: var(--card2);
    color: var(--text);
    font-family: var(--font-body)
}

.fd-input::placeholder {
    color: var(--muted)
}

.fd-input:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent-dim)
}

.fd-input-sm {
    font-size: 12px;
    padding: 5px 8px
}

.fd-toggle {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--muted2);
    white-space: nowrap;
    cursor: pointer
}

.fd-toggle input {
    accent-color: var(--accent)
}

.fd-options {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px
}

.fd-options-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: 6px
}

.fd-option-row {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 4px
}

.fd-option-remove {
    padding: 3px;
    border: none;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    border-radius: 3px
}

.fd-option-remove:hover {
    color: var(--red)
}

.fd-add-option {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--accent);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px 0;
    margin-top: 4px
}

.fd-add-option:hover {
    text-decoration: underline
}

.fd-preview {
    width: 380px;
    flex-shrink: 0;
    border-left: 1px solid var(--border);
    background: var(--surface);
    overflow-y: auto;
    padding: 16px
}

.fd-preview-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    margin: 0 0 12px
}

.fd-preview-form {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px
}

.fd-preview-form-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px
}

.fd-preview-form-desc {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 16px
}

.fd-preview-empty {
    color: var(--muted);
    font-size: 13px;
    text-align: center;
    padding: 30px
}

.fd-preview-fields {
    display: flex;
    flex-direction: column;
    gap: 14px
}

.fd-pf-group {
    display: flex;
    flex-direction: column;
    gap: 4px
}

.fd-pf-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text2)
}

.fd-pf-req {
    color: var(--red)
}

.fd-pf-input,.fd-pf-textarea {
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    background: var(--card2);
    color: var(--muted);
    font-family: var(--font-body)
}

.fd-pf-textarea {
    min-height: 60px;
    resize: none
}

.fd-pf-section {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    padding: 8px 0 4px;
    border-bottom: 1px solid var(--border)
}

.fd-pf-check {
    flex-direction: row;
    align-items: center;
    gap: 6px
}

.fd-pf-check input {
    accent-color: var(--accent)
}

.fd-pf-check span {
    font-size: 13px;
    color: var(--text)
}

.fd-pf-radios {
    display: flex;
    flex-direction: column;
    gap: 4px
}

.fd-pf-radio {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text)
}

.fd-pf-radio input {
    accent-color: var(--accent)
}

.fd-pf-photo,.fd-pf-signature {
    padding: 20px;
    border: 2px dashed var(--border);
    border-radius: var(--radius-sm);
    text-align: center;
    font-size: 12px;
    color: var(--muted)
}

.fd-condition {
    margin-top: 8px;
    border-top: 1px solid var(--border);
    padding-top: 8px
}

.fd-condition-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--muted2);
    cursor: pointer
}

.fd-condition-toggle svg {
    color: var(--accent)
}

.fd-condition-rules {
    margin-top: 8px;
    padding: 10px;
    background: #0ea5e90a;
    border: 1px solid rgba(14,165,233,.12);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px
}

.fd-condition-logic {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--muted)
}

.fd-logic-btn {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .05em;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--muted2);
    cursor: pointer;
    font-family: var(--font-body);
    transition: all .1s
}

.fd-logic-btn.active {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent)
}

.fd-condition-rule {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap
}

.fd-condition-rule select,.fd-condition-rule input {
    flex: 1;
    min-width: 80px
}

.fd-condition-rule-remove {
    padding: 4px;
    border-radius: 4px;
    color: var(--red);
    opacity: .6;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity .1s
}

.fd-condition-rule-remove:hover {
    opacity: 1
}

.fd-add-rule {
    font-size: 11px;
    color: var(--accent)
}

.fd-field-card-conditional {
    border-left: 3px solid var(--accent)
}

.fd-condition-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 500;
    color: var(--accent);
    padding: 2px 8px;
    background: #0ea5e914;
    border-radius: 4px;
    margin-bottom: 6px
}

.fd-condition-badge svg {
    flex-shrink: 0
}

@media(max-width: 768px) {
    .fd-content {
        flex-direction:column
    }

    .fd-builder {
        max-width: none
    }

    .fd-preview {
        width: 100%;
        border-left: none;
        border-top: 1px solid var(--border);
        max-height: 300px
    }

    .fd-topbar-actions {
        flex-wrap: wrap
    }
}

.material-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.mat-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px
}

@media(max-width: 480px) {
    .mat-form-row {
        grid-template-columns:1fr
    }
}

.pm-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.pm-summary-cards {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 12px
}

.pm-summary-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
    transition: all .15s
}

.pm-summary-card:hover {
    border-color: var(--border-hi)
}

.pm-summary-danger {
    border-color: #ef444433;
    background: #ef44440a
}

.pm-summary-icon {
    margin-bottom: 4px
}

.pm-summary-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    line-height: 1
}

.pm-summary-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em
}

@media(max-width: 768px) {
    .pm-summary-cards {
        grid-template-columns:repeat(2,1fr)
    }
}

@media(max-width: 480px) {
    .pm-summary-cards {
        grid-template-columns:1fr 1fr;
        gap: 8px
    }

    .pm-summary-card {
        padding: 12px
    }

    .pm-summary-value {
        font-size: 20px
    }
}

.pm-editor-page {
    display: flex;
    flex-direction: column;
    height: 100%
}

.pm-editor-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px
}

.pm-editor-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: var(--text)
}

.pm-editor-content {
    flex: 1;
    overflow-y: auto
}

.pm-editor-main {
    max-width: 700px
}

.pm-editor-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px
}

.pm-editor-section h3 {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 16px
}

.pm-form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit,minmax(150px,1fr));
    gap: 12px
}

.pm-materials-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px
}

.pm-material-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: var(--card2);
    border-radius: 8px
}

.pm-material-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px
}

.pm-add-material {
    display: flex;
    gap: 8px;
    align-items: center
}

@media(max-width: 480px) {
    .pm-form-row {
        grid-template-columns:1fr
    }

    .pm-add-material {
        flex-wrap: wrap
    }
}

.inv-dashboard {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.inv-summary-cards {
    display: grid;
    grid-template-columns: repeat(4,1fr);
    gap: 12px
}

.inv-summary-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    cursor: pointer;
    transition: all .15s
}

.inv-summary-card:hover {
    border-color: var(--border-hi);
    transform: translateY(-1px)
}

.inv-summary-warning {
    border-color: #f59e0b4d;
    background: #f59e0b0a
}

.inv-summary-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    line-height: 1
}

.inv-summary-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em
}

@media(max-width: 768px) {
    .inv-summary-cards {
        grid-template-columns:repeat(2,1fr)
    }
}

.stock-level-page,.receive-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.receive-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border)
}

.receive-form {
    max-width: 800px
}

.receive-line {
    padding: 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 8px
}

.receive-line-fields {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    flex-wrap: wrap
}

@media(max-width: 768px) {
    .receive-line-fields {
        flex-direction:column
    }

    .receive-line-fields .form-group {
        width: 100%!important;
        flex: none!important
    }
}

.count-list-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.count-cards {
    display: flex;
    flex-direction: column;
    gap: 10px
}

.count-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 18px;
    cursor: pointer;
    transition: all .15s
}

.count-card:hover {
    border-color: var(--accent);
    transform: translateY(-1px)
}

.count-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px
}

.count-card-meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--muted)
}

.count-detail-page {
    display: flex;
    flex-direction: column;
    gap: 16px
}

.count-detail-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border)
}

.count-detail-meta {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: var(--muted);
    flex-wrap: wrap
}

.count-detail-meta strong {
    color: var(--text)
}

.count-items-list {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden
}

.count-item-header {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    background: var(--card2);
    border-bottom: 1px solid var(--border)
}

.count-item-row {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
    transition: background .1s
}

.count-item-row:last-child {
    border-bottom: none
}

.count-item-row:hover {
    background: var(--hover-subtle)
}

.count-item-variance {
    background: #f59e0b0a
}

@media(max-width: 600px) {
    .count-item-header,.count-item-row {
        font-size:11px;
        padding: 8px 12px
    }
}

.portal-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    color: var(--text)
}

.portal-header {
    background: var(--card);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100
}

.portal-header-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1.25rem;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between
}

.portal-brand {
    display: flex;
    align-items: center;
    gap: .5rem;
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--text);
    text-decoration: none
}

.portal-brand-logo {
    height: 32px;
    width: auto
}

.portal-brand:hover {
    color: var(--accent)
}

.portal-header-right {
    display: flex;
    align-items: center;
    gap: .75rem
}

.portal-user-email {
    font-size: .85rem;
    color: var(--muted)
}

.portal-logout-btn {
    display: flex;
    align-items: center;
    gap: .35rem;
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: .35rem .65rem;
    font-size: .8rem;
    color: var(--muted);
    cursor: pointer;
    transition: color .15s,border-color .15s
}

.portal-logout-btn:hover {
    color: var(--text);
    border-color: var(--border-hi)
}

.portal-main {
    flex: 1;
    padding: 2rem 1.25rem
}

.portal-container {
    max-width: 800px;
    margin: 0 auto
}

.portal-footer {
    border-top: 1px solid var(--border);
    background: var(--card)
}

.portal-footer-inner {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem 1.25rem;
    text-align: center;
    font-size: .8rem;
    color: var(--muted)
}

@media(max-width: 768px) {
    .portal-header-inner {
        padding:0 .75rem;
        height: 50px
    }

    .portal-brand {
        font-size: .95rem;
        gap: .35rem
    }

    .portal-brand-logo {
        height: 28px
    }

    .portal-user-email {
        display: none
    }

    .portal-main {
        padding: 1rem .75rem
    }

    .portal-footer-inner {
        padding: .75rem 1rem;
        font-size: .75rem
    }
}

@media(max-width: 480px) {
    .portal-header-inner {
        padding:0 .5rem;
        height: 48px
    }

    .portal-brand {
        font-size: .9rem
    }

    .portal-brand-logo {
        height: 24px
    }

    .portal-logout-btn {
        padding: .3rem .5rem;
        font-size: .75rem;
        min-height: 36px
    }

    .portal-main {
        padding: .75rem .5rem
    }

    .portal-footer {
        display: none
    }

    .portal-root {
        padding-left: env(safe-area-inset-left,0);
        padding-right: env(safe-area-inset-right,0)
    }
}

.portal-root {
    --portal-primary: #1D4F91;
    --portal-primary-hover: #163d73;
    --portal-primary-light: #B9D9EB;
    --portal-primary-dim: rgba(29, 79, 145, .08);
    --portal-bg: #f5f7fa;
    --portal-card: #ffffff;
    --portal-card2: #f0f4f8;
    --portal-text: #1a2332;
    --portal-text2: #374151;
    --portal-muted: #6b7280;
    --portal-border: #e2e8f0;
    --portal-border-hi: #cbd5e1;
    --portal-shadow: 0 1px 3px rgba(0, 0, 0, .06), 0 1px 2px rgba(0, 0, 0, .04);
    --portal-radius: 8px;
    --bg: var(--portal-bg);
    --card: var(--portal-card);
    --card2: var(--portal-card2);
    --text: var(--portal-text);
    --text2: var(--portal-text2);
    --muted: var(--portal-muted);
    --muted2: var(--portal-muted);
    --border: var(--portal-border);
    --border-hi: var(--portal-border-hi);
    --accent: var(--portal-primary);
    --accent-hover: var(--portal-primary-hover);
    --accent-dim: var(--portal-primary-dim);
    --accent-text: #ffffff;
    --shadow: var(--portal-shadow);
    --radius: var(--portal-radius);
    --radius-sm: 6px;
    --hover: rgba(0, 0, 0, .03);
    background: var(--portal-bg);
    color: var(--portal-text)
}

.portal-header {
    background: #fff;
    border-bottom: none;
    box-shadow: 0 1px 3px #00000014
}

.portal-header:after {
    content: "";
    display: block;
    height: 3px;
    background: linear-gradient(90deg,var(--portal-primary),var(--portal-primary-light))
}

.portal-brand {
    color: var(--portal-primary);
    font-weight: 700
}

.portal-brand:hover {
    color: var(--portal-primary-hover)
}

.portal-footer {
    background: #fff;
    border-top: 1px solid var(--portal-border)
}

.portal-login-wrapper {
    background: linear-gradient(135deg,var(--portal-bg) 0%,var(--portal-primary-light) 100%);
    min-height: 60vh
}

.portal-login-card {
    background: #fff;
    border: 1px solid var(--portal-border);
    box-shadow: 0 8px 32px #1d4f911a
}

.portal-login-title {
    color: var(--portal-primary)
}

.portal-login-btn {
    background: var(--portal-primary);
    color: #fff
}

.portal-login-btn:hover:not(:disabled) {
    background: var(--portal-primary-hover)
}

.portal-login-input {
    background: #f8fafc;
    border-color: var(--portal-border);
    color: var(--portal-text)
}

.portal-login-input:focus {
    border-color: var(--portal-primary);
    box-shadow: 0 0 0 3px var(--portal-primary-dim)
}

.portal-stat-card,.portal-sr-card,.portal-info-card,.portal-thread-section,.portal-timeline {
    background: #fff;
    border: 1px solid var(--portal-border);
    box-shadow: var(--portal-shadow)
}

.portal-sr-card:hover {
    border-color: var(--portal-primary);
    box-shadow: 0 2px 8px #1d4f911a
}

.portal-btn-primary {
    background: var(--portal-primary);
    border-color: var(--portal-primary);
    color: #fff
}

.portal-btn-primary:hover {
    background: var(--portal-primary-hover)
}

.portal-input,.portal-textarea,.portal-select,.portal-search,.portal-reply-input {
    background: #f8fafc;
    border-color: var(--portal-border);
    color: var(--portal-text)
}

.portal-input:focus,.portal-textarea:focus,.portal-select:focus,.portal-search:focus,.portal-reply-input:focus {
    border-color: var(--portal-primary);
    box-shadow: 0 0 0 3px var(--portal-primary-dim);
    outline: none
}

.portal-drop-zone {
    background: #f8fafc;
    border-color: var(--portal-border)
}

.portal-drop-zone:hover,.portal-drop-active {
    border-color: var(--portal-primary);
    background: var(--portal-primary-dim)
}

.portal-reply-send {
    background: var(--portal-primary);
    border-color: var(--portal-primary)
}

.portal-msg-right {
    background: var(--portal-primary);
    color: #fff
}

.portal-msg-left {
    background: #f0f4f8;
    border-color: var(--portal-border);
    color: var(--portal-text)
}

.portal-step-current .portal-timeline-dot {
    color: var(--portal-primary)
}

.portal-step-current .portal-timeline-label {
    color: var(--portal-primary)
}

.portal-logout-btn {
    border-color: var(--portal-border);
    color: var(--portal-muted)
}

.portal-logout-btn:hover {
    color: var(--portal-primary);
    border-color: var(--portal-primary)
}

.portal-reply-attach {
    background: #f8fafc;
    border-color: var(--portal-border)
}

.portal-reply-attach:hover {
    color: var(--portal-primary);
    border-color: var(--portal-primary)
}

.portal-back-btn:hover {
    color: var(--portal-primary)
}

@media(max-width: 768px) {
    .portal-root {
        -webkit-text-size-adjust:100%
    }
}

@media(max-width: 480px) {
    .portal-root {
        font-size:max(14px,1rem)
    }

    .portal-root button,.portal-root a,.portal-root select,.portal-root [role=button] {
        min-height: 44px
    }

    .portal-root input[type=text],.portal-root input[type=email],.portal-root input[type=password],.portal-root input[type=search],.portal-root input[type=tel],.portal-root input[type=url],.portal-root textarea,.portal-root select {
        font-size: max(16px,1rem)
    }

    .portal-root {
        overflow-x: hidden
    }
}

.portal-login-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh
}

.portal-login-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 4px 24px #0000001f
}

.portal-login-brand {
    text-align: center;
    margin-bottom: 2rem
}

.portal-login-logo {
    height: 60px;
    width: auto;
    margin-bottom: 1rem
}

.portal-login-icon {
    color: var(--accent);
    margin-bottom: .75rem
}

.portal-login-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 .35rem
}

.portal-login-subtitle {
    font-size: .9rem;
    color: var(--muted);
    margin: 0
}

.portal-login-form {
    display: flex;
    flex-direction: column;
    gap: .75rem
}

.portal-login-label {
    font-size: .85rem;
    font-weight: 500;
    color: var(--text2)
}

.portal-login-input {
    padding: .65rem .85rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--card2);
    color: var(--text);
    font-size: .95rem;
    outline: none;
    transition: border-color .15s,box-shadow .15s
}

.portal-login-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.portal-login-input::placeholder {
    color: var(--muted)
}

.portal-login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .4rem;
    padding: .7rem 1rem;
    margin-top: .25rem;
    background: var(--accent);
    color: var(--accent-text);
    border: none;
    border-radius: 8px;
    font-size: .95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s
}

.portal-login-btn:hover:not(:disabled) {
    background: var(--accent-hover)
}

.portal-login-btn:disabled {
    opacity: .55;
    cursor: not-allowed
}

.portal-login-success-section {
    display: flex;
    flex-direction: column;
    gap: 1rem
}

.portal-login-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .5rem;
    text-align: center;
    color: #22c55e
}

.portal-login-success p {
    color: var(--text, #1a2332);
    font-size: .95rem;
    margin: 0;
    line-height: 1.5
}

.portal-login-link-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .8rem 1.2rem;
    background: var(--portal-primary, #1D4F91);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: opacity .15s
}

.portal-login-link-btn:hover {
    opacity: .9
}

.portal-login-demo-note {
    display: flex;
    align-items: flex-start;
    gap: .5rem;
    padding: .75rem 1rem;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    font-size: .8rem;
    color: #1e40af;
    line-height: 1.5
}

.portal-login-demo-note svg {
    flex-shrink: 0;
    margin-top: 2px
}

.portal-login-retry {
    background: none;
    border: none;
    color: var(--portal-primary, #1D4F91);
    font-size: .85rem;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    text-align: center
}

.portal-login-retry:hover {
    opacity: .7
}

.portal-login-error {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .85rem;
    color: #ef4444
}

@keyframes portal-spin {
    to {
        transform: rotate(360deg)
    }
}

@media(max-width: 768px) {
    .portal-login-card {
        padding:2rem 1.5rem;
        max-width: 400px
    }

    .portal-login-input {
        min-height: 48px;
        font-size: 1rem;
        padding: .75rem .85rem
    }

    .portal-login-btn {
        min-height: 48px;
        font-size: 1rem
    }
}

@media(max-width: 480px) {
    .portal-login-wrapper {
        align-items:stretch;
        min-height: calc(100vh - 48px);
        padding: 0
    }

    .portal-login-card {
        max-width: 100%;
        border-radius: 0;
        border-left: none;
        border-right: none;
        padding: 2rem 1rem;
        box-shadow: none;
        margin: 0
    }

    .portal-login-logo {
        height: 48px
    }

    .portal-login-title {
        font-size: 1.25rem
    }

    .portal-login-subtitle {
        font-size: .875rem
    }

    .portal-login-form {
        gap: 1rem
    }

    .portal-login-label {
        font-size: .9rem
    }

    .portal-login-input {
        min-height: 48px;
        font-size: 1rem;
        padding: .75rem 1rem;
        border-radius: 10px
    }

    .portal-login-btn {
        min-height: 52px;
        font-size: 1.05rem;
        border-radius: 10px;
        margin-top: .5rem
    }

    .portal-login-error {
        font-size: .875rem
    }
}

.portal-dashboard {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px 16px
}

.portal-dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px
}

.portal-dashboard-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0
}

.portal-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius);
    font-size: .875rem;
    font-weight: 600;
    border: 1px solid var(--border);
    cursor: pointer;
    transition: background .15s,box-shadow .15s;
    background: var(--card);
    color: var(--text)
}

.portal-btn-primary {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent)
}

.portal-btn-primary:hover {
    opacity: .9
}

.portal-stats-row {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 12px;
    margin-bottom: 20px
}

.portal-stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--card);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow)
}

.portal-stat-card svg {
    flex-shrink: 0
}

.portal-stat-open svg {
    color: #3b82f6
}

.portal-stat-progress svg {
    color: #f59e0b
}

.portal-stat-completed svg {
    color: #22c55e
}

.portal-stat-info {
    display: flex;
    flex-direction: column
}

.portal-stat-count {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text)
}

.portal-stat-label {
    font-size: .75rem;
    color: var(--muted)
}

.portal-filter-row {
    display: flex;
    gap: 10px;
    margin-bottom: 16px
}

.portal-select {
    padding: 8px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: .875rem;
    min-width: 160px
}

.portal-search-wrap {
    position: relative;
    flex: 1
}

.portal-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none
}

.portal-search {
    width: 100%;
    padding: 8px 12px 8px 34px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: .875rem;
    box-sizing: border-box
}

.portal-search::placeholder {
    color: var(--muted)
}

.portal-sr-list {
    display: flex;
    flex-direction: column;
    gap: 10px
}

.portal-sr-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    cursor: pointer;
    transition: box-shadow .15s,border-color .15s;
    box-shadow: var(--shadow)
}

.portal-sr-card:hover {
    border-color: var(--accent);
    box-shadow: 0 2px 8px #00000014
}

.portal-sr-skeleton {
    display: flex;
    flex-direction: column;
    gap: 10px;
    cursor: default
}

.portal-sr-skeleton:hover {
    border-color: var(--border);
    box-shadow: var(--shadow)
}

.portal-sr-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px
}

.portal-sr-number {
    font-weight: 600;
    font-size: .875rem;
    color: var(--text)
}

.portal-sr-card-mid {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px
}

.portal-sr-summary {
    font-size: .875rem;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.portal-sr-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: .75rem;
    color: var(--muted)
}

.portal-sr-location {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60%
}

.portal-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    color: var(--muted);
    text-align: center
}

.portal-empty svg {
    margin-bottom: 12px;
    opacity: .4
}

.portal-empty p {
    margin: 4px 0;
    font-size: 1rem;
    color: var(--text)
}

.portal-empty .portal-empty-sub {
    color: var(--muted);
    font-size: .875rem;
    margin-bottom: 16px
}

@media(max-width: 768px) {
    .portal-dashboard {
        padding:16px 12px
    }

    .portal-dashboard-header {
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 16px
    }

    .portal-dashboard-header h1 {
        font-size: 1.25rem
    }

    .portal-stats-row {
        gap: 8px
    }

    .portal-stat-card {
        padding: 12px
    }

    .portal-filter-row {
        flex-direction: column;
        gap: 8px
    }

    .portal-select {
        min-width: 100%;
        min-height: 44px;
        font-size: .9rem
    }

    .portal-search {
        min-height: 44px;
        font-size: .9rem
    }

    .portal-sr-card {
        padding: 14px 12px
    }

    .portal-btn {
        min-height: 44px;
        font-size: .9rem
    }
}

@media(max-width: 480px) {
    .portal-dashboard {
        padding:12px 8px
    }

    .portal-dashboard-header {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
        margin-bottom: 12px
    }

    .portal-dashboard-header h1 {
        font-size: 1.15rem
    }

    .portal-dashboard-header .portal-btn,.portal-dashboard-header a {
        width: 100%;
        justify-content: center;
        min-height: 48px;
        font-size: .95rem
    }

    .portal-stats-row {
        grid-template-columns: 1fr;
        gap: 6px;
        margin-bottom: 12px
    }

    .portal-stat-card {
        padding: 12px 10px;
        gap: 10px
    }

    .portal-stat-count {
        font-size: 1.1rem
    }

    .portal-stat-label {
        font-size: .7rem
    }

    .portal-filter-row {
        flex-direction: column;
        gap: 6px;
        margin-bottom: 10px
    }

    .portal-select {
        min-width: 100%;
        min-height: 48px;
        font-size: 1rem;
        padding: 10px 12px
    }

    .portal-search {
        min-height: 48px;
        font-size: 1rem;
        padding: 10px 12px 10px 36px
    }

    .portal-sr-list {
        gap: 8px
    }

    .portal-sr-card {
        padding: 12px 10px
    }

    .portal-sr-number,.portal-sr-summary {
        font-size: .85rem
    }

    .portal-sr-card-bottom {
        font-size: .7rem
    }

    .portal-status-badge,.portal-category-badge {
        font-size: .65rem;
        padding: 2px 6px
    }

    .portal-empty {
        padding: 32px 12px
    }

    .portal-btn {
        min-height: 48px;
        padding: 10px 16px;
        font-size: .95rem
    }
}

.lp-container {
    position: relative
}

.lp-trigger {
    display: flex;
    align-items: center;
    min-height: 42px;
    padding: 6px 12px;
    border-radius: var(--portal-radius, 8px);
    border: 1px solid var(--portal-border, #e2e8f0);
    background: #f8fafc;
    cursor: pointer;
    transition: border-color .15s,box-shadow .15s;
    font-size: .875rem;
    color: var(--portal-text, #1a2332)
}

.lp-trigger:hover {
    border-color: var(--portal-border-hi, #cbd5e1)
}

.lp-trigger-focus {
    border-color: var(--portal-primary, #1D4F91);
    box-shadow: 0 0 0 3px var(--portal-primary-dim, rgba(29, 79, 145, .08))
}

.lp-placeholder {
    color: var(--portal-muted, #6b7280)
}

.lp-selected {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px
}

.lp-selected-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0
}

.lp-selected-name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.lp-selected-crumb {
    font-size: .75rem;
    color: var(--portal-muted, #6b7280);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.lp-clear-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: var(--portal-border, #e2e8f0);
    color: var(--portal-muted, #6b7280);
    cursor: pointer;
    padding: 0;
    transition: background .15s,color .15s
}

.lp-clear-btn:hover {
    background: #ef4444;
    color: #fff
}

.lp-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--portal-card, #ffffff);
    border: 1px solid var(--portal-border, #e2e8f0);
    border-radius: var(--portal-radius, 8px);
    box-shadow: 0 4px 16px #0000001a,0 1px 4px #0000000f;
    overflow: hidden
}

.lp-search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--portal-border, #e2e8f0)
}

.lp-search-icon {
    flex-shrink: 0;
    color: var(--portal-muted, #6b7280)
}

.lp-search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: .875rem;
    color: var(--portal-text, #1a2332);
    font-family: inherit
}

.lp-search-input::placeholder {
    color: var(--portal-muted, #6b7280)
}

.lp-search-clear {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background: var(--portal-border, #e2e8f0);
    color: var(--portal-muted, #6b7280);
    cursor: pointer;
    padding: 0
}

.lp-search-clear:hover {
    background: var(--portal-muted, #6b7280);
    color: #fff
}

.lp-breadcrumb {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--portal-border, #e2e8f0);
    background: var(--portal-card2, #f0f4f8);
    flex-wrap: wrap
}

.lp-crumb-segment {
    display: inline-flex;
    align-items: center;
    gap: 2px
}

.lp-crumb-sep {
    color: var(--portal-muted, #6b7280);
    flex-shrink: 0
}

.lp-crumb-btn {
    background: none;
    border: none;
    color: var(--portal-primary, #1D4F91);
    font-size: .75rem;
    font-weight: 500;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    white-space: nowrap
}

.lp-crumb-btn:hover {
    background: var(--portal-primary-dim, rgba(29, 79, 145, .08));
    text-decoration: underline
}

.lp-crumb-active {
    color: var(--portal-text, #1a2332);
    font-weight: 600;
    cursor: default
}

.lp-crumb-active:hover {
    background: none;
    text-decoration: none
}

.lp-results {
    max-height: 300px;
    overflow-y: auto
}

.lp-loading,.lp-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 16px;
    color: var(--portal-muted, #6b7280);
    font-size: .875rem
}

.lp-spinner {
    animation: lp-spin .8s linear infinite
}

@keyframes lp-spin {
    0% {
        transform: rotate(0)
    }

    to {
        transform: rotate(360deg)
    }
}

.lp-item-wrapper {
    display: flex;
    align-items: center;
    border-top: 1px solid var(--portal-border, #e2e8f0)
}

.lp-item-wrapper:first-child {
    border-top: none
}

.lp-select-btn {
    padding: 4px 10px;
    margin-right: 8px;
    border: 1px solid var(--portal-primary, #1D4F91);
    border-radius: 4px;
    background: transparent;
    color: var(--portal-primary, #1D4F91);
    font-size: .75rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0
}

.lp-select-btn:hover {
    background: var(--portal-primary, #1D4F91);
    color: #fff
}

.lp-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background .1s;
    color: var(--portal-text, #1a2332)
}

.lp-item:hover {
    background: var(--portal-primary-dim, rgba(29, 79, 145, .08))
}

.lp-item+.lp-item {
    border-top: 1px solid var(--portal-border, #e2e8f0)
}

.lp-item-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--portal-primary-dim, rgba(29, 79, 145, .08));
    color: var(--portal-primary, #1D4F91)
}

.lp-item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px
}

.lp-item-row {
    display: flex;
    align-items: center;
    gap: 8px
}

.lp-item-name {
    font-size: .875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.lp-item-breadcrumb {
    font-size: .75rem;
    color: var(--portal-muted, #6b7280);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis
}

.lp-drill-icon {
    flex-shrink: 0;
    color: var(--portal-muted, #6b7280)
}

.lp-type-badge {
    flex-shrink: 0;
    display: inline-block;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: .65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .03em
}

.lp-type-campus {
    background: #dbeafe;
    color: #1d4ed8
}

.lp-type-building {
    background: #fef3c7;
    color: #92400e
}

.lp-type-floor {
    background: #e0e7ff;
    color: #3730a3
}

.lp-type-room {
    background: #dcfce7;
    color: #166534
}

.lp-type-suite {
    background: #fce7f3;
    color: #9d174d
}

.lp-type-closet {
    background: #f3e8ff;
    color: #6b21a8
}

.lp-type-area {
    background: #ffedd5;
    color: #9a3412
}

@media(max-width: 768px) {
    .lp-trigger {
        min-height:44px;
        font-size: .9rem
    }

    .lp-search-input {
        font-size: 1rem;
        min-height: 40px
    }

    .lp-item {
        padding: 12px;
        min-height: 44px
    }

    .lp-item-name {
        font-size: .9rem
    }

    .lp-dropdown {
        position: fixed;
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 12px 12px 0 0;
        max-height: 70vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 -4px 24px #00000026
    }

    .lp-results {
        max-height: none;
        flex: 1;
        overflow-y: auto
    }
}

@media(max-width: 480px) {
    .lp-trigger {
        min-height:48px;
        font-size: 1rem;
        padding: 8px 12px
    }

    .lp-clear-btn {
        width: 28px;
        height: 28px
    }

    .lp-dropdown {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        border-radius: 0;
        max-height: 100vh;
        max-height: 100dvh;
        z-index: 200;
        display: flex;
        flex-direction: column;
        box-shadow: none
    }

    .lp-search-box {
        padding: 12px;
        min-height: 52px
    }

    .lp-search-input {
        font-size: 1rem;
        min-height: 44px
    }

    .lp-search-clear {
        width: 28px;
        height: 28px
    }

    .lp-breadcrumb {
        padding: 8px 12px
    }

    .lp-crumb-btn {
        font-size: .8rem;
        padding: 4px 6px;
        min-height: 32px
    }

    .lp-results {
        max-height: none;
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch
    }

    .lp-item {
        padding: 14px 12px;
        min-height: 52px;
        gap: 12px
    }

    .lp-item-icon {
        width: 36px;
        height: 36px
    }

    .lp-item-name {
        font-size: .95rem
    }

    .lp-item-breadcrumb {
        font-size: .8rem
    }

    .lp-type-badge {
        font-size: .7rem;
        padding: 2px 8px
    }

    .lp-loading,.lp-empty {
        padding: 32px 16px;
        font-size: .9rem
    }

    .lp-selected-name {
        font-size: .95rem
    }

    .lp-selected-crumb {
        font-size: .8rem
    }
}

.portal-new-request {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px 16px
}

.portal-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: .875rem;
    padding: 4px 0;
    margin-bottom: 16px
}

.portal-new-request h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 24px
}

.portal-sr-form {
    display: flex;
    flex-direction: column;
    gap: 20px
}

.portal-form-error {
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius);
    color: #b91c1c;
    font-size: .875rem
}

.portal-form-group {
    display: flex;
    flex-direction: column;
    gap: 6px
}

.portal-form-label {
    font-size: .875rem;
    font-weight: 600;
    color: var(--text)
}

.portal-required {
    color: #ef4444
}

.portal-input {
    padding: 10px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: .875rem
}

.portal-input::placeholder,.portal-textarea::placeholder {
    color: var(--muted)
}

.portal-textarea {
    padding: 10px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: .875rem;
    resize: vertical;
    font-family: inherit
}

.portal-char-count {
    font-size: .75rem;
    color: var(--muted);
    text-align: right
}

.portal-drop-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 16px;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    cursor: pointer;
    transition: border-color .15s,background .15s;
    color: var(--muted)
}

.portal-drop-zone p {
    margin: 0;
    font-size: .875rem
}

.portal-drop-zone:hover,.portal-drop-active {
    border-color: var(--accent);
    background: var(--card)
}

.portal-file-previews {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px
}

.portal-file-thumb {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--border)
}

.portal-file-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover
}

.portal-thumb-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: none;
    background: #0009;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0
}

.portal-btn-lg {
    padding: 12px 24px;
    font-size: 1rem
}

@media(max-width: 768px) {
    .portal-new-request {
        padding:16px 12px
    }

    .portal-new-request h1 {
        font-size: 1.25rem;
        margin-bottom: 16px
    }

    .portal-input,.portal-textarea {
        font-size: 1rem;
        padding: 12px;
        min-height: 44px
    }

    .portal-form-label {
        font-size: .9rem
    }

    .portal-btn-lg {
        min-height: 48px;
        font-size: 1rem
    }
}

@media(max-width: 480px) {
    .portal-new-request {
        padding:12px 8px
    }

    .portal-new-request h1 {
        font-size: 1.15rem;
        margin-bottom: 12px
    }

    .portal-sr-form {
        gap: 16px
    }

    .portal-form-group {
        gap: 4px
    }

    .portal-form-label {
        font-size: .9rem
    }

    .portal-input,.portal-textarea {
        width: 100%;
        font-size: 1rem;
        padding: 12px;
        min-height: 48px;
        border-radius: 10px;
        box-sizing: border-box
    }

    .portal-textarea {
        min-height: 100px
    }

    .portal-drop-zone {
        padding: 20px 12px
    }

    .portal-drop-zone p {
        font-size: .9rem
    }

    .portal-file-previews {
        gap: 6px
    }

    .portal-file-thumb {
        width: 64px;
        height: 64px
    }

    .portal-thumb-remove {
        width: 24px;
        height: 24px;
        top: 4px;
        right: 4px
    }

    .portal-back-btn {
        min-height: 44px;
        font-size: .9rem;
        padding: 8px 0
    }

    .portal-btn-lg {
        width: 100%;
        min-height: 52px;
        font-size: 1.05rem;
        border-radius: 12px;
        justify-content: center
    }

    .portal-char-count {
        font-size: .7rem
    }

    .portal-form-error {
        font-size: .875rem;
        padding: 10px 12px
    }
}

.portal-detail {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px
}

.portal-success-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    border-radius: var(--radius);
    color: #15803d;
    font-size: .875rem;
    font-weight: 500
}

.portal-cancelled-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: var(--radius);
    color: #b45309;
    font-size: .875rem;
    font-weight: 500
}

.portal-timeline {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 20px;
    box-shadow: var(--shadow);
    position: relative
}

.portal-timeline-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    flex: 1;
    z-index: 1
}

.portal-timeline-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px
}

.portal-step-done .portal-timeline-dot {
    color: #22c55e
}

.portal-step-current .portal-timeline-dot {
    color: var(--accent)
}

.portal-step-future .portal-timeline-dot {
    color: var(--border)
}

.portal-timeline-label {
    font-size: .75rem;
    font-weight: 600;
    text-align: center;
    color: var(--muted)
}

.portal-step-done .portal-timeline-label {
    color: #15803d
}

.portal-step-current .portal-timeline-label {
    color: var(--accent)
}

.portal-timeline-date {
    font-size: .65rem;
    color: var(--muted);
    margin-top: 2px
}

.portal-timeline-line {
    position: absolute;
    top: 10px;
    left: 55%;
    width: 90%;
    height: 2px;
    background: var(--border);
    z-index: -1
}

.portal-line-done {
    background: #22c55e
}

.portal-info-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow)
}

.portal-info-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border)
}

.portal-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill,minmax(180px,1fr));
    gap: 12px;
    margin-bottom: 16px
}

.portal-info-item {
    display: flex;
    flex-direction: column;
    gap: 4px
}

.portal-info-label {
    font-size: .7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--muted)
}

.portal-info-value {
    font-size: .875rem;
    color: var(--text)
}

.portal-info-summary {
    padding-top: 12px;
    border-top: 1px solid var(--border)
}

.portal-info-summary p {
    margin: 4px 0 12px;
    font-size: .875rem;
    color: var(--text);
    line-height: 1.5
}

.portal-info-attachments {
    padding-top: 12px;
    border-top: 1px solid var(--border)
}

.portal-attachment-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px
}

.portal-attachment-link {
    display: inline-block;
    padding: 4px 10px;
    font-size: .8rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    color: var(--accent);
    text-decoration: none
}

.portal-attachment-link:hover {
    background: var(--card2, var(--card))
}

.portal-thread-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden
}

.portal-thread-section h2 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    padding: 16px 20px;
    margin: 0;
    border-bottom: 1px solid var(--border)
}

.portal-thread {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto
}

.portal-thread-empty {
    text-align: center;
    color: var(--muted);
    font-size: .875rem;
    padding: 16px 0
}

.portal-message {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: var(--radius);
    font-size: .875rem
}

.portal-msg-left {
    align-self: flex-start;
    background: var(--bg);
    border: 1px solid var(--border)
}

.portal-msg-right {
    align-self: flex-end;
    background: var(--accent);
    color: #fff;
    border: 1px solid transparent
}

.portal-msg-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px
}

.portal-msg-author {
    font-weight: 600;
    font-size: .75rem
}

.portal-msg-right .portal-msg-author {
    color: #ffffffe6
}

.portal-author-badge {
    font-size: .6rem;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 99px;
    text-transform: uppercase
}

.portal-author-requester {
    background: #ffffff40;
    color: #fff
}

.portal-author-staff {
    background: #dbeafe;
    color: #1d4ed8
}

.portal-author-maximo {
    background: #ede9fe;
    color: #7c3aed
}

.portal-msg-time {
    font-size: .65rem;
    opacity: .7;
    margin-left: auto
}

.portal-msg-body {
    line-height: 1.4
}

.portal-msg-attachments {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px
}

.portal-msg-right .portal-attachment-link {
    background: #ffffff26;
    border-color: #ffffff4d;
    color: #fff
}

.portal-reply-section {
    padding: 12px 20px;
    border-top: 1px solid var(--border)
}

.portal-reply-row {
    display: flex;
    align-items: center;
    gap: 8px
}

.portal-reply-input {
    flex: 1;
    padding: 10px 12px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: .875rem
}

.portal-reply-input::placeholder {
    color: var(--muted)
}

.portal-reply-attach,.portal-reply-send {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--muted);
    cursor: pointer;
    flex-shrink: 0
}

.portal-reply-attach:hover {
    color: var(--text)
}

.portal-reply-send {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff
}

.portal-reply-send:disabled {
    opacity: .5;
    cursor: not-allowed
}

.portal-file-input {
    display: none
}

.portal-cancel-section {
    display: flex;
    justify-content: flex-end
}

.portal-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px
}

.portal-sr-number {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text)
}

.portal-status-badge {
    font-size: .7rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 99px;
    text-transform: uppercase;
    letter-spacing: .03em
}

.portal-status-submitted {
    background: #dbeafe;
    color: #1d4ed8
}

.portal-status-received {
    background: #e0e7ff;
    color: #4338ca
}

.portal-status-in-progress {
    background: #fef3c7;
    color: #b45309
}

.portal-status-completed {
    background: #dcfce7;
    color: #15803d
}

.portal-status-cancelled,.portal-status-closed {
    background: #f3f4f6;
    color: #6b7280
}

.portal-category-badge {
    font-size: .7rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 99px;
    flex-shrink: 0
}

.portal-cat-blue {
    background: #dbeafe;
    color: #1d4ed8
}

.portal-cat-amber {
    background: #fef3c7;
    color: #b45309
}

.portal-cat-green {
    background: #dcfce7;
    color: #15803d
}

.portal-cat-red {
    background: #fee2e2;
    color: #b91c1c
}

.portal-cat-gray {
    background: #f3f4f6;
    color: #6b7280
}

.portal-cat-purple {
    background: #ede9fe;
    color: #7c3aed
}

.portal-cat-cyan {
    background: #cffafe;
    color: #0e7490
}

.portal-back-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    font-size: .875rem;
    padding: 4px 0
}

.portal-back-btn:hover {
    color: var(--text)
}

.portal-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius);
    font-size: .875rem;
    font-weight: 600;
    border: 1px solid var(--border);
    cursor: pointer;
    transition: background .15s;
    background: var(--card);
    color: var(--text)
}

.portal-btn-danger {
    background: #ef4444;
    color: #fff;
    border-color: #ef4444
}

.portal-btn-danger:hover {
    opacity: .9
}

.portal-btn:disabled {
    opacity: .5;
    cursor: not-allowed
}

.portal-spinner {
    animation: portal-spin .8s linear infinite
}

@keyframes portal-spin {
    0% {
        transform: rotate(0)
    }

    to {
        transform: rotate(360deg)
    }
}

.portal-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px;
    color: var(--muted)
}

@media(max-width: 768px) {
    .portal-detail {
        padding:16px 12px;
        gap: 16px
    }

    .portal-timeline {
        padding: 16px 12px
    }

    .portal-timeline-label {
        font-size: .7rem
    }

    .portal-info-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px
    }

    .portal-info-card {
        padding: 16px
    }

    .portal-message {
        max-width: 88%
    }

    .portal-thread {
        padding: 12px 16px
    }

    .portal-reply-section {
        padding: 10px 16px
    }

    .portal-reply-attach,.portal-reply-send {
        width: 44px;
        height: 44px;
        min-width: 44px;
        min-height: 44px
    }

    .portal-reply-input {
        min-height: 44px;
        font-size: .9rem
    }
}

@media(max-width: 480px) {
    .portal-detail {
        padding:10px 6px;
        gap: 12px
    }

    .portal-back-btn {
        min-height: 44px;
        font-size: .9rem;
        padding: 8px 0
    }

    .portal-timeline {
        flex-direction: column;
        align-items: flex-start;
        gap: 0;
        padding: 16px
    }

    .portal-timeline-step {
        flex-direction: row;
        align-items: center;
        gap: 12px;
        flex: unset;
        width: 100%;
        padding: 8px 0
    }

    .portal-timeline-dot {
        margin-bottom: 0;
        flex-shrink: 0
    }

    .portal-timeline-label {
        font-size: .8rem;
        text-align: left
    }

    .portal-timeline-date {
        font-size: .7rem;
        margin-top: 0;
        margin-left: auto;
        flex-shrink: 0
    }

    .portal-timeline-line {
        display: none
    }

    .portal-info-grid {
        grid-template-columns: 1fr;
        gap: 8px
    }

    .portal-info-card {
        padding: 12px
    }

    .portal-info-header {
        margin-bottom: 12px;
        padding-bottom: 8px;
        flex-wrap: wrap;
        gap: 8px
    }

    .portal-info-label {
        font-size: .7rem
    }

    .portal-info-value,.portal-info-summary p {
        font-size: .875rem
    }

    .portal-thread {
        padding: 10px 12px;
        max-height: 350px
    }

    .portal-message {
        max-width: 95%;
        font-size: .875rem;
        padding: 10px 12px
    }

    .portal-msg-author {
        font-size: .75rem
    }

    .portal-msg-time {
        font-size: .6rem
    }

    .portal-thread-section h2 {
        font-size: .95rem;
        padding: 12px 14px
    }

    .portal-reply-section {
        padding: 8px 12px;
        padding-bottom: calc(8px + env(safe-area-inset-bottom,0));
        position: sticky;
        bottom: 0;
        background: var(--card, #fff);
        z-index: 10;
        border-top: 1px solid var(--border, #e2e8f0)
    }

    .portal-reply-input {
        min-height: 48px;
        font-size: 1rem;
        padding: 10px 12px
    }

    .portal-reply-attach,.portal-reply-send {
        width: 48px;
        height: 48px;
        min-width: 48px;
        min-height: 48px;
        border-radius: 10px
    }

    .portal-cancel-section {
        justify-content: stretch
    }

    .portal-cancel-section .portal-btn {
        width: 100%;
        justify-content: center;
        min-height: 48px
    }

    .portal-modal-footer {
        flex-direction: column;
        gap: 6px
    }

    .portal-modal-footer .portal-btn {
        width: 100%;
        justify-content: center;
        min-height: 48px
    }

    .portal-success-banner,.portal-cancelled-banner {
        font-size: .85rem;
        padding: 10px 12px
    }

    .portal-attachment-link {
        min-height: 36px;
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        font-size: .8rem
    }

    .portal-sr-number {
        font-size: .95rem
    }

    .portal-status-badge {
        font-size: .65rem
    }

    .portal-btn {
        min-height: 44px;
        font-size: .9rem
    }
}

.asc-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: #f0f4f8;
    display: flex;
    flex-direction: column;
    font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif
}

.asc-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0
}

.asc-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1a2332;
    flex: 1
}

.asc-field-count {
    font-size: .8rem;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 12px
}

.asc-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0
}

.asc-close:hover {
    background: #fee2e2;
    color: #ef4444;
    border-color: #fecaca
}

.asc-body {
    display: flex;
    flex-direction: row;
    flex: 1;
    min-height: 0;
    padding: 16px;
    gap: 16px;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    box-sizing: border-box
}

.asc-chat {
    flex: 0 0 60%;
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    min-width: 0
}

.asc-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px
}

.asc-msg {
    display: flex;
    flex-direction: column;
    max-width: 80%
}

.asc-msg-ai {
    align-self: flex-start
}

.asc-msg-user {
    align-self: flex-end
}

.asc-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: .9rem;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap
}

.asc-msg-ai .asc-bubble {
    background: #f1f5f9;
    color: #1e293b;
    border-bottom-left-radius: 4px
}

.asc-msg-user .asc-bubble {
    background: #1d4f91;
    color: #fff;
    border-bottom-right-radius: 4px
}

.asc-msg-photo {
    max-width: 180px;
    border-radius: 12px;
    margin-bottom: 6px;
    border: 1px solid #e2e8f0
}

.asc-msg-user .asc-msg-photo {
    align-self: flex-end
}

.asc-typing {
    display: flex;
    gap: 5px;
    padding: 12px 18px!important
}

.asc-typing span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #94a3b8;
    animation: asc-bounce 1.2s infinite
}

.asc-typing span:nth-child(2) {
    animation-delay: .15s
}

.asc-typing span:nth-child(3) {
    animation-delay: .3s
}

@keyframes asc-bounce {
    0%,60%,to {
        transform: translateY(0)
    }

    30% {
        transform: translateY(-5px)
    }
}

.asc-input-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #e2e8f0;
    flex-shrink: 0
}

.asc-input-bar input[type=text] {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 24px;
    font-size: .9rem;
    background: #f8fafc;
    color: #1a1a1a;
    outline: none
}

.asc-input-bar input[type=text]:focus {
    border-color: #1d4f91
}

.asc-input-bar input[type=text]::placeholder {
    color: #94a3b8
}

.asc-attach,.asc-send {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0
}

.asc-attach {
    background: #f1f5f9;
    color: #64748b
}

.asc-attach:hover {
    background: #e2e8f0
}

.asc-send {
    background: #1d4f91;
    color: #fff
}

.asc-send:disabled {
    opacity: .4;
    cursor: not-allowed
}

.asc-fields {
    flex: 0 0 38%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    min-width: 0
}

.asc-fields-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px
}

.asc-fields-card h3 {
    font-size: .95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 16px
}

.asc-field-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9
}

.asc-field-row:last-child {
    border-bottom: none
}

.asc-field-icon {
    width: 24px;
    text-align: center;
    flex-shrink: 0
}

.asc-field-label {
    font-size: .8rem;
    font-weight: 600;
    color: #64748b;
    min-width: 80px;
    flex-shrink: 0
}

.asc-field-value {
    flex: 1;
    min-width: 0;
    font-size: .85rem
}

.asc-field-value input,.asc-field-value select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: .85rem;
    background: #f8fafc;
    box-sizing: border-box
}

.asc-val-filled {
    color: #1e293b;
    cursor: pointer
}

.asc-val-filled:hover {
    text-decoration: underline
}

.asc-val-empty {
    color: #94a3b8;
    font-style: italic;
    cursor: pointer
}

.asc-field-status {
    width: 24px;
    text-align: center;
    flex-shrink: 0
}

.asc-dash {
    color: #cbd5e1
}

.asc-photo-thumbs {
    display: flex;
    gap: 4px
}

.asc-photo-thumbs img {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid #e2e8f0
}

.asc-actions {
    display: flex;
    gap: 10px
}

.asc-btn-cancel {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    font-size: .9rem;
    font-weight: 600;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    cursor: pointer
}

.asc-btn-cancel:hover {
    background: #f3f4f6
}

.asc-btn-review {
    flex: 2;
    padding: 12px;
    border-radius: 10px;
    font-size: .9rem;
    font-weight: 700;
    border: none;
    background: #1d4f91;
    color: #fff;
    cursor: pointer
}

.asc-btn-review:hover:not(:disabled) {
    opacity: .9
}

.asc-btn-review:disabled {
    opacity: .5;
    cursor: not-allowed;
    background: #94a3b8
}

@media(max-width: 768px) {
    .asc-body {
        flex-direction:column;
        padding: 8px
    }

    .asc-chat {
        flex: 1;
        min-height: 300px
    }

    .asc-fields {
        flex: none
    }
}

@media(max-width: 480px) {
    .asc-header {
        padding:10px 12px
    }

    .asc-body {
        padding: 0;
        gap: 0
    }

    .asc-chat {
        border-radius: 0;
        border-left: none;
        border-right: none
    }

    .asc-fields {
        padding: 12px
    }

    .asc-msg {
        max-width: 90%
    }

    .asc-input-bar input[type=text] {
        font-size: 1rem;
        min-height: 44px
    }

    .asc-attach,.asc-send {
        width: 44px;
        height: 44px
    }
}

*,*:before,*:after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

ul,ol {
    list-style: none
}

html {
    -moz-text-size-adjust: none;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    -moz-tab-size: 4;
    tab-size: 4
}

body {
    min-height: 100vh;
    line-height: 1.5;
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    font-size: 14px
}

h1,h2,h3,h4,h5,h6 {
    font-size: inherit;
    font-weight: inherit;
    overflow-wrap: break-word
}

p {
    overflow-wrap: break-word
}

a {
    color: inherit;
    text-decoration: none
}

a:not([class]) {
    text-decoration-skip-ink: auto
}

img,picture,video,canvas,svg {
    display: block;
    max-width: 100%
}

input,button,textarea,select {
    font: inherit;
    color: inherit
}

button {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    touch-action: manipulation
}

a,input,select,textarea {
    touch-action: manipulation
}

textarea {
    resize: vertical
}

fieldset {
    border: none
}

table {
    border-collapse: collapse;
    border-spacing: 0
}

summary {
    cursor: pointer
}

@media(prefers-reduced-motion:reduce) {
    *,*:before,*:after {
        animation-duration: .01ms!important;
        animation-iteration-count: 1!important;
        transition-duration: .01ms!important;
        scroll-behavior: auto!important
    }
}

:focus:not(:focus-visible) {
    outline: none
}

:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring)
}

[data-theme=dark] ::selection {
    background: #0ea5e94d;
    color: #e2e8f0
}

[data-theme=light] ::selection {
    background: #0284c733;
    color: #111827
}

[hidden] {
    display: none!important
}

[data-theme=dark] {
    --bg: #0b1120;
    --surface: #111827;
    --card: #16202f;
    --card2: #1c2b3a;
    --surface2: #16202f;
    --card-head-bg: rgba(255, 255, 255, .02);
    --border: rgba(255, 255, 255, .07);
    --border-hi: rgba(255, 255, 255, .13);
    --accent: #0ea5e9;
    --accent-hover: #0284c7;
    --accent-dim: rgba(14, 165, 233, .12);
    --accent-text: #000;
    --hover-subtle: rgba(255, 255, 255, .04);
    --blue: #3b82f6;
    --blue-hover: #2563eb;
    --blue-dim: rgba(59, 130, 246, .12);
    --blue-mid: rgba(59, 130, 246, .18);
    --green: #10b981;
    --green-dim: rgba(16, 185, 129, .12);
    --red: #ef4444;
    --red-dim: rgba(239, 68, 68, .1);
    --amber: #f59e0b;
    --amber-dim: rgba(245, 158, 11, .12);
    --purple: #8b5cf6;
    --purple-dim: rgba(139, 92, 246, .12);
    --cyan: #06b6d4;
    --cyan-dim: rgba(6, 182, 212, .12);
    --gray: #6b7280;
    --gray-dim: rgba(107, 114, 128, .12);
    --text: #e2e8f0;
    --text2: #cbd5e1;
    --muted: #64748b;
    --muted2: #94a3b8;
    --sidebar-w: 220px;
    --topbar-h: 60px;
    --radius-sm: 6px;
    --radius: 10px;
    --radius-lg: 14px;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, .3);
    --shadow: 0 2px 8px rgba(0, 0, 0, .4);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, .5);
    --overlay: rgba(0, 0, 0, .6);
    --hover: rgba(255, 255, 255, .03);
    --hover-hi: rgba(255, 255, 255, .06);
    --font-body: "DM Sans", system-ui, -apple-system, sans-serif;
    --font-mono: "DM Mono", ui-monospace, "Cascadia Code", "Fira Code", monospace;
    --font-display: "Syne", "DM Sans", system-ui, sans-serif;
    --scrollbar-w: 4px;
    --scrollbar-track: transparent;
    --scrollbar-thumb: var(--border);
    --focus-ring: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
    --transition-fast: .13s ease;
    --transition: .2s ease;
    --transition-slow: .35s ease;
    color-scheme: dark
}

[data-theme=light] {
    --bg: #F4F6F9;
    --surface: #FFFFFF;
    --surface2: #F9FAFB;
    --card: #FFFFFF;
    --card2: #F9FAFB;
    --card-head-bg: #F9FAFB;
    --border: #E5E8ED;
    --border-hi: #CBD2DA;
    --accent: #0284c7;
    --accent-hover: #0369a1;
    --accent-dim: rgba(2, 132, 199, .08);
    --accent-text: #fff;
    --hover-subtle: rgba(0, 0, 0, .03);
    --blue: #1B5EF7;
    --blue-hover: #1449CC;
    --blue-dim: rgba(27, 94, 247, .08);
    --blue-mid: rgba(27, 94, 247, .14);
    --green: #12A05C;
    --green-dim: rgba(18, 160, 92, .1);
    --red: #E03940;
    --red-dim: rgba(224, 57, 64, .08);
    --amber: #D97706;
    --amber-dim: rgba(217, 119, 6, .09);
    --purple: #6D3FD1;
    --purple-dim: rgba(109, 63, 209, .09);
    --cyan: #0891b2;
    --cyan-dim: rgba(8, 145, 178, .09);
    --gray: #6b7280;
    --gray-dim: rgba(107, 114, 128, .09);
    --text: #111827;
    --text2: #374151;
    --muted: #6B7280;
    --muted2: #9CA3AF;
    --sidebar-w: 232px;
    --topbar-h: 56px;
    --radius-sm: 6px;
    --radius: 10px;
    --radius-lg: 14px;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, .04);
    --shadow: 0 1px 3px rgba(0, 0, 0, .05);
    --shadow-lg: 0 4px 16px rgba(0, 0, 0, .08);
    --overlay: rgba(0, 0, 0, .3);
    --hover: rgba(0, 0, 0, .02);
    --hover-hi: rgba(0, 0, 0, .05);
    --font-body: "Inter", system-ui, -apple-system, sans-serif;
    --font-mono: "DM Mono", ui-monospace, "Cascadia Code", "Fira Code", monospace;
    --font-display: "Inter", system-ui, sans-serif;
    --scrollbar-w: 5px;
    --scrollbar-track: transparent;
    --scrollbar-thumb: var(--border-hi);
    --focus-ring: 0 0 0 2px var(--surface), 0 0 0 4px var(--accent);
    --transition-fast: .13s ease;
    --transition: .2s ease;
    --transition-slow: .35s ease;
    color-scheme: light
}

:root:not([data-theme]) {
    --bg: #0b1120;
    --surface: #111827;
    --card: #16202f;
    --card2: #1c2b3a;
    --surface2: #16202f;
    --card-head-bg: rgba(255, 255, 255, .02);
    --border: rgba(255, 255, 255, .07);
    --border-hi: rgba(255, 255, 255, .13);
    --accent: #0ea5e9;
    --accent-hover: #0284c7;
    --accent-dim: rgba(14, 165, 233, .12);
    --accent-text: #000;
    --hover-subtle: rgba(255, 255, 255, .04);
    --blue: #3b82f6;
    --blue-hover: #2563eb;
    --blue-dim: rgba(59, 130, 246, .12);
    --blue-mid: rgba(59, 130, 246, .18);
    --green: #10b981;
    --green-dim: rgba(16, 185, 129, .12);
    --red: #ef4444;
    --red-dim: rgba(239, 68, 68, .1);
    --amber: #f59e0b;
    --amber-dim: rgba(245, 158, 11, .12);
    --purple: #8b5cf6;
    --purple-dim: rgba(139, 92, 246, .12);
    --cyan: #06b6d4;
    --cyan-dim: rgba(6, 182, 212, .12);
    --gray: #6b7280;
    --gray-dim: rgba(107, 114, 128, .12);
    --text: #e2e8f0;
    --text2: #cbd5e1;
    --muted: #64748b;
    --muted2: #94a3b8;
    --sidebar-w: 220px;
    --topbar-h: 60px;
    --radius-sm: 6px;
    --radius: 10px;
    --radius-lg: 14px;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, .3);
    --shadow: 0 2px 8px rgba(0, 0, 0, .4);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, .5);
    --overlay: rgba(0, 0, 0, .6);
    --hover: rgba(255, 255, 255, .03);
    --hover-hi: rgba(255, 255, 255, .06);
    --font-body: "DM Sans", system-ui, -apple-system, sans-serif;
    --font-mono: "DM Mono", ui-monospace, "Cascadia Code", "Fira Code", monospace;
    --font-display: "Syne", "DM Sans", system-ui, sans-serif;
    --scrollbar-w: 4px;
    --scrollbar-track: transparent;
    --scrollbar-thumb: rgba(255, 255, 255, .07);
    --focus-ring: 0 0 0 2px #0b1120, 0 0 0 4px #0ea5e9;
    --transition-fast: .13s ease;
    --transition: .2s ease;
    --transition-slow: .35s ease;
    color-scheme: dark
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all .15s;
    font-family: var(--font-body);
    white-space: nowrap
}

.btn svg {
    flex-shrink: 0
}

.btn-primary {
    background: var(--accent);
    color: var(--accent-text)
}

.btn-primary:hover {
    background: var(--accent-hover);
    transform: translateY(-1px)
}

.btn-secondary {
    background: var(--blue);
    color: #fff
}

.btn-secondary:hover {
    opacity: .9;
    transform: translateY(-1px)
}

.btn-ghost {
    background: transparent;
    color: var(--muted2);
    border: 1px solid var(--border)
}

.btn-ghost:hover {
    color: var(--text);
    background: var(--hover-subtle);
    border-color: var(--border-hi)
}

.btn-danger {
    background: var(--red-dim);
    color: var(--red);
    border: 1px solid var(--red)
}

.btn-danger:hover {
    background: var(--red);
    color: #fff
}

.btn-outline {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border)
}

.btn-outline:hover {
    background: var(--hover-subtle);
    border-color: var(--accent);
    color: var(--accent)
}

.btn-icon {
    padding: 6px;
    min-width: 28px;
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px
}

.btn:disabled {
    opacity: .5;
    cursor: not-allowed;
    transform: none
}

.form-group {
    margin-bottom: 16px
}

.form-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted2);
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 6px
}

.form-group input,.form-group select,.form-group textarea {
    width: 100%;
    padding: 10px 14px;
    background: var(--card2);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 14px;
    font-family: var(--font-body);
    transition: all .15s
}

.form-group input:focus,.form-group select:focus,.form-group textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim)
}

.form-group input::placeholder,.form-group textarea::placeholder {
    color: var(--muted)
}

.form-group textarea {
    min-height: 80px;
    resize: vertical
}

.form-group select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
    cursor: pointer
}

.form-row {
    display: flex;
    gap: 12px
}

.form-row .form-group {
    flex: 1;
    min-width: 0
}

body {
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.5;
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale
}

h1,.h1 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -.02em;
    color: var(--text)
}

h2,.h2 {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -.015em;
    color: var(--text)
}

h3,.h3 {
    font-family: var(--font-body);
    font-size: 17px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -.01em;
    color: var(--text)
}

h4,.h4 {
    font-family: var(--font-body);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.35;
    color: var(--text)
}

h5,.h5 {
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--text)
}

h6,.h6 {
    font-family: var(--font-body);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--muted)
}

p {
    margin-bottom: .75em;
    line-height: 1.6
}

p:last-child {
    margin-bottom: 0
}

small,.text-sm {
    font-size: 12px;
    line-height: 1.5
}

.text-xs {
    font-size: 11px;
    line-height: 1.4
}

.caption {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5
}

.section-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--muted);
    letter-spacing: .12em;
    text-transform: uppercase;
    line-height: 1.4
}

code,kbd,samp,pre,.mono {
    font-family: var(--font-mono)
}

code {
    font-size: .9em;
    padding: .15em .4em;
    background: var(--hover-hi);
    border-radius: var(--radius-sm)
}

pre {
    font-size: 13px;
    line-height: 1.6;
    padding: 16px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow-x: auto
}

pre code {
    padding: 0;
    background: none;
    border-radius: 0
}

kbd {
    font-size: .85em;
    padding: .1em .4em;
    background: var(--card2);
    border: 1px solid var(--border-hi);
    border-radius: 4px;
    box-shadow: 0 1px 0 var(--border-hi)
}

.badge-text {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .02em
}

.link {
    color: var(--accent);
    text-decoration: none;
    transition: color var(--transition-fast)
}

.link:hover {
    text-decoration: underline
}

.text-display {
    font-family: var(--font-display);
    font-weight: 800;
    letter-spacing: .04em
}

.text-primary {
    color: var(--text)
}

.text-secondary {
    color: var(--text2)
}

.text-muted {
    color: var(--muted)
}

.text-muted2 {
    color: var(--muted2)
}

.text-accent {
    color: var(--accent)
}

.text-blue {
    color: var(--blue)
}

.text-green {
    color: var(--green)
}

.text-red {
    color: var(--red)
}

.text-amber {
    color: var(--amber)
}

.text-purple {
    color: var(--purple)
}

.text-cyan {
    color: var(--cyan)
}

.font-light {
    font-weight: 300
}

.font-normal {
    font-weight: 400
}

.font-medium {
    font-weight: 500
}

.font-semibold {
    font-weight: 600
}

.font-bold {
    font-weight: 700
}

.font-extrabold {
    font-weight: 800
}

.tabular-nums {
    font-variant-numeric: tabular-nums
}

.block {
    display: block
}

.inline-block {
    display: inline-block
}

.inline {
    display: inline
}

.hidden {
    display: none
}

.contents {
    display: contents
}

.flex {
    display: flex
}

.inline-flex {
    display: inline-flex
}

.flex-row {
    flex-direction: row
}

.flex-col {
    flex-direction: column
}

.flex-wrap {
    flex-wrap: wrap
}

.flex-nowrap {
    flex-wrap: nowrap
}

.flex-1 {
    flex: 1 1 0%
}

.flex-auto {
    flex: 1 1 auto
}

.flex-none {
    flex: none
}

.flex-shrink-0 {
    flex-shrink: 0
}

.flex-grow {
    flex-grow: 1
}

.items-start {
    align-items: flex-start
}

.items-center {
    align-items: center
}

.items-end {
    align-items: flex-end
}

.items-stretch {
    align-items: stretch
}

.items-baseline {
    align-items: baseline
}

.justify-start {
    justify-content: flex-start
}

.justify-center {
    justify-content: center
}

.justify-end {
    justify-content: flex-end
}

.justify-between {
    justify-content: space-between
}

.justify-around {
    justify-content: space-around
}

.justify-evenly {
    justify-content: space-evenly
}

.self-start {
    align-self: flex-start
}

.self-center {
    align-self: center
}

.self-end {
    align-self: flex-end
}

.grid {
    display: grid
}

.grid-cols-1 {
    grid-template-columns: repeat(1,1fr)
}

.grid-cols-2 {
    grid-template-columns: repeat(2,1fr)
}

.grid-cols-3 {
    grid-template-columns: repeat(3,1fr)
}

.grid-cols-4 {
    grid-template-columns: repeat(4,1fr)
}

.col-span-2 {
    grid-column: span 2
}

.col-span-3 {
    grid-column: span 3
}

.col-span-full {
    grid-column: 1 / -1
}

.gap-0 {
    gap: 0
}

.gap-1 {
    gap: 4px
}

.gap-2 {
    gap: 8px
}

.gap-3 {
    gap: 12px
}

.gap-4 {
    gap: 16px
}

.gap-5 {
    gap: 20px
}

.gap-6 {
    gap: 24px
}

.gap-8 {
    gap: 32px
}

.gap-10 {
    gap: 40px
}

.p-0 {
    padding: 0
}

.p-1 {
    padding: 4px
}

.p-2 {
    padding: 8px
}

.p-3 {
    padding: 12px
}

.p-4 {
    padding: 16px
}

.p-5 {
    padding: 20px
}

.p-6 {
    padding: 24px
}

.p-8 {
    padding: 32px
}

.px-2 {
    padding-left: 8px;
    padding-right: 8px
}

.px-3 {
    padding-left: 12px;
    padding-right: 12px
}

.px-4 {
    padding-left: 16px;
    padding-right: 16px
}

.px-6 {
    padding-left: 24px;
    padding-right: 24px
}

.py-1 {
    padding-top: 4px;
    padding-bottom: 4px
}

.py-2 {
    padding-top: 8px;
    padding-bottom: 8px
}

.py-3 {
    padding-top: 12px;
    padding-bottom: 12px
}

.py-4 {
    padding-top: 16px;
    padding-bottom: 16px
}

.m-0 {
    margin: 0
}

.m-auto {
    margin: auto
}

.mt-1 {
    margin-top: 4px
}

.mt-2 {
    margin-top: 8px
}

.mt-3 {
    margin-top: 12px
}

.mt-4 {
    margin-top: 16px
}

.mt-6 {
    margin-top: 24px
}

.mt-8 {
    margin-top: 32px
}

.mb-1 {
    margin-bottom: 4px
}

.mb-2 {
    margin-bottom: 8px
}

.mb-3 {
    margin-bottom: 12px
}

.mb-4 {
    margin-bottom: 16px
}

.mb-6 {
    margin-bottom: 24px
}

.ml-auto {
    margin-left: auto
}

.mr-auto {
    margin-right: auto
}

.mx-auto {
    margin-left: auto;
    margin-right: auto
}

.w-full {
    width: 100%
}

.h-full {
    height: 100%
}

.w-auto {
    width: auto
}

.min-w-0 {
    min-width: 0
}

.min-h-0 {
    min-height: 0
}

.max-w-full {
    max-width: 100%
}

.overflow-hidden {
    overflow: hidden
}

.overflow-auto {
    overflow: auto
}

.overflow-x-auto {
    overflow-x: auto
}

.overflow-y-auto {
    overflow-y: auto
}

.overflow-x-hidden {
    overflow-x: hidden
}

.relative {
    position: relative
}

.absolute {
    position: absolute
}

.fixed {
    position: fixed
}

.sticky {
    position: sticky
}

.inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0
}

.z-0 {
    z-index: 0
}

.z-10 {
    z-index: 10
}

.z-20 {
    z-index: 20
}

.z-50 {
    z-index: 50
}

.z-100 {
    z-index: 100
}

.z-overlay {
    z-index: 200
}

.z-modal {
    z-index: 300
}

.z-toast {
    z-index: 400
}

.text-left {
    text-align: left
}

.text-center {
    text-align: center
}

.text-right {
    text-align: right
}

.uppercase {
    text-transform: uppercase
}

.lowercase {
    text-transform: lowercase
}

.capitalize {
    text-transform: capitalize
}

.normal-case {
    text-transform: none
}

.whitespace-nowrap {
    white-space: nowrap
}

.whitespace-pre {
    white-space: pre
}

.leading-none {
    line-height: 1
}

.leading-tight {
    line-height: 1.25
}

.leading-normal {
    line-height: 1.5
}

.leading-relaxed {
    line-height: 1.625
}

.tracking-tight {
    letter-spacing: -.01em
}

.tracking-normal {
    letter-spacing: 0
}

.tracking-wide {
    letter-spacing: .05em
}

.tracking-wider {
    letter-spacing: .1em
}

.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden
}

.sr-only,.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border-width: 0
}

.border {
    border: 1px solid var(--border)
}

.border-hi {
    border: 1px solid var(--border-hi)
}

.border-t {
    border-top: 1px solid var(--border)
}

.border-b {
    border-bottom: 1px solid var(--border)
}

.border-l {
    border-left: 1px solid var(--border)
}

.border-r {
    border-right: 1px solid var(--border)
}

.border-none {
    border: none
}

.rounded-sm {
    border-radius: var(--radius-sm)
}

.rounded {
    border-radius: var(--radius)
}

.rounded-lg {
    border-radius: var(--radius-lg)
}

.rounded-full {
    border-radius: 9999px
}

.rounded-none {
    border-radius: 0
}

.bg-transparent {
    background: transparent
}

.bg-surface {
    background: var(--surface)
}

.bg-card {
    background: var(--card)
}

.bg-card2 {
    background: var(--card2)
}

.bg-accent-dim {
    background: var(--accent-dim)
}

.bg-blue-dim {
    background: var(--blue-dim)
}

.bg-green-dim {
    background: var(--green-dim)
}

.bg-red-dim {
    background: var(--red-dim)
}

.bg-amber-dim {
    background: var(--amber-dim)
}

.bg-purple-dim {
    background: var(--purple-dim)
}

.shadow-sm {
    box-shadow: var(--shadow-sm)
}

.shadow {
    box-shadow: var(--shadow)
}

.shadow-lg {
    box-shadow: var(--shadow-lg)
}

.shadow-none {
    box-shadow: none
}

.opacity-0 {
    opacity: 0
}

.opacity-50 {
    opacity: .5
}

.opacity-70 {
    opacity: .7
}

.opacity-100 {
    opacity: 1
}

.cursor-pointer {
    cursor: pointer
}

.cursor-default {
    cursor: default
}

.cursor-not-allowed {
    cursor: not-allowed
}

.pointer-events-none {
    pointer-events: none
}

.pointer-events-auto {
    pointer-events: auto
}

.select-none {
    -webkit-user-select: none;
    user-select: none
}

.select-text {
    -webkit-user-select: text;
    user-select: text
}

.select-all {
    -webkit-user-select: all;
    user-select: all
}

.transition-fast {
    transition: all var(--transition-fast)
}

.transition {
    transition: all var(--transition)
}

.transition-slow {
    transition: all var(--transition-slow)
}

.transition-none {
    transition: none
}

@keyframes fadeUp {
    0% {
        opacity: 0;
        transform: translateY(10px)
    }

    to {
        opacity: 1;
        transform: translateY(0)
    }
}

@keyframes fadeIn {
    0% {
        opacity: 0
    }

    to {
        opacity: 1
    }
}

@keyframes fadeDown {
    0% {
        opacity: 0;
        transform: translateY(-10px)
    }

    to {
        opacity: 1;
        transform: translateY(0)
    }
}

@keyframes scaleIn {
    0% {
        opacity: 0;
        transform: scale(.95)
    }

    to {
        opacity: 1;
        transform: scale(1)
    }
}

@keyframes slideInRight {
    0% {
        opacity: 0;
        transform: translate(16px)
    }

    to {
        opacity: 1;
        transform: translate(0)
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg)
    }
}

.animate-fade-up {
    animation: fadeUp .3s ease both
}

.animate-fade-in {
    animation: fadeIn .2s ease both
}

.animate-fade-down {
    animation: fadeDown .3s ease both
}

.animate-scale-in {
    animation: scaleIn .2s ease both
}

.animate-slide-right {
    animation: slideInRight .3s ease both
}

.animate-spin {
    animation: spin 1s linear infinite
}

.delay-1 {
    animation-delay: .05s
}

.delay-2 {
    animation-delay: .1s
}

.delay-3 {
    animation-delay: .15s
}

.delay-4 {
    animation-delay: .2s
}

.delay-5 {
    animation-delay: .25s
}

.scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track)
}

.scrollbar-thin::-webkit-scrollbar {
    width: var(--scrollbar-w);
    height: var(--scrollbar-w)
}

.scrollbar-thin::-webkit-scrollbar-track {
    background: var(--scrollbar-track)
}

.scrollbar-thin::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 4px
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: var(--border-hi)
}

.scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none
}

.scrollbar-none::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none
}

.overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--overlay);
    z-index: 199;
    animation: fadeIn .2s ease both
}

.divider {
    height: 1px;
    background: var(--border);
    border: none;
    margin: 16px 0
}

.divider-sm {
    height: 1px;
    background: var(--border);
    border: none;
    margin: 8px 0
}

.loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg)
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .8s linear infinite
}

@media(max-width: 900px) {
    .hide-mobile {
        display:none!important
    }
}

@media(min-width: 901px) {
    .show-mobile-only {
        display:none!important
    }
}

@media(max-width: 480px) {
    .hide-small {
        display:none!important
    }
}
```
