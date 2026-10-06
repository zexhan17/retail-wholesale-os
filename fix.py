import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix escaped quotes in className
    content = content.replace(r'\"', '"')
    
    with open(filepath, 'w') as f:
        f.write(content)

for f in [
    'frontend/src/pages/pos/POSPage.tsx',
    'frontend/src/pages/wholesale/WholesaleBillingPage.tsx',
    'frontend/src/pages/wholesale/InvoicesListPage.tsx'
]:
    fix_file(f)
