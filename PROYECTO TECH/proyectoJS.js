/* ================================================
   CLASE 1: SISTEMA DE AUTENTICACIÓN
   Maneja login, registro, logout y modales
   ================================================ */
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('solarUsers')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.init();
    }

    init() {
        // Comprobar estado inicial
        if (this.currentUser) {
            this.showMainContent();
        } else {
            this.showWelcomeScreen();
        }

        // Listeners de Formularios
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if(loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if(registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Listener Global para Logout (Delegación de eventos)
        document.addEventListener('click', (e) => {
            if(e.target && (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn'))) {
                e.preventDefault();
                this.logout();
            }
        });
    }

    // -- MÉTODOS DE LÓGICA --

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const user = this.users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.safeHideModal('loginModal');
            this.showMainContent();
            e.target.reset();
            alert(`¡Bienvenido, ${user.firstName}!`);
        } else {
            alert('Credenciales incorrectas');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (password !== confirm) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (this.users.find(u => u.email === email)) {
            alert('El correo ya está registrado');
            return;
        }

        const newUser = { firstName, email, password };
        this.users.push(newUser);
        localStorage.setItem('solarUsers', JSON.stringify(this.users));
        
        // Auto-login
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        this.safeHideModal('registerModal');
        this.showMainContent();
        e.target.reset();
        alert('Cuenta creada exitosamente');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showWelcomeScreen();
    }

    // -- MÉTODOS DE INTERFAZ --

    showWelcomeScreen() {
        document.getElementById('welcomeScreen').classList.remove('d-none');
        document.getElementById('mainContent').classList.add('d-none');
    }

    showMainContent() {
        document.getElementById('welcomeScreen').classList.add('d-none');
        document.getElementById('mainContent').classList.remove('d-none');
        if(document.getElementById('userName')) {
            document.getElementById('userName').textContent = this.currentUser.firstName;
        }
    }

    // Función crítica para cerrar modales correctamente con Bootstrap 5
    safeHideModal(modalId) {
        const el = document.getElementById(modalId);
        if (el) {
            const modal = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
            modal.hide();
            // Limpieza forzada del fondo gris por si se queda pegado
            setTimeout(() => {
                document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                document.body.classList.remove('modal-open');
                document.body.style = '';
            }, 200);
        }
    }
}

/* ================================================
   CLASE 2: GESTOR DE DATOS Y CALCULADORA
   Maneja el dataset histórico y los cálculos
   ================================================ */
class EnergyManager {
    constructor() {
        this.energyData = this.generateData();
        this.init();
    }

    init() {
        this.renderTable();
        this.initCalculator();
    }

    // 1. Generar Datos Simulados (1965 - 2022)
    generateData() {
        const data = [];
        for (let year = 1965; year <= 2022; year++) {
            // Simulación matemática de crecimiento
            const diff = year - 1965;
            const solar = year < 1990 ? 0 : Math.round(Math.pow(year - 1990, 2.1) * 0.4);
            const wind = year < 1985 ? 0 : Math.round(Math.pow(year - 1985, 2.2) * 0.3);
            const hydro = 2000 + (diff * 40); 
            const others = 100 + (diff * 5);
            const fossil = 10000 + (diff * 150);

            const totalRenewable = solar + wind + hydro + others;
            const totalGeneration = totalRenewable + fossil;
            const percentage = ((totalRenewable / totalGeneration) * 100).toFixed(2);

            data.push({ year, solar, wind, hydro, others, totalRenewable, totalGeneration, percentage });
        }
        // Retornar invertido (2022 primero)
        return data.reverse();
    }

    // 2. Renderizar Tabla
    renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = this.energyData.map(row => `
            <tr>
                <td class="fw-bold">${row.year}</td>
                <td>${row.solar}</td>
                <td>${row.wind}</td>
                <td>${row.hydro}</td>
                <td>${row.others}</td>
                <td class="text-success fw-bold">${row.totalRenewable}</td>
                <td>${row.totalGeneration}</td>
                <td><span class="badge bg-${row.percentage > 25 ? 'success' : 'warning'}">${row.percentage}%</span></td>
            </tr>
        `).join('');
    }

    // 3. Lógica de la Calculadora
    initCalculator() {
        const form = document.getElementById('calculatorForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const userKwh = parseFloat(document.getElementById('userConsumption').value);
            
            if (isNaN(userKwh) || userKwh <= 0) return;

            // Usar datos de 2022 (índice 0)
            const lastData = this.energyData[0];
            const proportion = lastData.totalRenewable / lastData.totalGeneration;
            const userRenewable = (userKwh * proportion).toFixed(2);

            // Mostrar resultados
            document.getElementById('resultCard').classList.remove('d-none');
            document.getElementById('globalCapacityVal').textContent = lastData.totalRenewable + " TWh";
            document.getElementById('globalPercentVal').textContent = lastData.percentage + "%";
            document.getElementById('userInputVal').textContent = userKwh;
            document.getElementById('userRenewableVal').textContent = userRenewable;
        });
    }
}

// INICIALIZACIÓN GLOBAL
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
    new EnergyManager();
});