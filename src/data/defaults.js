// 默认家庭基本设定
export const defaultSetup = {
    // 基本设置
    Start_Year: 2025,
    Years: 50,
    End_Age: 95,
    Initial_Asset: 100000000,
    Invest_Return: 0.05,
    Inflation: 0.02,
    Safety_Buffer_Years: 1,
    Income_Is_After_Tax: false,

    // 家庭成员信息 - 本人 (Person 1)
    Person1_Birth_Year: 1981,
    Person1_Salary_Start: 12000000,
    Person1_Retire_Age: 65,
    Person1_Pension_Start_Age: 65,
    Person1_Pension_Income: 2000000,
    Person1_Medical_Start_Age: 70,
    Person1_Medical_Annual: 960000,

    // 家庭成员信息 - 配偶 (Person 2)
    Person2_Birth_Year: 1986,
    Person2_Salary_Start: 9000000,
    Person2_Retire_Age: 65,
    Person2_Pension_Start_Age: 65,
    Person2_Pension_Income: 2000000,
    Person2_Medical_Start_Age: 70,
    Person2_Medical_Annual: 960000,

    // 其他孩子信息
    Child1_Birth_Year: 2019,

    // 住房支出
    Housing_Annual_Pre: 3600000,
    Housing_Annual_Post: 0,

    // 生活支出
    Living_Annual_Pre: 4440000,
    Living_Annual_Post: 3600000,
    Travel_Annual: 960000,

    // 税率
    Income_Tax_Rate: 0.30,
    Pension_Tax_Rate: 0.15,
    Events_Tax_Rate: 0.30,
};

export const setupFields = [
    {
        group: 'Basic Config', fields: [
            { key: 'Start_Year', label: 'Start Year', type: 'number', unit: '' },
            { key: 'Years', label: 'Duration', type: 'number', unit: 'Years' },
            { key: 'End_Age', label: 'Plan End Age', type: 'number', unit: 'Age' },
            { key: 'Initial_Asset', label: 'Initial Assets', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Invest_Return', label: 'Inv. Return', type: 'percent' },
            { key: 'Inflation', label: 'Inflation', type: 'percent' },
            { key: 'Safety_Buffer_Years', label: 'Safety Buffer', type: 'number', unit: 'Years' },
        ]
    },
    {
        group: 'Husband / Main', fields: [
            { key: 'Person1_Birth_Year', label: 'Birth Year', type: 'number', unit: '' },
            { key: 'Person1_Salary_Start', label: 'Current Salary', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Person1_Retire_Age', label: 'Retire Age', type: 'number', unit: 'Age' },
            { key: 'Person1_Pension_Start_Age', label: 'Pension Start', type: 'number', unit: 'Age' },
            { key: 'Person1_Pension_Income', label: 'Pension Amt', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Person1_Medical_Start_Age', label: 'Med. Start', type: 'number', unit: 'Age' },
            { key: 'Person1_Medical_Annual', label: 'Med. Cost', type: 'currency', scale: 10000, suffix: '万' },
        ]
    },
    {
        group: 'Wife / Partner', fields: [
            { key: 'Person2_Birth_Year', label: 'Birth Year', type: 'number', unit: '' },
            { key: 'Person2_Salary_Start', label: 'Current Salary', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Person2_Retire_Age', label: 'Retire Age', type: 'number', unit: 'Age' },
            { key: 'Person2_Pension_Start_Age', label: 'Pension Start', type: 'number', unit: 'Age' },
            { key: 'Person2_Pension_Income', label: 'Pension Amt', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Person2_Medical_Start_Age', label: 'Med. Start', type: 'number', unit: 'Age' },
            { key: 'Person2_Medical_Annual', label: 'Med. Cost', type: 'currency', scale: 10000, suffix: '万' },
        ]
    },
    {
        group: 'Expenses (Annual)', fields: [
            { key: 'Housing_Annual_Pre', label: 'Housing (Pre-Retire)', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Housing_Annual_Post', label: 'Housing (Post-Retire)', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Living_Annual_Pre', label: 'Living (Pre-Retire)', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Living_Annual_Post', label: 'Living (Post-Retire)', type: 'currency', scale: 10000, suffix: '万' },
            { key: 'Travel_Annual', label: 'Travel / Leisure', type: 'currency', scale: 10000, suffix: '万' },
        ]
    },
    {
        group: 'Taxes', fields: [
            { key: 'Income_Tax_Rate', label: 'Income Tax', type: 'percent' },
            { key: 'Pension_Tax_Rate', label: 'Pension Tax', type: 'percent' },
            { key: 'Events_Tax_Rate', label: 'Other Tax', type: 'percent' },
        ]
    },
    {
        group: 'Children', fields: [
            { key: 'Child1_Birth_Year', label: 'Child 1 Birth', type: 'number', unit: '' },
        ]
    },
];
