import os
import glob
import re

html_files = glob.glob('c:/Users/rauni/Downloads/CricPredic/frontend/*.html')

colors_replacement = '''"colors": {
                        "error-container": "var(--error-container)", "tertiary": "var(--tertiary)", "on-surface": "var(--on-surface)",
                        "primary-fixed-dim": "var(--primary-fixed-dim)", "primary": "var(--primary)", "on-surface-variant": "var(--on-surface-variant)",
                        "error": "var(--error)", "secondary-container": "var(--secondary-container)", "on-primary-fixed-variant": "var(--on-primary-fixed-variant)",
                        "inverse-primary": "var(--inverse-primary)", "surface-container-high": "var(--surface-container-high)", "background": "var(--background)",
                        "on-background": "var(--on-background)", "surface-dim": "var(--surface-dim)", "surface-container": "var(--surface-container)",
                        "inverse-on-surface": "var(--inverse-on-surface)", "surface-tint": "var(--surface-tint)", "surface-container-low": "var(--surface-container-low)",
                        "on-primary": "var(--on-primary)", "primary-fixed": "var(--primary-fixed)", "on-error": "var(--on-error)",
                        "on-secondary": "var(--on-secondary)", "on-tertiary-fixed-variant": "var(--on-tertiary-fixed-variant)",
                        "tertiary-fixed-dim": "var(--tertiary-fixed-dim)", "surface-container-highest": "var(--surface-container-highest)",
                        "outline": "var(--outline)", "on-tertiary": "var(--on-tertiary)", "tertiary-fixed": "var(--tertiary-fixed)",
                        "on-tertiary-fixed": "var(--on-tertiary-fixed)", "surface": "var(--surface)", "secondary": "var(--secondary)",
                        "tertiary-container": "var(--tertiary-container)", "on-error-container": "var(--on-error-container)",
                        "on-secondary-fixed-variant": "var(--on-secondary-fixed-variant)", "secondary-fixed": "var(--secondary-fixed)",
                        "secondary-fixed-dim": "var(--secondary-fixed-dim)", "inverse-surface": "var(--inverse-surface)",
                        "on-secondary-container": "var(--on-secondary-container)", "surface-container-lowest": "var(--surface-container-lowest)",
                        "on-tertiary-container": "var(--on-tertiary-container)", "on-secondary-fixed": "var(--on-secondary-fixed)",
                        "surface-bright": "var(--surface-bright)", "surface-variant": "var(--surface-variant)",
                        "primary-container": "var(--primary-container)", "outline-variant": "var(--outline-variant)",
                        "on-primary-fixed": "var(--on-primary-fixed)", "on-primary-container": "var(--on-primary-container)"
                    },'''

theme_btn = '<button class="theme-toggle p-2 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer" aria-label="Toggle theme"><span class="material-symbols-outlined">light_mode</span></button>'

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace tailwind colors
    content = re.sub(r'"colors":\s*\{[^}]+\},', colors_replacement, content, flags=re.DOTALL)
    
    # 2. Insert script tag before </head> if not exists
    if 'theme-system.js' not in content:
        content = content.replace('</head>', '    <script src="./js/theme-system.js"></script>\n</head>')
        
    # 3. Add theme toggle button before notifications
    if 'theme-toggle' not in content:
        # Some headers have "flex items-center gap-4 text-cyan-400", some just "gap-4". 
        # The easiest way is to target the notifications button and prepend the theme button.
        content = content.replace(
            '<button class="p-2 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"><span class="material-symbols-outlined">notifications</span></button>',
            theme_btn + '\n        <button class="p-2 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"><span class="material-symbols-outlined">notifications</span></button>'
        )
        content = content.replace(
            '<button class="p-2 hover:text-cyan-300 transition-colors cursor-pointer"><span class="material-symbols-outlined">notifications</span></button>',
            theme_btn + '\n        <button class="p-2 hover:text-cyan-300 transition-colors cursor-pointer"><span class="material-symbols-outlined">notifications</span></button>'
        )
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {os.path.basename(file)}')
