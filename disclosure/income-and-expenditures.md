# AUTO-MAS 项目收支总览

<script setup>
import { computed } from 'vue'

const records = [
  { name: '用户捐赠', description: 'maa捐赠（他备注是这么写的）', amount: 5.00, date: '2025年5月11日' },
  { name: '用户捐赠', description: 'sgqiah捐赠（TB店渠道）', amount: 10.50, date: '2025年6月4日' },
  { name: 'Mirror酱分成', description: '5月份结算', amount: 414.61, date: '2025年6月4日' },
  { name: 'B站小店获赠', description: '5月份结算', amount: 269.80, date: '2025年6月4日' },
  { name: '用户Rege赞助', description: '好多奇奇怪怪的周边～', amount: 0.00, date: '2025年6月20日' },
  { name: 'Mirror酱分成', description: '6月份结算', amount: 133.64, date: '2025年7月1日' },
  { name: 'B站小店获赠', description: '6月份结算', amount: 110.60, date: '2025年7月1日' },
  { name: '友链结算误差', description: '5-6月统一结算', amount: -19.60, date: '2025年7月12日' },
  { name: '服务器开支', description: '5-7月统一结算', amount: -30.00, date: '2025年7月12日' },
  { name: '夏日感恩回馈用户侧邮费', description: '感谢Rege赞助', amount: -24.00, date: '2025年7月12日' },
  { name: 'Mirror酱分成', description: '7月份结算', amount: 161.79, date: '2025年9月2日' },
  { name: 'Mirror酱分成', description: '8月份结算', amount: 49.69, date: '2025年9月2日' },
  { name: 'B站小店获赠', description: '7、8月份结算', amount: 21.60, date: '2025年9月2日' },
  { name: '下载站服务器开支', description: '8、9月统一结算', amount: -20.00, date: '2025年9月2日' },
  { name: 'auto-mas.top域名注册', description: '2035年到期', amount: -188.00, date: '2025年9月2日' },
  { name: '主站服务器开支', description: '2025年度', amount: -99.00, date: '2025年9月2日' },
  { name: '开发者夏日回馈奖品', description: '购置音律联觉通行证抱2盒', amount: -210.00, date: '2025年9月2日' },
  { name: 'Mirror酱分成', description: '9月份结算', amount: 61.05, date: '2025年12月31日' },
  { name: 'Mirror酱分成', description: '10月份结算', amount: 79.51, date: '2025年12月31日' },
  { name: 'Mirror酱分成', description: '11月份结算', amount: 115.47, date: '2025年12月31日' },
  { name: 'B站小店获赠', description: '9-12月份结算', amount: 227.70, date: '2025年12月31日' },
  { name: '下载站服务器开支', description: '10-12月统一结算', amount: -30.00, date: '2025年12月31日' },
  { name: '下载站服务器开支', description: '1-6月统一结算', amount: -300.00, date: '2026年1月9日' },
  { name: '开发者福利快递费', description: '单件平均 5', amount: -40.00, date: '2026年1月9日' },
  { name: '用户捐赠', description: 'Chainsmoker捐赠（微信收款）', amount: 20.00, date: '2026年1月16日' },
  { name: 'Mirror酱分成', description: '12月份结算', amount: 155.19, date: '2026年1月16日' },
  { name: 'Mirror酱分成', description: '1月份结算', amount: 51.38, date: '2026年1月16日' },
  { name: 'Mirror酱分成', description: '2月份结算', amount: 57.29, date: '2026年1月16日' },
  { name: 'Mirror酱分成', description: '3月份结算', amount: 41.93, date: '2026年4月2日' },
  { name: '夸克网盘任推邦分成', description: '1-3月份结算', amount: 27.50, date: '2026年4月2日' },
  { name: '开发者开发工具订阅报销', description: '个人申报比例报销', amount: -50, date: '2026年4月2日' },
  { name: 'B站小店获赠', description: '1-3月统一结算', amount: 179.18, date: '2026年4月2日' },
  { name: '用户捐赠', description: 'delaube捐赠（QQ收款）', amount: 30, date: '2026年4月3日' },
  { name: 'Mirror酱分成', description: '4月份结算', amount: 83.5, date: '2026年5月2日' },
  { name: '开发者夏日回馈奖品', description: '购置白名单通行证抱2盒与捆物', amount: -304.20, date: '2026年5月2日' },
  { name: 'Mirror酱分成', description: '5月份结算', amount: 141.5, date: '2026年6月1日' },
  { name: '主站服务器开支', description: '2026年度', amount: -99.00, date: '2026年6月23日' },
  { name: '夸克网盘任推邦分成', description: '4-6月份结算', amount: 73.57, date: '2026年6月26日' },
  { name: 'Mirror酱分成', description: '6月份结算', amount: 228.55, date: '2026年7月1日' },
  { name: 'B站小店获赠', description: '4-6月份结算', amount: 114.41, date: '2026年7月1日' },
  { name: '开发者开发工具订阅报销', description: '个人申报全额报销', amount: -272.4, date: '2026年7月10日' },
  { name: '下载站服务器开支', description: '2026年度续费', amount: -459.00, date: '2026年7月25日' },
  { name: 'Mirror酱分成', description: '7月份结算', amount: 251.93, date: '2026年8月1日' },
  { name: 'Mirror酱分成', description: '8月份结算', amount: 245.47, date: '2026年9月1日' },
  { name: '开发者福利快递费', description: '单件平均 5', amount: -65.00, date: '2026年9月1日' },
  { name: '主站服务器开支', description: '2027年度', amount: -99.00, date: '2026年9月7日' },
  { name: 'PackyCode 赞助', description: '首月 150元 AI API 额度', amount: 0.00, date: '2026年9月7日' },
  { name: '开发者开发工具订阅报销', description: '个人申报全额报销', amount: -50, date: '2026年9月7日' },
  { name: 'Mirror酱分成', description: '9月份结算', amount: 110.24, date: '2026年10月1日' },
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
      <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--vp-c-divider);">名称</th>
      <th style="padding: 12px; text-align: left; border-bottom: 2px solid var(--vp-c-divider);">说明</th>
      <th style="padding: 12px; text-align: right; border-bottom: 2px solid var(--vp-c-divider);">金额</th>
      <th style="padding: 12px; text-align: center; border-bottom: 2px solid var(--vp-c-divider);">记录日期</th>
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
      <td colspan="2" style="padding: 12px; font-weight: 600; color: var(--vp-c-text-1);">收入合计</td>
      <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--vp-c-green-1); font-family: 'Consolas', 'Monaco', monospace; font-size: 1.05em;">¥{{ incomeTotal }}</td>
      <td style="padding: 12px;"></td>
    </tr>
    <tr style="background-color: var(--vp-c-bg-soft);">
      <td colspan="2" style="padding: 12px; font-weight: 600; color: var(--vp-c-text-1);">支出合计</td>
      <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--vp-c-red-1); font-family: 'Consolas', 'Monaco', monospace; font-size: 1.05em;">{{ expenseTotal }}</td>
      <td style="padding: 12px;"></td>
    </tr>
    <tr style="background: linear-gradient(to right, var(--vp-c-brand-soft), var(--vp-c-bg-soft)); border-top: 3px double var(--vp-c-brand-1);">
      <td colspan="2" style="padding: 14px; font-weight: 700; color: var(--vp-c-text-1); font-size: 1.05em;">总计余额</td>
      <td style="padding: 14px; text-align: right; font-weight: 700; color: var(--vp-c-brand-1); font-family: 'Consolas', 'Monaco', monospace; font-size: 1.15em;">¥{{ totalAmount }}</td>
      <td style="padding: 14px;"></td>
    </tr>
  </tfoot>
</table>
