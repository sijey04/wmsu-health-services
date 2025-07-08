with open('api/views.py', 'r') as f:
    content = f.read()

lines = content.split('\n')

# Look for try blocks around line 1938
for i in range(1930, 1950):
    if i < len(lines):
        line = lines[i]
        if 'try:' in line:
            print(f"Found try at line {i+1}: {line.strip()}")
            # Look for the corresponding except/finally
            j = i + 1
            found_except = False
            while j < len(lines) and j < i + 20:  # Look ahead 20 lines
                next_line = lines[j].strip()
                if next_line.startswith('except') or next_line.startswith('finally'):
                    print(f"  Found except/finally at line {j+1}: {next_line}")
                    found_except = True
                    break
                elif next_line.startswith('def ') or next_line.startswith('class '):
                    print(f"  Function/class definition at line {j+1} without except/finally: {next_line}")
                    break
                j += 1
            if not found_except:
                print(f"  ERROR: No except/finally found for try at line {i+1}")
