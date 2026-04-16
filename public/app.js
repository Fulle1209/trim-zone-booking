const servicesContainer = document.getElementById('services');
const selectedServiceEl = document.getElementById('selectedService');
const slotsContainer = document.getElementById('slots');
const bookBtn = document.getElementById('bookBtn');
const messageEl = document.getElementById('message');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const dateScroller = document.getElementById('dateScroller');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');

let selectedService = null;
let selectedSlot = null;
let selectedDate = null;
let weekOffset = 0;

const dayNames = ['søn.', 'man.', 'tir.', 'ons.', 'tor.', 'fre.', 'lør.'];
const monthNames = [
  'jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.',
  'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'
];

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function renderWeekDates() {
  dateScroller.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = addDays(today, weekOffset * 7);

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startDate, i);
    const currentDateString = formatDateForApi(currentDate);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'date-card';

    if (selectedDate === currentDateString) {
      btn.classList.add('active');
    }

    btn.innerHTML = `
      <div class="date-day">${dayNames[currentDate.getDay()]}</div>
      <div class="date-number">${currentDate.getDate()}</div>
      <div class="date-month">${monthNames[currentDate.getMonth()]}</div>
    `;

    btn.addEventListener('click', async () => {
      selectedDate = currentDateString;
      selectedSlot = null;
      renderWeekDates();
      await loadSlots();
    });

    dateScroller.appendChild(btn);
  }
}

async function loadServices() {
  const res = await fetch('/api/services');
  const services = await res.json();

  servicesContainer.innerHTML = '';

  services.forEach((service) => {
    const card = document.createElement('div');
    card.className = 'service-card';

    card.innerHTML = `
      <div class="service-info">
        <h3>${service.name}</h3>
        <p>${service.description}</p>
        <div class="service-meta">${service.price} kr. • ${service.duration} min</div>
      </div>
      <button class="select-btn">Vælg</button>
    `;

    card.querySelector('button').addEventListener('click', async () => {
      document.querySelectorAll('.service-card').forEach((item) => {
        item.classList.remove('active-service');
      });

      card.classList.add('active-service');

      selectedService = service;
      selectedSlot = null;
      selectedServiceEl.textContent = `${service.name} • ${service.price} kr. • ${service.duration} min`;
      slotsContainer.innerHTML = '';

      if (!selectedDate) {
        const today = new Date();
        selectedDate = formatDateForApi(today);
        renderWeekDates();
      }

      await loadSlots();
    });

    servicesContainer.appendChild(card);
  });
}

async function loadSlots() {
  if (!selectedService || !selectedDate) return;

  const res = await fetch(`/api/available-slots?date=${selectedDate}&serviceId=${selectedService.id}`);
  const slots = await res.json();

  slotsContainer.innerHTML = '';
  selectedSlot = null;

  if (slots.length === 0) {
    slotsContainer.innerHTML = '<p class="muted">Ingen ledige tider denne dag.</p>';
    return;
  }

  slots.forEach((slot) => {
    const btn = document.createElement('button');
    btn.className = 'slot-btn';
    btn.textContent = slot;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSlot = slot;
    });

    slotsContainer.appendChild(btn);
  });
}

prevWeekBtn.addEventListener('click', async () => {
  if (weekOffset === 0) return;
  weekOffset -= 1;
  renderWeekDates();
});

nextWeekBtn.addEventListener('click', async () => {
  weekOffset += 1;
  renderWeekDates();
});

bookBtn.addEventListener('click', async () => {
  messageEl.textContent = '';

  if (!selectedService) {
    messageEl.textContent = 'Vælg først en behandling.';
    return;
  }

  if (!selectedDate) {
    messageEl.textContent = 'Vælg en dag.';
    return;
  }

  if (!selectedSlot) {
    messageEl.textContent = 'Vælg en tid.';
    return;
  }

  if (!nameInput.value.trim() || !phoneInput.value.trim()) {
    messageEl.textContent = 'Udfyld navn og telefonnummer.';
    return;
  }

  const res = await fetch('/api/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      serviceId: selectedService.id,
      customerName: nameInput.value.trim(),
      customerPhone: phoneInput.value.trim(),
      appointmentDate: selectedDate,
      appointmentTime: selectedSlot
    })
  });

  const data = await res.json();

  if (!res.ok) {
    messageEl.textContent = data.error || 'Noget gik galt.';
    return;
  }

  messageEl.textContent = 'Din booking er gennemført! Du modtager en SMS.';
  nameInput.value = '';
  phoneInput.value = '';
  selectedSlot = null;
  await loadSlots();
});

selectedDate = formatDateForApi(new Date());
renderWeekDates();
loadServices();