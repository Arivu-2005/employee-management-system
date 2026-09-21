// ---------- 1. Data ----------
// This list stores all employees
let employees = [];

// Which department button is selected ("all" = show everyone)
let currentDept = "all";

// Which employee card is asking "Delete this employee?" (empty = none)
let confirmingId = "";

// Try to load saved employees from the browser
try {
  const saved = localStorage.getItem("employees");
  if (saved) employees = JSON.parse(saved);
} catch (e) {
  employees = [];
}

// If nothing saved, start with sample employees
if (employees.length === 0) {
  employees = [
    { id: "101", name: "Priya", department: "IT",      salary: 55000 },
    { id: "102", name: "Arun",  department: "HR",      salary: 42000 },
    { id: "103", name: "Meena", department: "Finance", salary: 48000 }
  ];
}

// Save employees in the browser
function save() {
  try {
    localStorage.setItem("employees", JSON.stringify(employees));
  } catch (e) {}
}

// ---------- 2. Small helper functions ----------

// Show salary like: Rs. 55,000.00
function money(amount) {
  return "Rs. " + Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Show a green (ok) or red (error) message
function showMessage(text, isError) {
  const box = document.getElementById("message");
  box.textContent = text;
  box.className = isError ? "err" : "ok";
}

// Find one employee by ID (same as find_employee in Python)
function findEmployee(id) {
  return employees.find(function (e) {
    return e.id === String(id);
  });
}

// Make an HTML element quickly: element("div", "card", "hello")
function element(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;   // textContent is safe
  return item;
}

// Same department name always gives the same color
function deptColor(name) {
  let number = 0;
  const text = name.trim().toLowerCase();
  for (let i = 0; i < text.length; i++) {
    number = (number * 31 + text.charCodeAt(i)) % 360;
  }
  return "hsl(" + number + ", 50%, 38%)";
}

// "Priya Kumar" -> "PK"
function initials(name) {
  const words = name.trim().split(" ");
  let letters = words[0][0];
  if (words.length > 1) letters += words[words.length - 1][0];
  return letters.toUpperCase();
}

// ---------- 3. Department buttons ----------
function renderChips() {
  const box = document.getElementById("chips");
  box.innerHTML = "";

  // Collect each department once (ignore upper/lower case)
  const names = {};
  employees.forEach(function (e) {
    names[e.department.trim().toLowerCase()] = e.department.trim();
  });

  // If the selected department has no employees left, go back to "all"
  if (currentDept !== "all" && !names[currentDept]) currentDept = "all";

  function addChip(label, key) {
    const chip = element("button", "chip", label);
    chip.type = "button";
    if (key === currentDept) chip.classList.add("active");
    chip.addEventListener("click", function () {
      currentDept = key;
      confirmingId = "";
      render();
    });
    box.appendChild(chip);
  }

  addChip("All (" + employees.length + ")", "all");
  Object.keys(names).forEach(function (key) {
    const count = employees.filter(function (e) {
      return e.department.trim().toLowerCase() === key;
    }).length;
    addChip(names[key] + " (" + count + ")", key);
  });
}

// ---------- 4. One employee ID card ----------
function makeCard(e) {
  const color = deptColor(e.department);
  const card = element("div", "card");

  // Colored top with department name
  const band = element("div", "band", e.department);
  band.style.background = color;
  card.appendChild(band);

  // Round picture with initials
  const avatar = element("div", "avatar", initials(e.name));
  avatar.style.background = color;
  card.appendChild(avatar);

  // Name, ID, salary
  const info = element("div", "info");
  info.appendChild(element("div", "name", e.name));
  info.appendChild(element("div", "id", "ID: " + e.id));
  info.appendChild(element("div", "salary", money(e.salary)));
  card.appendChild(info);

  // Buttons
  const actions = element("div", "actions");

  if (confirmingId === e.id) {
    // Step 2 of delete: ask "are you sure?"
    actions.appendChild(element("div", "ask", "Delete " + e.name + "?"));

    const yes = element("button", "btn danger-fill", "Yes, delete");
    yes.type = "button";
    yes.addEventListener("click", function () { deleteEmployee(e.id); });

    const no = element("button", "btn ghost", "Cancel");
    no.type = "button";
    no.addEventListener("click", function () {
      confirmingId = "";
      render();
    });

    actions.appendChild(yes);
    actions.appendChild(no);
  } else {
    // Normal buttons: Raise and Delete
    const raise = element("button", "btn ghost", "Raise");
    raise.type = "button";
    raise.addEventListener("click", function () {
      document.getElementById("raiseId").value = e.id;   // fill the raise form
      document.getElementById("raisePercent").focus();
    });

    const del = element("button", "btn danger", "Delete");
    del.type = "button";
    del.addEventListener("click", function () {
      confirmingId = e.id;      // Step 1 of delete
      render();
    });

    actions.appendChild(raise);
    actions.appendChild(del);
  }

  card.appendChild(actions);
  return card;
}

// ---------- 5. Show everything on screen ----------
function render() {
  renderChips();

  // Filter by department (same as search_by_department in Python)
  const list = employees.filter(function (e) {
    return currentDept === "all" || e.department.trim().toLowerCase() === currentDept;
  });

  const box = document.getElementById("cards");
  box.innerHTML = "";

  if (list.length === 0) {
    box.appendChild(element("div", "empty", "No employees yet. Add one from the form."));
  } else {
    list.forEach(function (e) {
      box.appendChild(makeCard(e));
    });
  }

  // Update totals (same as total_payroll in Python)
  let total = 0;
  employees.forEach(function (e) {
    total += e.salary;
  });
  document.getElementById("countBox").textContent = employees.length;
  document.getElementById("payrollBox").textContent = money(total);
}

// ---------- 6. Delete employee ----------
function deleteEmployee(id) {
  const emp = findEmployee(id);
  if (!emp) return;

  // Keep everyone except this employee
  employees = employees.filter(function (e) {
    return e.id !== id;
  });

  confirmingId = "";
  save();
  render();
  showMessage("Employee " + emp.name + " deleted.", false);
}

// ---------- 7. Add employee ----------
document.getElementById("addForm").addEventListener("submit", function (event) {
  event.preventDefault(); // stop page reload

  const id     = document.getElementById("empId").value.trim();
  const name   = document.getElementById("empName").value.trim();
  const dept   = document.getElementById("empDept").value.trim();
  const salary = parseFloat(document.getElementById("empSalary").value);

  if (findEmployee(id)) {
    showMessage("Employee ID " + id + " already exists.", true);
    return;
  }
  if (isNaN(salary) || salary <= 0) {
    showMessage("Salary must be greater than zero.", true);
    return;
  }

  employees.push({ id: id, name: name, department: dept, salary: salary });
  save();
  render();
  this.reset();
  showMessage("Employee " + name + " added.", false);
});

// ---------- 8. Give raise ----------
document.getElementById("raiseForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const id      = document.getElementById("raiseId").value.trim();
  const percent = parseFloat(document.getElementById("raisePercent").value);
  const emp     = findEmployee(id);

  if (!emp) {
    showMessage("No employee found with ID " + id + ".", true);
    return;
  }
  if (isNaN(percent) || percent <= 0) {
    showMessage("Raise percentage must be greater than zero.", true);
    return;
  }

  const oldSalary = emp.salary;
  emp.salary = emp.salary + emp.salary * (percent / 100); // same as apply_raise

  save();
  render();
  this.reset();
  showMessage(emp.name + ": " + money(oldSalary) + " to " + money(emp.salary), false);
});

// ---------- 9. Download employees.json (Python format) ----------
document.getElementById("downloadBtn").addEventListener("click", function () {
  // Python file uses the key "emp_id", so we rename "id" to "emp_id"
  const data = employees.map(function (e) {
    return { emp_id: e.id, name: e.name, department: e.department, salary: e.salary };
  });

  const blob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "employees.json";
  link.click();

  showMessage("employees.json downloaded.", false);
});

// ---------- 10. Load employees.json (made by Python) ----------
document.getElementById("loadBtn").addEventListener("click", function () {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function () {
    try {
      const data = JSON.parse(reader.result);
      employees = data.map(function (item) {
        return {
          id: String(item.emp_id),
          name: item.name,
          department: item.department,
          salary: Number(item.salary)
        };
      });
      currentDept = "all";
      confirmingId = "";
      save();
      render();
      showMessage("Loaded " + employees.length + " employees.", false);
    } catch (e) {
      showMessage("Could not read this file. Use a valid employees.json.", true);
    }
  };
  reader.readAsText(file);
  this.value = "";
});

// ---------- Start ----------
render();
