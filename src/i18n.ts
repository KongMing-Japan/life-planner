export type Locale = 'ja' | 'zh'

export const locales: { id: Locale; label: string; short: string }[] = [
  { id: 'ja', label: '日本語', short: 'JA' },
  { id: 'zh', label: '中文', short: '中' },
]

const translations = {
  ja: {
    appTitle: 'LifeOS Planner', appSubtitle: '人生・家族・資産を、現在から100歳までひとつにつなぐ', realMoney: '現在価値', household: '家族情報', events: 'ライフイベント', dashboard: '生涯資産シミュレーション', tools: 'ツール・比較', addSpouse: '配偶者を追加', addChild: '子どもを追加', addEvent: 'イベントを追加', annualDetails: '年次明細を見る', disclaimer: '本結果は一定の前提に基づく試算であり、投資・税務・法務上の助言ではありません。', localSave: 'この端末に保存', language: '表示言語',
    simple: 'かんたん', detailed: '詳細', inputMode: '入力モード', quickTitle: 'まず6つの数字を入力', liveCalc: 'リアルタイム計算', assetsNow: '現在の金融資産', annualExpense: '年間基礎生活費（イベント除く）', yourAge: 'あなたの年齢', yourIncome: 'あなたの年収（税引前）', retireAge: '退職予定年齢', retirementExpense: '退職後の年間生活費', family: '家族構成', removeSpouse: '配偶者を削除', spouseAge: '配偶者の年齢', spouseIncome: '配偶者の年収（税引前）', singleHousehold: '単身世帯です。必要に応じて配偶者を追加できます。', standardAssumptions: '標準の前提条件', change: '変更', nominalReturn: '想定運用利回り', inflation: '物価上昇率', calculateTo: '歳まで試算',
    assetsAssumptions: '資産・前提条件', startYear: '開始年', planUntil: '本人の年齢', investableAssets: '現在の運用資産', borrowingRate: '借入金利（名目）', householdMembers: '家族構成', primary: '本人', spouse: '配偶者', name: '氏名', currentAge: '現在年齢', grossIncome: '年収（税引前）', salaryRealGrowth: '実質賃金上昇率', pensionStart: '年金開始年齢', annualPension: '年間年金額', medicalStart: '医療費開始年齢', annualMedical: '年間医療費', children: '子ども', noChildren: '子どもは登録されていません。', householdExpenseDetail: '年間支出', housingBefore: '退職前の住居費', housingAfter: '退職後の住居費', livingBefore: '退職前の生活費', livingAfter: '退職後の生活費', travel: '旅行・余暇', taxSettings: '税率設定', salaryTax: '給与の実効税率', pensionTax: '年金の実効税率', eventTax: 'イベント収入税率', calculationRules: '計算ルール', ruleRealMoney: 'すべての金額は現在価値。生活費・年金は実質額で一定です。', ruleAssetTiming: '運用収益は年初資産にのみ適用し、その年の収支には適用しません。', ruleRetirement: '家計支出は最後の成人が退職した年から退職後水準へ切り替えます。', ruleDebt: '資産がマイナスになった後は、運用利回りではなく借入金利を適用します。', ruleScope: '教育費・住宅購入・退職金などは自動生成せず、ライフイベントで明示します。',
    eventHelp: '教育、住宅購入、住宅ローンなど、金額の大きいイベントを入力します。', expense: '支出', income: '収入', eventName: 'イベント名', eventStart: '開始年', duration: '期間', annualAmount: '年間金額', relatedMember: '対象者', householdShared: '家族共通', taxable: 'イベント税率を適用', newEvent: '新しいイベント', delete: '削除',
    dashboardSubtitle: '金額はすべて現在価値・実質運用利回り', balanceAt: '歳時点の残高', minimumAssets: '最低資産額', firstShortfall: '初めて資産がマイナス', notOccurred: '発生なし', staysPositive: '試算期間中はプラスを維持', realReturn: '実質運用利回り', returnNote: '運用利回りから物価上昇率を控除', requiredReturn: '必要な運用利回り', requiredReturnNote: '赤字を避ける最低名目利回り', currentAssumption: '現在の想定', retirementAdjustment: '退職後の年間調整額', canSpendMore: '毎年追加で使える目安', mustSpendLess: '毎年減らす必要がある目安', onTarget: '現在の支出でほぼゼロ', notAchievable: '30%以下では達成不可', yearEnd: '年末', year: '年', age: '歳', cashflowTitle: '年間収入・支出', cashflowHelp: '青は収入、赤は支出、折れ線は差し引き後の年間収支', afterTaxIncome: '税引後収入', totalExpense: '総支出', netCashflow: '年間収支', assetsTitle: '家族資産の推移', assetsHelp: '毎年の収支を反映した資産が100歳までどう推移するかを確認', positiveAssets: 'プラス資産', shortfall: '資金不足', endAssets: '年末資産', riskTitle: '歳で資産がマイナスになる見込み', riskHelp: '退職時期、長期支出、大型イベント、貯蓄・運用前提を見直してください。', yearAge: '年 / 年齢', startAssets: '年初資産', investmentGain: '運用収益', eventColumn: 'イベント', noEvent: '—', insufficient: '資金不足', nearZero: 'Die with Zero に近い', surplus: '残高が多め',
    toolFiles: 'プランファイル', toolFilesHelp: 'プランはこのブラウザに保存されます。JSONでバックアップや移行もできます。', exportJson: 'JSONを書き出す', importJson: 'JSONを読み込む', importSuccess: 'プランを読み込みました', importFailed: '読み込みに失敗しました', templates: 'クイックテンプレート', templatesHelp: 'テンプレートを読み込むと現在の入力内容が上書きされます。', applyTemplate: '適用', scenario: 'シナリオ A / B', scenarioHelp: 'Aは現在のプラン、Bは比較用で主プランを上書きしません。', copyScenario: '現在のプランをBへコピー', retireLater: '退職 +1年', expenseDown: '生活費 -5%', returnUp: '利回り +0.5%', delayEvent: '最初のイベント +1年', terminalBalance: '最終残高', difference: '差額', applyB: 'Bを主プランに適用', clearB: 'Bを削除', jumpDetails: '年次明細へ移動', close: '閉じる', templateLoaded: '読み込み済み', moneyUnit: '万円', moneyUnitLong: '万円',
  },
  zh: {
    appTitle: 'LifeOS Planner', appSubtitle: '把人生、家庭与资产连接起来，一直规划到100岁', realMoney: '按今天购买力', household: '家庭属性', events: '人生事件', dashboard: '生涯财富预测', tools: '工具与情景', addSpouse: '添加配偶', addChild: '添加孩子', addEvent: '添加事件', annualDetails: '查看年度明细', disclaimer: '结果为确定性估算，不构成投资、税务或法律建议。', localSave: '本地保存', language: '显示语言',
    simple: '简单版', detailed: '详细版', inputMode: '输入模式', quickTitle: '先填6个关键数字', liveCalc: '实时计算', assetsNow: '现在有多少资产', annualExpense: '家庭基础年支出（不含事件）', yourAge: '你的年龄', yourIncome: '你的税前年收入', retireAge: '计划退休年龄', retirementExpense: '退休后每年支出', family: '家庭成员', removeSpouse: '移除配偶', spouseAge: '配偶年龄', spouseIncome: '配偶税前年收入', singleHousehold: '单人家庭，需要时可添加配偶。', standardAssumptions: '当前采用标准假设', change: '修改', nominalReturn: '名义年化收益', inflation: '通胀', calculateTo: '岁',
    assetsAssumptions: '资产与假设', startYear: '起始年份', planUntil: '规划至本人', investableAssets: '当前可投资资产', borrowingRate: '借款名义利率', householdMembers: '家庭成员', primary: '本人', spouse: '配偶', name: '姓名', currentAge: '当前年龄', grossIncome: '税前年收入', salaryRealGrowth: '实际工资增长率', pensionStart: '养老金开始', annualPension: '养老金年额', medicalStart: '医疗费开始', annualMedical: '医疗费年额', children: '子女', noChildren: '暂未添加子女。', householdExpenseDetail: '家庭年度支出', housingBefore: '退休前住房', housingAfter: '退休后住房', livingBefore: '退休前生活', livingAfter: '退休后生活', travel: '旅行休闲', taxSettings: '税率设置', salaryTax: '工资税率', pensionTax: '养老金税率', eventTax: '事件收入税率', calculationRules: '计算规则', ruleRealMoney: '全部金额均按今天购买力计算，生活费与养老金保持实际金额不变。', ruleAssetTiming: '投资收益只作用于年初资产，当年现金流不参与当年收益。', ruleRetirement: '最后一位成人退休后，家庭支出才切换到退休后水平。', ruleDebt: '资产跌破零后改用借款利率，不再使用投资收益率。', ruleScope: '教育、购房和退休金不会自动生成，需通过人生事件明确填写。',
    eventHelp: '填写教育、购房、房贷等影响较大的事件。', expense: '支出', income: '收入', eventName: '事件名称', eventStart: '开始年份', duration: '持续', annualAmount: '每年金额', relatedMember: '关联成员', householdShared: '家庭共同', taxable: '按事件税率课税', newEvent: '新事件', delete: '删除',
    dashboardSubtitle: '所有金额均为今天的购买力 · 实际收益率', balanceAt: '岁余额', minimumAssets: '最低资产', firstShortfall: '首次资金耗尽', notOccurred: '未发生', staysPositive: '预测期内资产保持为正', realReturn: '实际年化收益', returnNote: '名义收益扣除通胀', requiredReturn: '所需投资收益率', requiredReturnNote: '避免退休赤字的最低名义收益率', currentAssumption: '当前假设', retirementAdjustment: '退休后年度调整额', canSpendMore: '每年可增加的支出', mustSpendLess: '每年需要减少的支出', onTarget: '当前支出已接近花完', notAchievable: '30%以内无法实现', yearEnd: '年末', year: '年', age: '岁', cashflowTitle: '年度收入与支出', cashflowHelp: '蓝色为收入、红色为支出，折线表示相抵后的年度净现金流', afterTaxIncome: '税后收入', totalExpense: '总支出', netCashflow: '净现金流', assetsTitle: '家庭资产轨迹', assetsHelp: '查看现金流累积后，家庭财富如何走到100岁', positiveAssets: '资产为正', shortfall: '资金缺口', endAssets: '年末资产', riskTitle: '岁时资产预计转负', riskHelp: '可尝试延后退休、降低长期支出、调整重大事件或提高储蓄与投资回报假设。', yearAge: '年份 / 年龄', startAssets: '年初资产', investmentGain: '投资收益', eventColumn: '事件', noEvent: '—', insufficient: '资金不足', nearZero: '接近 Die with Zero', surplus: '结余偏高',
    toolFiles: '计划文件', toolFilesHelp: '计划只保存在本机浏览器，也可以导出备份或换设备导入。', exportJson: '导出 JSON', importJson: '导入 JSON', importSuccess: '计划已成功导入', importFailed: '导入失败', templates: '快速模板', templatesHelp: '加载模板会覆盖当前输入，适合快速开始。', applyTemplate: '应用模板', scenario: '情景 A / B', scenarioHelp: '情景A是当前计划；情景B不会覆盖你的主计划。', copyScenario: '复制当前计划为情景B', retireLater: '退休 +1年', expenseDown: '生活费 -5%', returnUp: '收益率 +0.5%', delayEvent: '首个事件 +1年', terminalBalance: '终点余额', difference: '差异', applyB: '将B应用为主计划', clearB: '清除B', jumpDetails: '跳转到年度明细', close: '关闭', templateLoaded: '已加载', moneyUnit: '万日元', moneyUnitLong: '万日元',
  },
} as const

export type I18nCopy = { [K in keyof typeof translations.ja]: string }

export const getCopy = (locale: Locale): I18nCopy => translations[locale] as I18nCopy

export const formatMoney = (value: number, locale: Locale) => {
  const isNegative = value < 0
  const absVal = Math.abs(value)
  const amount = Math.round(absVal / 10_000)
  const numberLocale = locale === 'ja' ? 'ja-JP' : 'zh-CN'

  let formatted = ''
  if (amount >= 10_000) {
    const oku = Math.floor(amount / 10_000)
    const man = amount % 10_000
    if (locale === 'ja') {
      formatted = man === 0 ? `${oku}億円` : `${oku}億${man.toLocaleString(numberLocale)}万円`
    } else {
      formatted = man === 0 ? `${oku}亿日元` : `${oku}亿${man.toLocaleString(numberLocale)}万日元`
    }
  } else {
    const unit = locale === 'ja' ? '万円' : '万日元'
    formatted = `${amount.toLocaleString(numberLocale)}${unit}`
  }
  return isNegative ? `-${formatted}` : formatted
}

export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

export const statusLabel = (status: string, copy: I18nCopy) => {
  if (status === '资金不足') return copy.insufficient
  if (status === '接近 Die with Zero') return copy.nearZero
  return copy.surplus
}
