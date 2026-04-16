const appointmentsList = document.getElementById('appointmentsList');
const filterButtons = document.querySelectorAll('.filter-btn');

let currentFilter = 'all';
let allAppointments = [];

function isToday(dateString) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return dateString === `${year}-${month}-${day}`;
}

function isUpcoming(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  return date >= today;
}

function getFilteredAppointments() {
  if (currentFilter === 'today') {
    return allAppointments.filter((appointment) => isToday(appointment.appointment_date));
  }

  if (currentFilter === 'upcoming') {
    return allAppointments.filter((appointment) => isUpcoming(appointment.appointment_date));
  }

  return allAppointments;
}

function renderAppointments() {
  const appointments = getFilteredAppointments();
  appointmentsList.innerHTML = '';

  if (appointments.length === 0) {
    appointmentsList.innerHTML = `
      <div class="card empty-box">
        Ingen bookinger i denne visning.
      </div>
    `;
    return;
  }

  appointments.forEach((appointment) => {
    const card = document.createElement('div');
    card.className = 'card admin-card';

    card.innerHTML = `
      <div class="admin-left">
        <div class="appointment-badge">${appointment.appointment_date} • ${appointment.appointment_time}</div>
        <h3>${appointment.customer_name}</h3>
        <p><strong>Telefon:</strong> ${appointment.customer_phone}</p>
      </div>

      <div class="admin-middle">
        <p><strong>Behandling:</strong> ${appointment.service_name}</p>
        <p><strong>Pris:</strong> ${appointment.price} kr.</p>
        <p><strong>Booking ID:</strong> ${appointment.id}</p>
      </div>

      <div>
        <button class="danger-btn" data-id="${appointment.id}">Aflys booking</button>
      </div>
    `;

    const deleteBtn = card.querySelector('.danger-btn');
    deleteBtn.addEventListener('click', async () => {
      const confirmed = confirm('Er du sikker på, at du vil aflyse denne booking?');
      if (!confirmed) return;

      const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Kunne ikke aflyse booking.');
        return;
      }

      allAppointments = allAppointments.filter((item) => item.id !== appointment.id);
      renderAppointments();
    });

    appointmentsList.appendChild(card);
  });
}

async function loadAppointments() {
  const res = await fetch('/api/admin/appointments');
  const data = await res.json();
  allAppointments = data;
  renderAppointments();
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.filter;
    renderAppointments();
  });
});

loadAppointments();