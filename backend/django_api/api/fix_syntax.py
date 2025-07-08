import re

# Read the file
with open('api/views.py', 'r') as f:
    content = f.read()

lines = content.split('\n')

# Find the problematic try block
for i, line in enumerate(lines):
    if 'try:' in line and i > 1900:  # Looking around the problematic area
        print(f"Line {i+1}: {line.strip()}")
        # Check if there's a corresponding except/finally
        j = i + 1
        found_except = False
        while j < len(lines) and j < i + 20:
            next_line = lines[j].strip()
            if next_line.startswith('except') or next_line.startswith('finally'):
                found_except = True
                break
            elif next_line.startswith('def ') and not found_except:
                print(f"  Missing except/finally! Next function at line {j+1}: {next_line}")
                # Insert the missing except block
                missing_except = [
                    "        except Exception as e:",
                    "            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)"
                ]
                lines[j:j] = missing_except
                print(f"  Added missing except block before line {j+1}")
                break
            j += 1

# Write the fixed content back
with open('api/views.py', 'w') as f:
    f.write('\n'.join(lines))
