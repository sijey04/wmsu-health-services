with open('api/views.py', 'r') as f:
    lines = f.readlines()

# Find line 1938 and show context
for i in range(1935, 1945):
    if i < len(lines):
        print(f"Line {i+1}: {lines[i].rstrip()}")
        if 'try:' in lines[i]:
            print(f"  ^^^ TRY BLOCK FOUND AT LINE {i+1}")
