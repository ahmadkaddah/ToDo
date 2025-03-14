let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let taskCompletions = JSON.parse(localStorage.getItem('taskCompletions')) || {};
let selectedColor = '#3a7bd5';
let selectedIcon = 'fas fa-pray';

function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function today() {
  return formatDate(new Date());
}

function addTask(task) {
  task.id = Date.now().toString();
  task.createdAt = today();
  tasks.push(task);
  saveTasks();
  renderTasks();
  updateStatistics();
}

function showNotification(title, message, type = 'success') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;

  let icon = 'check-circle';
  if (type === 'error') icon = 'times-circle';
  if (type === 'warning') icon = 'exclamation-circle';

  notification.innerHTML = `
    <div class="notification-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function deleteTask(taskId) {
  const index = tasks.findIndex(task => task.id === taskId);
  if (index !== -1) {
    const taskName = tasks[index].name;
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    updateStatistics();
    showNotification('تم الحذف', `تم حذف المهمة "${taskName}" بنجاح`);
  }
}

function editTask(taskId, updatedTask) {
  const index = tasks.findIndex(task => task.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updatedTask };
    saveTasks();
    renderTasks();
    updateStatistics();
  }
}

function toggleTaskCompletion(taskId) {
  const todayStr = today();

  if (!taskCompletions[taskId]) {
    taskCompletions[taskId] = [];
  }

  const completedToday = taskCompletions[taskId].includes(todayStr);

  if (completedToday) {
    taskCompletions[taskId] = taskCompletions[taskId].filter(date => date !== todayStr);
  } else {
    taskCompletions[taskId].push(todayStr);
  }

  saveTaskCompletions();
  renderTasks();
  updateStatistics();
}

function isTaskCompletedOn(taskId, dateStr) {
  return taskCompletions[taskId] && taskCompletions[taskId].includes(dateStr);
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveTaskCompletions() {
  localStorage.setItem('taskCompletions', JSON.stringify(taskCompletions));
}

function renderTasks() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <h3>لا توجد مهام</h3>
        <p>اضغط على زر الإضافة أدناه لإنشاء مهمة جديدة</p>
      </div>
    `;
    return;
  }

  tasks.forEach(task => {
    const isCompleted = isTaskCompletedOn(task.id, today());

    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${isCompleted ? 'completed' : ''}`;

    let daysInfo = '';
    if (task.type === 'custom' && task.selectedDays && task.selectedDays.length > 0) {
      const dayNames = {
        'sat': 'السبت',
        'sun': 'الأحد',
        'mon': 'الاثنين',
        'tue': 'الثلاثاء',
        'wed': 'الأربعاء',
        'thu': 'الخميس',
        'fri': 'الجمعة'
      };

      const daysList = task.selectedDays.map(day => dayNames[day]).join('، ');
      daysInfo = `<div><i class="fas fa-calendar-week"></i> ${daysList}</div>`;
    }

    taskElement.innerHTML = `
      <div class="task-color-indicator" style="background-color: ${task.color || '#3a7bd5'}"></div>
      <div class="task-icon" style="background-color: ${task.color || '#3a7bd5'}">
        <i class="${task.icon || 'fas fa-check'}"></i>
      </div>
      <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
      <div class="task-details">
        <div class="task-name">${task.name}</div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        <div class="task-meta">
          <div><i class="far fa-calendar-alt"></i> ${task.startDate} ${task.endDate ? ` إلى ${task.endDate}` : ''}</div>
          ${daysInfo}
          <div class="streak"><i class="fas fa-fire"></i> ${calculateCurrentStreak(task.id)} يوم</div>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon btn-warning edit-task"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-danger delete-task"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;

    const checkbox = taskElement.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
      toggleTaskCompletion(task.id);
    });

    const editButton = taskElement.querySelector('.edit-task');
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showEditTaskForm(task);
    });

    function showConfirmDialog(title, message, onConfirm, onCancel) {
      const dialog = document.createElement('div');
      dialog.className = 'confirm-dialog';

      dialog.innerHTML = `
    <div class="confirm-content">
    <div class="confirm-icon">
    <i class="fas fa-exclamation-triangle"></i>
    </div>
    <div class="confirm-title">${title}</div>
    <div class="confirm-message">${message}</div>
    <div class="confirm-actions">
    <button class="btn-cancel" id="confirm-cancel">إلغاء</button>
    <button class="btn-danger" id="confirm-ok">نعم، متأكد</button>
    </div>
    </div>
    `;

      document.body.appendChild(dialog);

      setTimeout(() => {
        dialog.classList.add('show');
      }, 10);

      const cancelButton = dialog.querySelector('#confirm-cancel');
      const okButton = dialog.querySelector('#confirm-ok');

      cancelButton.addEventListener('click', () => {
        dialog.classList.remove('show');
        setTimeout(() => {
          dialog.remove();
        }, 300);
        if (onCancel) onCancel();
      });

      okButton.addEventListener('click', () => {
        dialog.classList.remove('show');
        setTimeout(() => {
          dialog.remove();
          if (onConfirm) onConfirm();
        }, 300);
      });
    }

    const deleteButton = taskElement.querySelector('.delete-task');
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showConfirmDialog(
        'تأكيد الحذف',
        `هل أنت متأكد من حذف المهمة "${task.name}"؟`,
        () => {
          deleteTask(task.id);
        }
      );
    });

    taskList.appendChild(taskElement);
  });
}

function showEditTaskForm(task) {
  showQuickAdd();

  document.getElementById('task-name').value = task.name;
  document.getElementById('task-description').value = task.description || '';
  document.getElementById('task-type').value = task.type;
  document.getElementById('start-date').value = task.startDate;
  document.getElementById('end-date').value = task.endDate || '';

  if (task.type === 'custom') {
    document.getElementById('weekdays-selector').style.display = 'block';

    const weekdays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
    weekdays.forEach(day => {
      document.getElementById(`day-${day}`).checked = false;
    });

    if (task.selectedDays && task.selectedDays.length > 0) {
      task.selectedDays.forEach(day => {
        const checkbox = document.getElementById(`day-${day}`);
        if (checkbox) checkbox.checked = true;
      });
    }
  } else {
    document.getElementById('weekdays-selector').style.display = 'none';
  }

  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.color === task.color) {
      option.classList.add('selected');
      selectedColor = task.color;
    }
  });

  const iconOptions = document.querySelectorAll('.icon-option');
  iconOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.icon === task.icon) {
      option.classList.add('selected');
      selectedIcon = task.icon;
    }
  });

  const form = document.getElementById('task-form');
  form.dataset.editId = task.id;
}

function showQuickAdd() {
  document.getElementById('quick-add').classList.add('active');
  document.getElementById('overlay').classList.add('active');
  document.getElementById('add-task-button').style.display = 'none';
}

function hideQuickAdd() {
  document.getElementById('quick-add').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('add-task-button').style.display = 'flex';
  const form = document.getElementById('task-form');
  form.reset();
  delete form.dataset.editId;
}

document.getElementById('add-task-button').addEventListener('click', showQuickAdd);
document.getElementById('quick-add-close').addEventListener('click', hideQuickAdd);
document.getElementById('overlay').addEventListener('click', hideQuickAdd);
document.getElementById('cancel-task').addEventListener('click', hideQuickAdd);

document.getElementById('task-type').addEventListener('change', function () {
  const weekdaysSelector = document.getElementById('weekdays-selector');
  if (this.value === 'custom') {
    weekdaysSelector.style.display = 'block';
  } else {
    weekdaysSelector.style.display = 'none';
  }
});

document.getElementById('task-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const taskName = document.getElementById('task-name').value;
  const taskDescription = document.getElementById('task-description').value;
  const taskType = document.getElementById('task-type').value;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;

  let selectedDays = [];
  if (taskType === 'custom') {
    const weekdays = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
    weekdays.forEach(day => {
      if (document.getElementById(`day-${day}`).checked) {
        selectedDays.push(day);
      }
    });
  }

  const task = {
    name: taskName,
    description: taskDescription,
    type: taskType,
    startDate: startDate,
    endDate: endDate,
    color: selectedColor,
    icon: selectedIcon,
    selectedDays: selectedDays
  };

  if (this.dataset.editId) {
    editTask(this.dataset.editId, task);
    delete this.dataset.editId;
    document.getElementById('submit-task').innerHTML = '<i class="fas fa-plus"></i><span>إضافة المهمة</span>';
  } else {
    addTask(task);
  }

  hideQuickAdd();
  this.reset();
});
document.querySelectorAll('.color-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    selectedColor = option.dataset.color;
  });
});

document.querySelectorAll('.icon-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    selectedIcon = option.dataset.icon;
  });
});

function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(tabName).classList.add('active');

  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.currentTarget.classList.add('active');
}

function calculateCurrentStreak(taskId) {
  if (!taskCompletions[taskId]) return 0;
  const dates = taskCompletions[taskId].sort();
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (let i = dates.length - 1; i >= 0; i--) {
    const date = new Date(dates[i]);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function updateStatistics() {
  document.getElementById('total-tasks').textContent = tasks.length;
  let completedTodayCount = 0;
  tasks.forEach(task => {
    if (isTaskCompletedOn(task.id, today())) {
      completedTodayCount++;
    }
  });
  document.getElementById('completed-today').textContent = completedTodayCount;
}

const darkModeToggle = document.getElementById('dark-mode-toggle');

function enableDarkMode() {
  document.body.classList.add('dark-mode');
  darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  localStorage.setItem('darkMode', 'enabled');
}

function disableDarkMode() {
  document.body.classList.remove('dark-mode');
  darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  localStorage.setItem('darkMode', 'disabled');
}

darkModeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark-mode')) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
});

if (localStorage.getItem('darkMode') === 'enabled') {
  enableDarkMode();
}

renderTasks();
updateStatistics();
