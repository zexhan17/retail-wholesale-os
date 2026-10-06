import re

with open('frontend/src/pages/pos/POSPage.tsx', 'r') as f:
    content = f.read()

# Remove cloudscape imports
content = re.sub(r"import .* from '@cloudscape-design/components/.*?';\n", "", content)

# Add Shadcn imports
shadcn_imports = """
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card } from '../../components/ui/card';
"""
content = content.replace("import { Product } from '../../types/product';", "import { Product } from '../../types/product';\n" + shadcn_imports)

# Replace SpaceBetween
content = re.sub(r'<SpaceBetween size="[a-z]+"(?: direction="horizontal")?>', r'<div className="flex flex-wrap gap-4">', content)
content = re.sub(r'<SpaceBetween direction="horizontal" size="[a-z]+">', r'<div className="flex gap-2">', content)
content = re.sub(r'</SpaceBetween>', r'</div>', content)

# Replace Box
content = re.sub(r'<Box textAlign="center"[^>]*>', r'<div className="text-center p-4">', content)
content = re.sub(r'<Box float="right">', r'<div className="flex justify-end mt-4">', content)
content = re.sub(r'</Box>', r'</div>', content)

# Replace Input onChange
content = re.sub(r'onChange=\{[(]\{ detail \}[)] => (.*?)\(detail\.value\)\}', r'onChange={(e) => \1(e.target.value)}', content)
# Input onKeyDown
content = re.sub(r'onKeyDown=\{[(]e[)] => \{\n\s*if \(e\.detail\.key ===', r'onKeyDown={(e) => {\n                    if (e.key ===', content)

# Replace Button
content = re.sub(r'<Button variant="primary"([^>]*)>', r'<Button variant="default"\1>', content)
content = re.sub(r'<Button variant="icon" iconName="remove"([^>]*)/>', r'<Button variant="ghost" size="icon"\1><Trash2 className="h-4 w-4"/></Button>', content)
content = re.sub(r'iconName="calendar"', '', content)
content = re.sub(r'iconName="remove"', '', content)
content = re.sub(r'iconName="file"', '', content)
content = re.sub(r'iconName="arrow-left"', '', content)
content = re.sub(r'iconName="check"', '', content)

# Replace Badge
content = re.sub(r'<Badge color="green">', r'<Badge variant="outline" className="bg-green-100 text-green-800">', content)
content = re.sub(r'<Badge color="red">', r'<Badge variant="destructive">', content)
content = re.sub(r'<Badge color=\{[^}]+\}>', r'<Badge variant={drawerSession.isOpen ? "outline" : "destructive"} className={drawerSession.isOpen ? "bg-green-100 text-green-800" : ""}>', content)

# Modals
# Modal 1: Payment Tender
content = content.replace('''<Modal
        visible={isPaymentModalOpen}
        onDismiss={() => setIsPaymentModalOpen(false)}
        header={`Payment Tender: ${formatMoney(totals.grandTotal, profile.currencySymbol)}`}
        footer={
          <div className="flex justify-end mt-4">
            <div className="flex gap-2">
              <Button onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button variant="default" onClick={handleCompleteSale} >
                Complete Sale & Print Receipt
              </Button>
            </div>
          </div>
        }
      >''', '''<Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{`Payment Tender: ${formatMoney(totals.grandTotal, profile.currencySymbol)}`}</DialogTitle>
          </DialogHeader>''')
content = content.replace('''</Modal>''', '''<DialogFooter>
            <div className="flex justify-end mt-4 gap-2">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button variant="default" onClick={handleCompleteSale}>Complete Sale & Print Receipt</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>''', 1)

# Modal 2: Held Bills Modal
content = content.replace('''<Modal
        visible={isHeldModalOpen}
        onDismiss={() => setIsHeldModalOpen(false)}
        header={`Held Bills (${heldCarts.length})`}
        footer={
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsHeldModalOpen(false)}>Close</Button>
          </div>
        }
      >''', '''<Dialog open={isHeldModalOpen} onOpenChange={setIsHeldModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{`Held Bills (${heldCarts.length})`}</DialogTitle>
          </DialogHeader>''')
content = content.replace('''</Modal>''', '''<DialogFooter>
            <Button variant="outline" onClick={() => setIsHeldModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>''', 1)

# Modal 3: Thermal Receipt Modal
content = content.replace('''<Modal
        visible={!!completedInvoice}
        onDismiss={() => setCompletedInvoice(null)}
        header="Sale Complete - Receipt"
        footer={
          <div className="flex justify-end mt-4">
            <Button onClick={() => setCompletedInvoice(null)}>Close</Button>
          </div>
        }
      >''', '''<Dialog open={!!completedInvoice} onOpenChange={(o) => !o && setCompletedInvoice(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sale Complete - Receipt</DialogTitle>
          </DialogHeader>''')
content = content.replace('''</Modal>''', '''<DialogFooter>
            <Button variant="outline" onClick={() => setCompletedInvoice(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>''', 1)

# SegmentedControl -> Tabs
content = re.sub(r'<SegmentedControl\s*selectedId=\{paymentMethod\}\s*onChange=\{[(]\{ detail \}[)] => setPaymentMethod\(detail.selectedId as any\)\}\s*options=\{\[\s*\{ id: \'cash\', text: \'💵 Cash\' \},\s*\{ id: \'card\', text: \'💳 Card\' \},\s*\{ id: \'upi\', text: \'📱 Digital UPI / QR\' \},\s*\]\}\s*/>',
r'''<Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="cash">💵 Cash</TabsTrigger>
    <TabsTrigger value="card">💳 Card</TabsTrigger>
    <TabsTrigger value="upi">📱 Digital UPI / QR</TabsTrigger>
  </TabsList>
</Tabs>''', content)

# FormField -> Label + div
content = re.sub(r'<FormField label="([^"]+)">', r'<div className="flex flex-col gap-2 mt-4">\n<Label>\1</Label>', content)
content = re.sub(r'</FormField>', r'</div>', content)

# Custom select replacement
select_regex = r'''<Select\s*selectedOption=\{[^}]+\}\s*onChange=\{[^}]+\}\s*options=\{[^}]+\}\s*filteringType="auto"\s*filteringPlaceholder="[^"]+"\s*placeholder="([^"]+)"\s*empty="[^"]+"\s*/>'''
def replace_select(m):
    return '''<select
              value={customer ? customer.id : 'cust-walkin'}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setCustomer(found || null);
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="cust-walkin">Walk-in Cash Customer</option>
              {customers.filter((c) => c.id !== 'cust-walkin').map((c) => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>'''

content = re.sub(r'<Select.*?/>', replace_select, content, flags=re.DOTALL)


with open('frontend/src/pages/pos/POSPage.tsx', 'w') as f:
    f.write(content)
