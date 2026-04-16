const appointmentsBody = document.getElementById('appointmentsBody');

async function loadAppointments() {
  const res = await fetch('/api/admin/appointments');
  const appointments = await res.json();

  appointmentsBody.innerHTML = '';

  if (!appointments.length) {
    appointmentsBody.innerHTML = `
      <tr>
        <td colspan="5">Ingen bookinger endnu.</td>
      </tr>
    `;
    return;
  }

  appointments.forEach((appointment) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${appointment.appointment_date}</td>
      <td>${appointment.appointment_time}</td>
      <td>${appointment.customer_name}</td>
      <td>${appointment.customer_phone}</td>
      <td>${appointment.service_name}</td>
    `;
    appointmentsBody.appendChild(row);
  });
}

loadAppointments();