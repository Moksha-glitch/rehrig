import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Button gradients
old_btn = """  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-[15px] py-[10px] text-[13px] font-bold interactive;
    color: var(--color-on-brand);
    box-shadow: 0 1px 2px rgba(20, 24, 52, 0.2);
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-brand-hover);
  }
  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }
  .btn-primary:disabled {
    opacity: 0.5;
    transform: none;
  }

  .btn-brand {
    @apply inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-[15px] py-[10px] text-[13px] font-bold interactive;
    color: var(--color-on-brand);
    box-shadow: 0 1px 2px rgba(20, 24, 52, 0.2);
  }
  .btn-brand:hover:not(:disabled) {
    background: var(--color-brand-hover);
  }
  .btn-brand:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-[15px] py-[10px] text-[13px] font-bold text-brand interactive;
    box-shadow: var(--shadow-raise);
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--color-brand-soft);
    transform: translateY(-1px);
  }"""

new_btn = """  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-[15px] py-[10px] text-[13px] font-bold interactive;
    color: var(--color-on-brand);
    background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
    box-shadow: 0 1px 2px rgba(20,24,52,0.25), 0 4px 12px rgba(30,39,97,0.22);
  }
  .btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--color-brand-hover) 0%, #4063D8 100%);
    box-shadow: 0 4px 20px rgba(30,39,97,0.38);
    transform: translateY(-1px);
  }
  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(20,24,52,0.2);
  }
  .btn-primary:disabled {
    opacity: 0.5;
    transform: none;
  }

  .btn-brand {
    @apply inline-flex items-center justify-center gap-2 rounded-lg px-[15px] py-[10px] text-[13px] font-bold interactive;
    color: var(--color-on-brand);
    background: linear-gradient(135deg, var(--color-brand) 0%, var(--color-accent) 100%);
    box-shadow: 0 1px 2px rgba(20,24,52,0.25), 0 4px 12px rgba(30,39,97,0.22);
  }
  .btn-brand:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--color-brand-hover) 0%, #4063D8 100%);
    transform: translateY(-1px);
  }
  .btn-brand:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-[15px] py-[10px] text-[13px] font-semibold text-ink-soft interactive;
    box-shadow: 0 1px 3px rgba(20,24,52,0.06);
  }
  .btn-secondary:hover:not(:disabled) {
    border-color: var(--color-line-strong);
    background: var(--color-elevated);
    color: var(--color-ink);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30,39,97,0.1);
  }
  .btn-secondary:active:not(:disabled) {
    transform: translateY(0);
  }"""

content = content.replace(old_btn, new_btn)

# 2. surface-panel
old_sp = """  .surface-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    border-radius: 0.625rem;
    box-shadow: var(--shadow-raise);
  }"""
new_sp = """  .surface-panel {
    background: var(--color-surface);
    border: 1px solid var(--color-line);
    border-radius: 0.875rem;
    box-shadow: 0 1px 3px rgba(20,24,52,0.06), 0 6px 20px rgba(30,39,97,0.07);
  }"""
content = content.replace(old_sp, new_sp)

# 3. stat-tile accent bar
old_stat = """  .stat-tile {
    background: var(--color-surface);
    padding: 1.25rem 1.35rem;
  }"""
new_stat = """  .stat-tile {
    background: var(--color-surface);
    padding: 1.5rem 1.5rem 1.35rem;
    position: relative;
    overflow: hidden;
    border-top: 3px solid transparent;
    border-image: linear-gradient(90deg, var(--color-brand), var(--color-accent)) 1;
    border-image-slice: 1;
  }"""
content = content.replace(old_stat, new_stat)

# 4. field-input focus accent
old_fi = """  .field-input:focus {
    border-color: var(--color-ink);
    box-shadow: var(--shadow-focus);
    outline: none;
    background: var(--color-surface);
  }"""
new_fi = """  .field-input:focus {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-accent-soft);
    outline: none;
    background: var(--color-surface);
  }"""
content = content.replace(old_fi, new_fi)

# 5. app-shell gradient
old_shell = """  .app-shell {
    background: var(--color-canvas);
  }

  [data-theme='dark'] .app-shell {
    background: var(--color-canvas);
  }"""
new_shell = """  .app-shell {
    background: linear-gradient(160deg, #EBF0FD 0%, #F5F7FC 40%, #EDF1FB 100%);
  }

  [data-theme='dark'] .app-shell {
    background: linear-gradient(160deg, #080C17 0%, #0B0F1C 50%, #090D17 100%);
  }"""
content = content.replace(old_shell, new_shell)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done — CSS updated')
