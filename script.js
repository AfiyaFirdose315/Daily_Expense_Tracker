let expenses = [];
let incomes = [];
let monthlyBudget = 0;
let categoryBudgets = {};
let accounts = { Wallet: 0, Bank: 0, Savings: 0 };

// --- Event listeners ---
document.getElementById("addBtn").addEventListener("click", addExpense);
document.getElementById("setBudgetBtn").addEventListener("click", saveMonthlyBudget);
document.getElementById("setCategoryBudgetBtn").addEventListener("click", saveCategoryBudget);
document.getElementById("addIncomeBtn").addEventListener("click", addIncome);
document.getElementById("exportBtn").addEventListener("click", exportData);
document.getElementById("importBtn").addEventListener("click", importData);

// ------------------- Income -------------------
function addIncome() {
    let income = {
        amount: Number(document.getElementById("incomeAmount").value),
        category: document.getElementById("incomeCategory").value,
        account: document.getElementById("incomeAccount").value,
        date: document.getElementById("incomeDate").value
    };

    if (income.amount <= 0) return alert("Invalid income");

    incomes.push(income);
    accounts[income.account] += income.amount;

    updateIncomeUI();
    document.getElementById("incomeAmount").value = "";
    document.getElementById("incomeDate").value = "";
}

function updateIncomeUI() {
    let totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    document.getElementById("totalIncome").textContent = totalIncome.toFixed(2);
    updateBalance();
}

// ------------------- Balance -------------------
function updateBalance() {
    let incomeTotal = incomes.reduce((s, i) => s + i.amount, 0);
    let expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
    let balance = incomeTotal - expenseTotal;
    document.getElementById("balance").textContent = balance.toFixed(2);
}

// ------------------- Monthly Budget -------------------
function saveMonthlyBudget() {
    monthlyBudget = Number(document.getElementById("monthlyBudgetInput").value);
    document.getElementById("budgetAmount").textContent = monthlyBudget.toFixed(2);
    updateMonthlyBudgetUI();
    document.getElementById("monthlyBudgetInput").value = "";
}

function updateMonthlyBudgetUI() {
    if (!monthlyBudget) return;
    let monthSpent = expenses.reduce((s, e) => s + e.amount, 0);
    document.getElementById("budgetSpent").textContent = monthSpent.toFixed(2);
    document.getElementById("budgetRemaining").textContent = (monthlyBudget - monthSpent).toFixed(2);
    let fill = document.getElementById("budgetFill");
    let percent = (monthSpent / monthlyBudget) * 100;
    fill.style.width = percent + "%";
    fill.style.background = percent < 80 ? "green" : percent < 90 ? "orange" : "red";
}

// ------------------- Category Budget -------------------
function saveCategoryBudget() {
    let cat = document.getElementById("budgetCategory").value;
    let amount = Number(document.getElementById("categoryBudgetInput").value);
    if (amount <= 0) return alert("Enter a valid category budget");
    categoryBudgets[cat] = amount;
    updateCategoryBudgetUI();
    document.getElementById("categoryBudgetInput").value = "";
}

function updateCategoryBudgetUI() {
    let tbody = document.getElementById("categoryBudgetBody");
    tbody.innerHTML = "";
    for (let cat in categoryBudgets) {
        let spent = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
        let budget = categoryBudgets[cat];
        let percent = (spent / budget) * 100;
        let color = percent < 80 ? "green" : percent < 90 ? "orange" : "red";
        tbody.innerHTML += `
            <tr>
                <td>${cat}</td>
                <td>₹${budget.toFixed(2)}</td>
                <td>₹${spent.toFixed(2)}</td>
                <td>₹${(budget - spent).toFixed(2)}</td>
                <td>
                    <div class="bar">
                        <div class="fill" style="width:${percent}%;background:${color}"></div>
                    </div>
                </td>
            </tr>
        `;
    }
}

// ------------------- Expenses -------------------
function addExpense() {
    let amount = Number(document.getElementById("amount").value);
    let category = document.getElementById("category").value;
    let account = document.getElementById("expenseAccount").value;
    let date = document.getElementById("date").value;
    let desc = document.getElementById("desc").value;
    let method = document.getElementById("method").value;
    let recurring = document.getElementById("recurring").value;

    if (!amount || amount <= 0) return alert("Amount must be positive");
    let today = new Date().toISOString().split("T")[0];
    if (!date || date > today) return alert("Enter valid date");

    let exp = { id: Date.now(), amount, category, account, date, desc, method, recurring };
    expenses.push(exp);
    accounts[account] -= amount;

    renderExpenses();
    calculateTotals();
    updateCategoryBudgetUI();
    clearExpenseForm();
}

function renderExpenses(filteredExpenses = expenses) {
    let tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";
    filteredExpenses.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td>${e.amount}</td>
                <td>${e.category}</td>
                <td>${e.account}</td>
                <td>${e.date}</td>
                <td>${e.desc}</td>
                <td>${e.method}</td>
                <td>${e.recurring}</td>
                <td>
                    <button onclick="editExpense(${e.id})">Edit</button>
                    <button onclick="deleteExpense(${e.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function clearExpenseForm() {
    document.getElementById("amount").value = "";
    document.getElementById("desc").value = "";
    document.getElementById("date").value = "";
}

// ------------------- Totals & Analytics -------------------
function calculateTotals() {
    let today = new Date().toISOString().split("T")[0];
    let startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    let startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    let todayTotal = 0, weekTotal = 0, monthTotal = 0;
    let categoryTotals = {};

    expenses.forEach(exp => {
        let expDate = new Date(exp.date);
        if (exp.date === today) todayTotal += exp.amount;
        if (expDate >= startOfWeek) weekTotal += exp.amount;
        if (expDate >= startOfMonth) monthTotal += exp.amount;

        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    document.getElementById("todayTotal").textContent = `Today: ₹${todayTotal.toFixed(2)}`;
    document.getElementById("weekTotal").textContent = `This Week: ₹${weekTotal.toFixed(2)}`;
    document.getElementById("monthTotal").textContent = `This Month: ₹${monthTotal.toFixed(2)}`;
    document.getElementById("totalTransactions").textContent = `Transactions: ${expenses.length}`;

    updateCategoryTotals(categoryTotals);
    updateMonthlyBudgetUI();
    updateBalance();
    updateAnalytics(categoryTotals);
}

function updateCategoryTotals(categoryTotals) {
    let tbody = document.getElementById("categoryTotalsBody");
    tbody.innerHTML = "";
    for (let cat in categoryTotals) {
        tbody.innerHTML += `<tr><td>${cat}</td><td>₹${categoryTotals[cat].toFixed(2)}</td></tr>`;
    }
}

function updateAnalytics(categoryTotals) {
    if (!categoryTotals) return;
    let total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    let avgDaily = total / 30;
    let highestCat = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);

    let analytics = `
        <p>Average Daily Spending: ₹${avgDaily.toFixed(2)}</p>
        <p>Most Expensive Category: ${highestCat} (₹${categoryTotals[highestCat].toFixed(2)})</p>
    `;
    document.getElementById("analytics").innerHTML = analytics;
}

// ------------------- Edit/Delete -------------------
function editExpense(id) {
    let exp = expenses.find(e => e.id === id);
    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category;
    document.getElementById("expenseAccount").value = exp.account;
    document.getElementById("date").value = exp.date;
    document.getElementById("desc").value = exp.desc;
    document.getElementById("method").value = exp.method;
    document.getElementById("recurring").value = exp.recurring;
    deleteExpense(id);
}

function deleteExpense(id) {
    let exp = expenses.find(e => e.id === id);
    if (exp) accounts[exp.account] += exp.amount;
    expenses = expenses.filter(e => e.id !== id);
    renderExpenses();
    calculateTotals();
    updateCategoryBudgetUI();
}

// ------------------- Export/Import -------------------
function exportData() {
    const dataStr = JSON.stringify({ expenses, incomes, monthlyBudget, categoryBudgets, accounts });
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "data.json"; a.click();
    URL.revokeObjectURL(url);
}

function importData() {
    const file = document.getElementById("importFile").files[0];
    if (!file) return alert("Select a file");
    const reader = new FileReader();
    reader.onload = e => {
        const data = JSON.parse(e.target.result);
        expenses = data.expenses || [];
        incomes = data.incomes || [];
        monthlyBudget = data.monthlyBudget || 0;
        categoryBudgets = data.categoryBudgets || {};
        accounts = data.accounts || { Wallet:0, Bank:0, Savings:0 };
        renderExpenses(); calculateTotals(); updateCategoryBudgetUI();
    };
    reader.readAsText(file);
}
