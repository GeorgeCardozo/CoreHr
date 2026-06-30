const test = async () => {
  try {
    // 1. Login as Admin (Jorge Gómez, user_id 1)
    console.log("--- TEST 1: Login as Admin ---");
    const adminLoginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: '6e0rgge@gmail.com',
        contrasena: 'Colombia1'
      })
    });
    const adminLogin = await adminLoginRes.json();
    const adminToken = adminLogin.token;
    console.log("Logged in as Admin. Token obtained.");

    // Admin fetches employee 3 profile (George Brando)
    const adminGetEmp3Res = await fetch('http://localhost:3000/api/empleados/perfil/3', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminGetEmp3 = await adminGetEmp3Res.json();
    console.log("Admin views Employee 3 (Uncensored):");
    console.log("  Documento Identidad:", adminGetEmp3.perfil.documento_identidad);
    console.log("  Telefono:", adminGetEmp3.perfil.telefono);
    console.log("  Tipo Contrato:", adminGetEmp3.perfil.tipo_contrato);

    // 2. Login as Employee (George Brando, user_id 3, employee_id 3)
    console.log("\n--- TEST 2: Login as Employee (George Brando) ---");
    const empLoginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: 'soporte@gla.edu.co',
        contrasena: 'Colombia1'
      })
    });
    const empLogin = await empLoginRes.json();
    const empToken = empLogin.token;
    console.log("Logged in as Employee. Token obtained.");

    // Employee 3 views their own profile
    const empGetOwnRes = await fetch('http://localhost:3000/api/empleados/perfil', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    const empGetOwn = await empGetOwnRes.json();
    console.log("Employee 3 views their own profile (Uncensored):");
    console.log("  Documento Identidad:", empGetOwn.perfil.documento_identidad);
    console.log("  Telefono:", empGetOwn.perfil.telefono);
    console.log("  Tipo Contrato:", empGetOwn.perfil.tipo_contrato);

    // Employee 3 views Employee 1 profile (Jorge Gómez, employee_id 1)
    const empGetOtherRes = await fetch('http://localhost:3000/api/empleados/perfil/1', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    const empGetOther = await empGetOtherRes.json();
    console.log("Employee 3 views Employee 1 profile (Censored):");
    console.log("  Documento Identidad:", empGetOther.perfil.documento_identidad);
    console.log("  Telefono:", empGetOther.perfil.telefono);
    console.log("  Tipo Contrato:", empGetOther.perfil.tipo_contrato);

  } catch (err) {
    console.error("Test failed:", err.message);
  }
};

test();
