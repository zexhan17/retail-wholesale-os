import re
import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Imports
    content = re.sub(r"import .* from '@cloudscape-design/components/.*';\n", "", content)
    content = re.sub(r"import .* from '@cloudscape-design/global-styles/.*';\n", "", content)

    # Replace specific components
    # Header
    content = re.sub(r"<Header[^>]*variant=\"h1\"[^>]*description=\"([^\"]*)\"[^>]*>(.*?)</Header>", r"<div className=\"mb-6\">\n  <h1 className=\"text-2xl font-bold\">\2</h1>\n  <p className=\"text-muted-foreground\">\1</p>\n</div>", content, flags=re.DOTALL)
    content = re.sub(r"<Header[^>]*variant=\"h2\"[^>]*description=\"([^\"]*)\"[^>]*>(.*?)</Header>", r"<div className=\"mb-4\">\n  <h2 className=\"text-xl font-bold\">\2</h2>\n  <p className=\"text-muted-foreground\">\1</p>\n</div>", content, flags=re.DOTALL)
    content = re.sub(r"<Header[^>]*variant=\"h[123]\"[^>]*>(.*?)</Header>", r"<h2 className=\"text-xl font-bold mb-4\">\1</h2>", content, flags=re.DOTALL)
    
    # SpaceBetween
    content = re.sub(r"<SpaceBetween[^>]*direction=\"horizontal\"[^>]*size=\"([^\"]*)\"[^>]*>", r'<div className="flex items-center gap-4">', content)
    content = re.sub(r"<SpaceBetween[^>]*direction=\"horizontal\"[^>]*>", r'<div className="flex items-center gap-4">', content)
    content = re.sub(r"<SpaceBetween[^>]*size=\"([^\"]*)\"[^>]*>", r'<div className="flex flex-col gap-4">', content)
    content = re.sub(r"<SpaceBetween[^>]*>", r'<div className="flex flex-col gap-4">', content)
    content = content.replace("</SpaceBetween>", "</div>")
    
    # Container
    content = re.sub(r"<Container[^>]*header=\{(.*?)\}[^>]*>", r'<Card className="p-4 mb-4">\n  \1\n', content, flags=re.DOTALL)
    content = re.sub(r"<Container[^>]*>", r'<Card className="p-4 mb-4">', content)
    content = content.replace("</Container>", "</Card>")

    # FormField
    content = re.sub(r"<FormField[^>]*label=\"([^\"]*)\"[^>]*>", r'<div className="flex flex-col gap-1.5">\n  <Label>\1</Label>', content)
    content = content.replace("</FormField>", "</div>")

    # Select
    # For select, it's easier to just use standard HTML select to avoid complex state mapping, or standard shadcn Select if we can.
    # Cloudscape select uses onChange={({ detail }) => ...} and selectedOption={{ label, value }}
    
    # Input
    content = re.sub(r"<Input([^>]*)onChange=\{[^>]*\(\{ detail \}\) => ([^>]*?)\}[^>]*/>", r"<Input\1onChange={(e) => \2(e.target.value)} />", content)
    
    # Button
    content = re.sub(r"<Button([^>]*)variant=\"primary\"([^>]*)>", r'<Button\1className="bg-primary text-primary-foreground hover:bg-primary/90"\2>', content)
    
    # Box
    content = re.sub(r"<Box[^>]*margin=\{\{ top: 'm' \}\}[^>]*>", r'<div className="mt-4">', content)
    content = re.sub(r"<Box[^>]*float=\"right\"[^>]*>", r'<div className="float-right">', content)
    content = re.sub(r"<Box[^>]*textAlign=\"center\"[^>]*padding=\"l\"[^>]*>", r'<div className="text-center p-8">', content)
    content = re.sub(r"<Box[^>]*>", r'<div>', content)
    content = content.replace("</Box>", "</div>")

    # SegmentedControl (approximate to Tabs or group of buttons)
    
    # Modal
    content = re.sub(r"<Modal[^>]*visible=\{([^}]+)\}[^>]*onDismiss=\{([^}]+)\}[^>]*header=\"([^\"]*)\"[^>]*footer=\{(.*?)\}[^>]*>", 
                     r'<Dialog open={\1} onOpenChange={(open) => { if (!open) \2(); }}>\n  <DialogContent>\n    <DialogHeader>\n      <DialogTitle>\3</DialogTitle>\n    </DialogHeader>\n', content, flags=re.DOTALL)
    content = re.sub(r"</Modal>", r'  </DialogContent>\n</Dialog>', content)

    # Grid
    content = re.sub(r"<Grid[^>]*gridDefinition=\{[^}]*\}[^>]*>", r'<div className="grid grid-cols-1 md:grid-cols-3 gap-4">', content)
    content = content.replace("</Grid>", "</div>")

    # Alert
    content = re.sub(r"<Alert[^>]*type=\"error\"[^>]*header=\"([^\"]*)\"[^>]*>", r'<div className="bg-destructive/15 text-destructive p-3 rounded-md border border-destructive/20">\n  <div className="font-bold">\1</div>\n', content)
    content = content.replace("</Alert>", "</div>")

    # Badge
    content = re.sub(r"<Badge[^>]*color=\"green\"[^>]*>", r'<Badge className="bg-green-100 text-green-800">', content)
    content = re.sub(r"<Badge[^>]*color=\"red\"[^>]*>", r'<Badge className="bg-red-100 text-red-800">', content)

    # Shadcn imports
    shadcn_imports = """
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
"""
    content = shadcn_imports + "\n" + content

    with open(filepath, 'w') as f:
        f.write(content)

for f in [
    'frontend/src/pages/pos/POSPage.tsx',
    'frontend/src/pages/wholesale/WholesaleBillingPage.tsx',
    'frontend/src/pages/wholesale/InvoicesListPage.tsx'
]:
    process_file(f)
