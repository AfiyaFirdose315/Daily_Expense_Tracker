let expenses = [];

document.getElementById("addBtn").addEventListener("click", addExpense);

function addExpense() {
    let amount = parseFloat(document.getElementById("amount").value);
    let category = document.getElementById("category").value;
    let date = document.getElementById("date").value;
    let desc = document.getElementById("desc").value;
    let method = document.getElementById("method").value;

    let today = new Date().toISOString().split("T")[0];

    if (isNaN(amount) || amount <= 0) {
        alert("Amount must be a positive number");
        return;
    }

    if (date === "" || date > today) {
        alert("Please enter a valid date (not in future)");
        return;
    }

    let expense = {
        id: Date.now(),
        amount,
        category,
        date,
        desc,
        method
    };

    expenses.push(expense);
    displayExpenses();
    calculateTotals();
    clearForm();
}

function displayExpenses() {
    let tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = "";

    expenses.forEach(exp => {
        tableBody.innerHTML += `
            <tr>
                <td>${exp.amount}</td>
                <td>${exp.category}</td>
                <td>${exp.date}</td>
                <td>${exp.desc}</td>
                <td>${exp.method}</td>
                <td>
                    <button onclick="editExpense(${exp.id})">Edit</button>
                    <button onclick="deleteExpense(${exp.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    displayExpenses();
    calculateTotals();
}

function editExpense(id) {
    let exp = expenses.find(e => e.id === id);

    document.getElementById("amount").value = exp.amount;
    document.getElementById("category").value = exp.category;
    document.getElementById("date").value = exp.date;
    document.getElementById("desc").value = exp.desc;
    document.getElementById("method").value = exp.method;

    deleteExpense(id);
}

function calculateTotals() {
    let today = new Date();
    let todayStr = today.toISOString().split("T")[0];

    let startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    let startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    expenses.forEach(exp => {
        let expDate = new Date(exp.date);

        if (exp.date === todayStr) {
            todayTotal += exp.amount;
        }

        if (expDate >= startOfWeek) {
            weekTotal += exp.amount;
        }

        if (expDate >= startOfMonth) {
            monthTotal += exp.amount;
        }
    });

    document.getElementById("todayTotal").textContent = todayTotal.toFixed(2);
    document.getElementById("weekTotal").textContent = weekTotal.toFixed(2);
    document.getElementById("monthTotal").textContent = monthTotal.toFixed(2);
}


function clearForm() {
    document.getElementById("amount").value = "";
    document.getElementById("desc").value = "";
}
