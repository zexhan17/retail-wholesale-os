# OmniStore OS (Retail & Wholesale Business Operating System)

An enterprise-grade, dual-mode web application designed for **Retail POS** (fast counter sales, barcode scanning, instant 80mm thermal receipts) and **Wholesale B2B Billing** (bulk tiered price slabs, master carton packaging multipliers, credit ledger/Khata, official A4 tax invoices, purchase orders, and inventory management), built with AWS's **Cloudscape Design System**, **React 18**, **TypeScript**, and **Vite**.

---

## 🌟 Key Features

### 1. ⚡ Retail Quick POS Counter (`/pos`)
* **Barcode Scanning**: Keyboard wedge support auto-adds scanned SKUs instantly on Enter.
* **Touch-Friendly Product Grid**: Category filters, stock counters, retail unit pricing, and packaging multiplier tags.
* **Cart Management**: Real-time quantity steppers, piece vs packaging toggle, line-item discounts.
* **Park / Hold Bills**: Park ongoing transactions with timestamps and customer labels to serve waiting queues; recall or discard anytime.
* **Tender Modal**: Quick cash presets (\$10, \$20, \$50, \$100, Exact) with real-time change-due calculator, card terminal slip tracking, and digital UPI QR display.
* **Printable 80mm Thermal Receipt**: Dedicated `@media print` layout with barcode simulation, line items, tax breakdown, and customizable store footer.

### 2. 📦 Wholesale B2B Billing & Invoicing (`/wholesale/billing`)
* **B2B Buyer Accounts**: Select corporate accounts, inspect available credit limits, and receive real-time credit-exceeded warnings.
* **Dual Unit of Measure (UoM)**: Sell by primary units (Pieces/Bags) or master packaging (Cartons/Crates/Boxes) with automatic conversion ratios (e.g. 1 Carton = 24 Pieces).
* **Tiered Price Slabs**: Real-time volume pricing triggers lower rates as order volumes cross minimum thresholds.
* **Payment Settlement**: Direct debit to Khata (credit terms Net 7/15/30), full bank wire transfer, or partial advance payments.
* **Official A4 Tax Invoice**: Conforms to standard commercial accounting with HSN codes, tax breakdown (GST/VAT), bank wire information, and authorized signature.

### 3. 👥 Parties & Khata Ledger (`/customers` & `/customers/:id/ledger`)
* **Dual Directory**: Manage retail shoppers and B2B corporate accounts.
* **Customer Khata Statement**: Chronological ledger statements displaying debit (invoices billed), credit (payments collected), and running balances.
* **Payment Collection**: Record payments via bank wire, cheque, cash, or UPI; automatically clears outstanding balances and logs ledger entries.
* **Customer Editor**: Edit credit limits, payment terms, tax numbers, and contact details.

### 4. 🏷️ Product Catalog & Dual Pricing (`/products` & `/stock-adjustments`)
* **Dual Pricing Setup**: Configure cost price, standard retail price, and multi-tier wholesale quantity slabs.
* **Packaging Multipliers**: Set primary units vs packaging units.
* **Low-Stock Alerts**: Automated warning notifications in Cloudscape top navigation when inventory drops below reorder thresholds.
* **Stock Adjustments**: Audit log for damage write-offs, expired batches, shrinkage, and physical count discrepancies.

### 5. 🏭 Purchasing & Goods Inwarding (`/suppliers` & `/purchases`)
* **Vendor Directory**: Manage suppliers, payment terms, and accounts payable balances.
* **Purchase Orders**: Create POs for replenishment.
* **Goods Receipt (Inwarding)**: Click "Receive Stock" on ordered POs to immediately replenish product inventory levels.

### 6. 💰 Day-End Cash Closing & Z-Report (`/reports/day-end`)
* Reconciles opening cash float, cash sales, card sales, and cash drops against physically counted drawer cash.
* Calculates cash variance (Over / Short).
* Generates printable official **Z-Report** shift close audit slip.

### 7. 📊 Financial & Sales Analytics (`/reports/analytics`)
* Retail POS vs Wholesale B2B channel revenue split.
* Gross profit margins (Revenue minus Cost of Goods Sold and Taxes).
* Velocity rankings (Top 5 Best Sellers and Dead Stock).
* Tax collected breakdown ready for accounting filings.

### 8. ⚙️ Settings & Database Management (`/settings`)
* Customize legal store name, tagline, address, tax number, currency symbol (\$, ₹, £, €), and bank wire credentials.
* **One-Click JSON Backup & Restore**: Export full database state to JSON and restore on any device.
* Factory demo reset to reload sample store data.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** v18+ (tested on Node v22)
* **npm** v9+

### Installation & Run

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Production Build & Typecheck:
   ```bash
   npm run build
   ```

---

## 🏗️ Architecture & Technology Stack

* **Framework**: React 18, TypeScript, Vite
* **Design System**: AWS `@cloudscape-design/components`, `@cloudscape-design/global-styles`, `@cloudscape-design/collection-hooks`, `@cloudscape-design/design-tokens`
* **State Management**: Zustand
* **Routing**: React Router v6
* **Persistence**: LocalStorage with schema export/import engine (`StorageService`)
* **Print Engine**: Dedicated `@media print` rules for 80mm thermal paper and A4 documents
