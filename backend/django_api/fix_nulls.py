#!/usr/bin/env python3

# Fix null bytes in views.py file
with open('api/views.py', 'rb') as f:
    content = f.read()

# Remove null bytes
clean_content = content.replace(b'\x00', b'')

with open('api/views.py', 'wb') as f:
    f.write(clean_content)

print("Null bytes removed from views.py")
