# AUTO-MAS Income and Expenses Overview

<script setup>
import { computed } from 'vue'

const records = [
  { name: 'User donation', description: 'MAA donation, as written in the note', amount: 5.00, date: 'May 11, 2025' },
  { name: 'User donation', description: 'Donation from sgqiah through TB shop channel', amount: 10.50, date: 'June 4, 2025' },
  { name: 'MirrorChyan revenue share', description: 'May settlement', amount: 414.61, date: 'June 4, 2025' },
  { name: 'Bilibili shop gift income', description: 'May settlement', amount: 269.80, date: 'June 4, 2025' },
  { name: 'User Rege sponsorship', description: 'Various merchandise sponsorship', amount: 0.00, date: 'June 20, 2025' },
  { name: 'MirrorChyan revenue share', description: 'June settlement', amount: 133.64, date: 'July 1, 2025' },
  { name: 'Bilibili shop gift income', description: 'June settlement', amount: 110.60, date: 'July 1, 2025' },
  { name: 'Friend-link settlement difference', description: 'May-June combined settlement', amount: -19.60, date: 'July 12, 2025' },
  { name: 'Server expense', description: 'May-July combined settlement', amount: -30.00, date: 'July 12, 2025' },
  { name: 'Summer thank-you user shipping fee', description: 'Thanks to Rege for sponsorship', amount: -24.00, date: 'July 12, 2025' },
  { name: 'MirrorChyan revenue share', description: 'July settlement', amount: 161.79, date: 'September 2, 2025' },
  { name: 'MirrorChyan revenue share', description: 'August settlement', amount: 49.69, date: 'September 2, 2025' },
  { name: 'Bilibili shop gift income', description: 'July-August settlement', amount: 21.60, date: 'September 2, 2025' },
  { name: 'Download site server expense', description: 'August-September combined settlement', amount: -20.00, date: 'September 2, 2025' },
  { name: 'auto-mas.top domain registration', description: 'Expires in 2035', amount: -188.00, date: 'September 2, 2025' },
  { name: 'Main site server expense', description: '2025 annual expense', amount: -99.00, date: 'September 2, 2025' },
  { name: 'Developer summer reward prize', description: 'Purchased two Ambience Synesthesia pass boxes', amount: -210.00, date: 'September 2, 2025' },
  { name: 'MirrorChyan revenue share', description: 'September settlement', amount: 61.05, date: 'December 31, 2025' },
  { name: 'MirrorChyan revenue share', description: 'October settlement', amount: 79.51, date: 'December 31, 2025' },
  { name: 'MirrorChyan revenue share', description: 'November settlement', amount: 115.47, date: 'December 31, 2025' },
  { name: 'Bilibili shop gift income', description: 'September-December settlement', amount: 227.70, date: 'December 31, 2025' },
  { name: 'Download site server expense', description: 'October-December combined settlement', amount: -30.00, date: 'December 31, 2025' },
  { name: 'Download site server expense', description: 'January-June combined settlement', amount: -300.00, date: 'January 9, 2026' },
  { name: 'Developer benefit shipping fee', description: 'Average 5 per item', amount: -40.00, date: 'January 9, 2026' },
  { name: 'User donation', description: 'Donation from Chainsmoker through WeChat payment', amount: 20.00, date: 'January 16, 2026' },
  { name: 'MirrorChyan revenue share', description: 'December settlement', amount: 155.19, date: 'January 16, 2026' },
  { name: 'MirrorChyan revenue share', description: 'January settlement', amount: 51.38, date: 'January 16, 2026' },
  { name: 'MirrorChyan revenue share', description: 'February settlement', amount: 57.29, date: 'January 16, 2026' },
  { name: 'MirrorChyan revenue share', description: 'March settlement', amount: 41.93, date: 'April 2, 2026' },
  { name: 'Quark Cloud Drive RenTuibang revenue share', description: 'January-March settlement', amount: 27.50, date: 'April 2, 2026' },
  { name: 'Developer tool subscription reimbursement', description: 'Reimbursed by personal claim ratio', amount: -50, date: 'April 2, 2026' },
  { name: 'Bilibili shop gift income', description: 'January-March combined settlement', amount: 179.18, date: 'April 2, 2026' },
  { name: 'User donation', description: 'Donation from delaube through QQ payment', amount: 30, date: 'April 3, 2026' },
  { name: 'MirrorChyan revenue share', description: 'April settlement', amount: 83.5, date: 'May 2, 2026' },
  { name: 'Developer summer reward prize', description: 'Purchased two whitelist pass boxes and bundles', amount: -304.20, date: 'May 2, 2026' },
  { name: 'MirrorChyan revenue share', description: 'May settlement', amount: 141.5, date: 'June 1, 2026' },
  { name: 'Main site server expense', description: '2026 annual expense', amount: -99.00, date: 'June 23, 2026' },
  { name: 'Quark Cloud Drive RenTuibang revenue share', description: 'April-June settlement', amount: 73.57, date: 'June 26, 2026' },
  { name: 'MirrorChyan revenue share', description: 'June settlement', amount: 228.55, date: 'July 1, 2026' },
  { name: 'Bilibili shop gift income', description: 'April-June settlement', amount: 114.41, date: 'July 1, 2026' },
  { name: 'Developer tool subscription reimbursement', description: 'Fully reimbursed by personal claim', amount: -272.4, date: 'July 10, 2026' },
  { name: 'Download site server expense', description: '2026 annual renewal', amount: -459.00, date: 'July 25, 2026' },
  { name: 'MirrorChyan revenue share', description: 'July settlement', amount: 251.93, date: 'August 1, 2026' },
  { name: 'MirrorChyan revenue share', description: 'August settlement', amount: 245.47, date: 'September 1, 2026' },
  { name: 'Developer benefit shipping fee', description: 'Average 5 per item', amount: -65.00, date: 'September 1, 2026' },
  { name: 'Main site server expense', description: '2027 annual expense', amount: -99.00, date: 'September 7, 2026' },
  { name: 'PackyCode sponsorship', description: 'First month: ¥150 in AI API credits', amount: 0.00, date: 'September 7, 2026' },
  { name: 'Developer tool subscription reimbursement', description: 'Fully reimbursed by personal claim', amount: -50, date: 'September 7, 2026' },
  { name: 'MirrorChyan revenue share', description: 'September settlement', amount: 110.24, date: 'October 1, 2026' },
]

const totalAmount = computed(() => {
  return records.reduce((sum, record) => sum + record.amount, 0).toFixed(2)
})

const incomeTotal = computed(() => {
  return records.filter(r => r.amount > 0).reduce((sum, record) => sum + record.amount, 0).toFixed(2)
})

const expenseTotal = computed(() => {
  const total = records.filter(r => r.amount < 0).reduce((sum, record) => sum + record.amount, 0)
  return `-¥${Math.abs(total).toFixed(2)}`
})

const formatAmount = (amount) => {
  return amount >= 0 ? `¥${amount.toFixed(2)}` : `-¥${Math.abs(amount).toFixed(2)}`
}
</script>

<table style="width: 100%; border-collapse: collapse;">
  <thead>
    <tr style="background: linear-gradient(to right, var(--vp-c-bg-soft), var(--vp-c-bg-mute));">
      <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--vp-c-divider);">Name</th>
      <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--vp-c-divider);">Description</th>
      <th style="padding: 12px; text-align: right; border-bottom: 2px solid var(--vp-c-divider);">Amount</th>
      <th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--vp-c-divider);">Record Date</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(record, index) in records" :key="index" 
        :style="{ backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--vp-c-bg-soft)' }">
      <td style="padding: 10px; border-bottom: 1px solid var(--vp-c-divider-light);">{{ record.name }}</td>
      <td style="padding: 10px; border-bottom: 1px solid var(--vp-c-divider-light); color: var(--vp-c-text-2);">{{ record.description }}</td>
      <td style="padding: 10px; text-align: right; border-bottom: 1px solid var(--vp-c-divider-light); font-family: 'Consolas', 'Monaco', monospace;"
          :style="{ color: record.amount >= 0 ? 'var(--vp-c-green-2)' : 'var(--vp-c-red-2)', fontWeight: record.amount !== 0 ? '500' : 'normal' }">
        {{ formatAmount(record.amount) }}
      </td>
      <td style="padding: 10px; text-align: center; border-bottom: 1px solid var(--vp-c-divider-light); color: var(--vp-c-text-3); font-size: 0.9em;">{{ record.date }}</td>
    </tr>
  </tbody>
  <tfoot>
    <tr style="background-color: var(--vp-c-bg-soft); border-top: 2px solid var(--vp-c-divider);">
      <td colspan="2" style="padding: 12px; font-weight: 600; color: var(--vp-c-text-1);">Total Income</td>
      <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--vp-c-green-1); font-family: 'Consolas', 'Monaco', monospace; font-size: 1.05em;">¥{{ incomeTotal }}</td>
      <td style="padding: 12px;"></td>
    </tr>
    <tr style="background-color: var(--vp-c-bg-soft);">
      <td colspan="2" style="padding: 12px; font-weight: 600; color: var(--vp-c-text-1);">Total Expenses</td>
      <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--vp-c-red-1); font-family: 'Consolas', 'Monaco', monospace; font-size: 1.05em;">{{ expenseTotal }}</td>
      <td style="padding: 12px;"></td>
    </tr>
    <tr style="background: linear-gradient(to right, var(--vp-c-brand-soft), var(--vp-c-bg-soft)); border-top: 3px double var(--vp-c-brand-1);">
      <td colspan="2" style="padding: 14px; font-weight: 700; color: var(--vp-c-text-1); font-size: 1.05em;">Total Balance</td>
      <td style="padding: 14px; text-align: right; font-weight: 700; color: var(--vp-c-brand-1); font-family: 'Consolas', 'Monaco', monospace; font-size: 1.15em;">¥{{ totalAmount }}</td>
      <td style="padding: 14px;"></td>
    </tr>
  </tfoot>
</table>
