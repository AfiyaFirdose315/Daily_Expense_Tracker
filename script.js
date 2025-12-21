let expenses = [];
let incomes = [];
let monthlyBudget = 0;
let categoryBudgets = {};
let bills = [];
let budgetAlertLevel = 0; // prevents repeated alerts

document.addEventListener("DOMContentLoaded", () => {
    addBtn.addEventListener("click", addExpense);
    addIncomeBtn.addEventListener("click", addIncome);
    setBudgetBtn.addEventListener("click", saveMonthlyBudget);
    setCategoryBudgetBtn.addEventListener("click", saveCategoryBudget);
    addBillBtn.addEventListener("click", addBill);
    exportBtn.addEventListener("click", exportData);
    importBtn.addEventListener("click", importData);
});

/* ---------------- SIDEBAR ---------------- */
function openSection(id) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".side-tab").forEach(b => b.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    event.target.classList.add("active");
}

/* ---------------- INCOME ---------------- */
function addIncome() {
    const amt = Number(incomeAmount.value);
    if (!amt) return alert("Invalid income");

    incomes.push({ amount: amt });
    totalIncome.textContent = incomes.reduce((s, i) => s + i.amount, 0);
    updateBalance();

    incomeAmount.value = "";
    incomeDate.value = "";
}

/* ---------------- BUDGET ---------------- */
function saveMonthlyBudget() {
    monthlyBudget = Number(monthlyBudgetInput.value);
    budgetAlertLevel = 0;
    updateMonthlyBudget();
}

function updateMonthlyBudget() {
    const spent = expenses.reduce((s, e) => s + e.amount, 0);
    const remaining = monthlyBudget - spent;

    budgetSpent.textContent = spent;
    budgetRemaining.textContent = remaining;

    let percent = monthlyBudget ? (spent / monthlyBudget) * 100 : 0;
    budgetFill.style.width = percent + "%";

    applyBudgetColors(percent, budgetFill);
    showBudgetAlerts(percent);

    // Prediction
    const daysPassed = new Date().getDate();
    if (daysPassed > 0 && monthlyBudget) {
        const dailyAvg = spent / daysPassed;
        const daysInMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
        ).getDate();
        predictedBalance.textContent =
            (monthlyBudget - dailyAvg * daysInMonth).toFixed(2);
    }
}

/* ---------- COLOR & ALERTS ---------- */
function applyBudgetColors(percent, el) {
    if (percent < 80) el.style.background = "green";
    else if (percent < 90) el.style.background = "orange";
    else el.style.background = "red";
}

function showBudgetAlerts(percent) {
    if (percent >= 100 && budgetAlertLevel < 100) {
        alert("🚨 Budget exceeded!");
        budgetAlertLevel = 100;
    } else if (percent >= 90 && budgetAlertLevel < 90) {
        alert("⚠️ 90% of budget used");
        budgetAlertLevel = 90;
    } else if (percent >= 80 && budgetAlertLevel < 80) {
        alert("⚠️ 80% of budget used");
        budgetAlertLevel = 80;
    }
}

/* ---------------- CATEGORY BUDGET ---------------- */
function saveCategoryBudget() {
    const cat = budgetCategory.value;
    const amt = Number(categoryBudgetInput.value);
    if (!amt) return alert("Invalid amount");

    categoryBudgets[cat] = amt;
    updateCategoryBudgetUI();
}

function updateCategoryBudgetUI() {
    categoryBudgetBody.innerHTML = "";

    for (let cat in categoryBudgets) {
        const spent = expenses
            .filter(e => e.category === cat)
            .reduce((s, e) => s + e.amount, 0);

        const percent = (spent / categoryBudgets[cat]) * 100;

        categoryBudgetBody.innerHTML += `
            <tr>
                <td>${cat}</td>
                <td>₹${categoryBudgets[cat]}</td>
                <td>₹${spent}</td>
                <td>₹${categoryBudgets[cat] - spent}</td>
                <td>
                    <div class="bar">
                        <div class="fill" style="width:${percent}%"></div>
                    </div>
                    <small>${percent.toFixed(1)}%</small>
                </td>
            </tr>
        `;
    }

    setTimeout(() => {
        document
            .querySelectorAll("#categoryBudgetBody .fill")
            .forEach(bar => applyBudgetColors(parseFloat(bar.style.width), bar));
    }, 0);
}

/* ---------------- EXPENSES ---------------- */
function addExpense() {
    const amt = Number(amount.value);
    if (!amt) return alert("Invalid amount");

    const expense = {
        amount: amt,
        category: category.value,
        account: expenseAccount.value,
        date: date.value,
        desc: desc.value,
        tags: tags.value,
        receipt: receipt.files[0]?.name || "",
        method: method.value
    };

    expenses.push(expense);

    // Auto bill update
    if (expense.category === "Bills") {
        bills.forEach(b => {
            if (
                b.status === "Pending" &&
                expense.desc.toLowerCase().includes(b.name.toLowerCase())
            ) {
                b.status = "Paid";
            }
        });
        renderBills();
    }

    renderExpenses();
    updateMonthlyBudget();
    updateCategoryBudgetUI();
    updateBalance();
    updateSummary();

    amount.value = desc.value = tags.value = "";
    receipt.value = "";
}

function renderExpenses() {
    tableBody.innerHTML = "";
    expenses.forEach((e, i) => {
        tableBody.innerHTML += `
            <tr>
                <td>${e.amount}</td>
                <td>${e.category}</td>
                <td>${e.account}</td>
                <td>${e.date}</td>
                <td>${e.desc}</td>
                <td>${e.tags}</td>
                <td>${e.receipt ? "📄" : "-"}</td>
                <td><button onclick="deleteExpense(${i})">Delete</button></td>
            </tr>
        `;
    });
}

/* ---------------- FILTERING ---------------- */
function applyFilters() {
    let filtered = [...expenses];
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (dateFilter.value === "today") {
        filtered = filtered.filter(e => e.date === today);
    } else if (dateFilter.value === "week") {
        const ws = new Date(now);
        ws.setDate(now.getDate() - now.getDay());
        filtered = filtered.filter(e => new Date(e.date) >= ws);
    } else if (dateFilter.value === "month") {
        filtered = filtered.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth();
        });
    }

    if (filterCategory.value !== "all")
        filtered = filtered.filter(e => e.category === filterCategory.value);

    if (filterMethod.value !== "all")
        filtered = filtered.filter(e => e.method === filterMethod.value);

    if (searchDesc.value)
        filtered = filtered.filter(e =>
            e.desc.toLowerCase().includes(searchDesc.value.toLowerCase())
        );

    renderFilteredExpenses(filtered);
}

function renderFilteredExpenses(list) {
    tableBody.innerHTML = "";
    list.forEach(e => {
        tableBody.innerHTML += `
            <tr>
                <td>${e.amount}</td>
                <td>${e.category}</td>
                <td>${e.account}</td>
                <td>${e.date}</td>
                <td>${e.desc}</td>
                <td>${e.tags}</td>
                <td>${e.receipt ? "📄" : "-"}</td>
                <td>-</td>
            </tr>
        `;
    });
}

/* ---------------- SUMMARY ---------------- */
function updateSummary() {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const ws = new Date(now);
    ws.setDate(now.getDate() - now.getDay());

    let t = 0, w = 0, m = 0;
    const catTotals = {};

    expenses.forEach(e => {
        const d = new Date(e.date);
        if (e.date === today) t += e.amount;
        if (d >= ws) w += e.amount;
        if (d.getMonth() === now.getMonth()) m += e.amount;

        catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    todayTotal.textContent = `Today: ₹${t}`;
    weekTotal.textContent = `This Week: ₹${w}`;
    monthTotal.textContent = `This Month: ₹${m}`;
    totalTransactions.textContent = `Transactions: ${expenses.length}`;

    categoryTotalsBody.innerHTML = "";
    for (let c in catTotals) {
        categoryTotalsBody.innerHTML += `
            <tr><td>${c}</td><td>₹${catTotals[c]}</td></tr>
        `;
    }
}

/* ---------------- BILLS ---------------- */
function addBill() {
    bills.push({
        name: billName.value,
        amount: Number(billAmount.value),
        dueDate: billDate.value,
        status: "Pending"
    });
    renderBills();
    billName.value = billAmount.value = billDate.value = "";
}

function renderBills() {
    billTable.innerHTML = "";
    bills.forEach(b => {
        billTable.innerHTML += `
            <tr>
                <td>${b.name}</td>
                <td>₹${b.amount}</td>
                <td>${b.dueDate}</td>
                <td>${b.status}</td>
            </tr>
        `;
    });
}

/* ---------------- BALANCE ---------------- */
function updateBalance() {
    const i = incomes.reduce((s, x) => s + x.amount, 0);
    const e = expenses.reduce((s, x) => s + x.amount, 0);
    balance.textContent = i - e;
}

/* ---------------- DATA ---------------- */
function exportData() {
    const blob = new Blob(
        [JSON.stringify({ expenses, incomes, monthlyBudget, categoryBudgets, bills })],
        { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expense-tracker.json";
    a.click();
}

function importData() {
    const r = new FileReader();
    r.onload = () => {
        const d = JSON.parse(r.result);
        expenses = d.expenses || [];
        incomes = d.incomes || [];
        monthlyBudget = d.monthlyBudget || 0;
        categoryBudgets = d.categoryBudgets || {};
        bills = d.bills || [];
        renderExpenses();
        renderBills();
        updateSummary();
        updateMonthlyBudget();
        updateCategoryBudgetUI();
        updateBalance();
    };
    r.readAsText(importFile.files[0]);
}
