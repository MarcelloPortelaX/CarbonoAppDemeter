import sys
with open('run_log.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'FAILURES' in line or 'FAILED' in line or 'ERROR' in line:
        print(line.strip())
        for j in range(i+1, min(i+15, len(lines))):
            print(lines[j].strip())
        print("----")
