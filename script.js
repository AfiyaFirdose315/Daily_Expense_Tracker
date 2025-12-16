let expenses = [];
let incomes = [];
let monthlyBudget = 0;
let categoryBudgets = {};

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addBtn").addEventListener("click", addExpense);
    document.getElementById("addIncomeBtn").addEventListener("click", addIncome);
    document.getElementById("setBudgetBtn").addEventListener("click", saveMonthlyBudget);
    document.getElementById("setCategoryBudgetBtn").addEventListener("click", saveCategoryBudget);
    exportBtn.addEventListener("click", exportData);
    importBtn.addEventListener("click", importData);
});

function openSection(id) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".side-tab").forEach(b => b.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    event.target.classList.add("active");
}

/* Income */
function addIncome() {
    const amount = Number(incomeAmount.value);
    const date = incomeDate.value;
    if (!amount || !date) return alert("Enter valid income");
    incomes.push({ amount });
    totalIncome.textContent = incomes.reduce((s, i) => s + i.amount, 0);
    updateBalance();
}

/* Monthly Budget */
function saveMonthlyBudget() {
    monthlyBudget = Number(monthlyBudgetInput.value);
    budgetAmount.textContent = monthlyBudget;
    updateMonthlyBudget();
}

function updateMonthlyBudget() {
    const spent = expenses.reduce((s, e) => s + e.amount, 0);
    budgetSpent.textContent = spent;
    budgetRemaining.textContent = monthlyBudget - spent;
    budgetFill.style.width = (spent / monthlyBudget) * 100 + "%";
}

/* Category Budget */
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
        const spent = expenses.filter(e => e.category === cat)
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
                </td>
            </tr>
        `;
    }
}

/* Expenses */
function addExpense() {
    const amountInput = document.getElementById("amount");
    const categoryInput = document.getElementById("category");
    const accountInput = document.getElementById("expenseAccount");
    const dateInput = document.getElementById("date");
    const descInput = document.getElementById("desc");
    const methodInput = document.getElementById("method");
    const recurringInput = document.getElementById("recurring");

    const amt = Number(amountInput.value);

    if (!amt || amt <= 0) {
        alert("Enter valid amount");
        return;
    }

    const expense = {
        amount: amt,
        category: categoryInput.value,
        account: accountInput.value,
        date: dateInput.value,
        desc: descInput.value,
        method: methodInput.value,
        recurring: recurringInput.value
    };

    expenses.push(expense);

    renderExpenses();
    updateMonthlyBudget();
    updateCategoryBudgetUI();
    updateBalance();

    // Clear form
    amountInput.value = "";
    descInput.value = "";
}



function renderExpenses() {
    tableBody.innerHTML = "";

    expenses.forEach((e, index) => {
        tableBody.innerHTML += `
            <tr>
                <td>${e.amount}</td>
                <td>${e.category}</td>
                <td>${e.account}</td>
                <td>${e.date || "-"}</td>
                <td>${e.desc || "-"}</td>
                <td>${e.method}</td>
                <td>${e.recurring}</td>
                <td>
                    <button onclick="deleteExpense(${index})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteExpense(index) {
    expenses.splice(index, 1);
    renderExpenses();
    updateMonthlyBudget();
    updateCategoryBudgetUI();
    updateBalance();
}


function updateBalance() {
    const income = incomes.reduce((s, i) => s + i.amount, 0);
    const expense = expenses.reduce((s, e) => s + e.amount, 0);
    balance.textContent = income - expense;
}

function exportData() {
    const data = {
        expenses,
        incomes,
        monthlyBudget,
        categoryBudgets
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "expense-tracker-data.json";
    a.click();
}


function importData() {
    const file = importFile.files[0];
    if (!file) return alert("Select a file first");

    const reader = new FileReader();
    reader.onload = () => {
        const data = JSON.parse(reader.result);

        expenses = data.expenses || [];
        incomes = data.incomes || [];
        monthlyBudget = data.monthlyBudget || 0;
        categoryBudgets = data.categoryBudgets || {};

        renderExpenses();
        updateMonthlyBudget();
        updateCategoryBudgetUI();
        updateBalance();

        alert("Data imported successfully");
    };
    reader.readAsText(file);
}
