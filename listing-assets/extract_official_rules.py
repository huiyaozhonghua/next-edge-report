import re, html, sys

s = open('devportal.js', encoding='utf-8', errors='ignore').read()

def rule_body(n):
    """定位 'N. Title' 规则节点，取其后 4000 字符内的可见文本。"""
    pat = re.compile(r'\"' + str(n) + r'\.\s+[A-Za-z][^\"]{3,80}\"')
    m = pat.search(s)
    if not m:
        return None
    seg = s[m.start(): m.start() + 5000]
    # 收集 JSX children 里的字符串字面量
    parts = re.findall(r'\"((?:[^\"\\\\]|\\\\.){12,600})\"', seg)
    out = []
    for p in parts:
        p = p.replace('\\\\"', '"').replace('\\\\n', ' ').replace('\\\\u2019', "'")
        p = html.unescape(p)
        if not re.search(r'[A-Za-z]{4,}', p):
            continue
        if re.match(r'^[a-zA-Z_$][\w$]*$', p):      # 变量名
            continue
        if p in out:
            continue
        out.append(p)
    return out

targets = [int(x) for x in sys.argv[1:]] or [3, 5, 9, 10, 11, 17]
for n in targets:
    parts = rule_body(n)
    print('═' * 4, f'规则 {n}', '═' * 4)
    if parts:
        for p in parts[:7]:
            print('  •', p[:420])
    else:
        print('  (未提取到)')
    print()
