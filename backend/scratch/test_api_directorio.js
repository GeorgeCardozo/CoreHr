const test = async () => {
  try {
    // Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: '6e0rgge@gmail.com',
        contrasena: 'Colombia1'
      })
    });
    const loginData = await loginRes.json();
    console.log("Login Response Data:", loginData);
    const token = loginData.token;

    // Fetch directorio
    const dirRes = await fetch('http://localhost:3000/api/empleados/directorio', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const dirData = await dirRes.json();
    console.log("Directorio results:");
    console.log(dirData);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
};

test();
