import re

def find_unclosed_try_blocks(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    try_stack = []
    for i, line in enumerate(lines):
        line_num = i + 1
        stripped = line.strip()
        
        # Check for try blocks
        if stripped.startswith('try:'):
            try_stack.append(line_num)
        
        # Check for except/finally blocks
        elif stripped.startswith('except') or stripped.startswith('finally'):
            if try_stack:
                try_stack.pop()
        
        # Check for function definitions that might interrupt try blocks
        elif stripped.startswith('def ') and try_stack:
            print(f"Unclosed try block from line {try_stack[-1]} interrupted by function at line {line_num}")
            print(f"Line {line_num}: {stripped}")
    
    if try_stack:
        print(f"Unclosed try blocks at lines: {try_stack}")

find_unclosed_try_blocks('api/views.py')
