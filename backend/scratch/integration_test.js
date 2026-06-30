const assert = require('assert');

const BASE_URL = 'http://localhost:3000/api';

const runTests = async () => {
  console.log('=== STARTING INTEGRATION TESTS ===');
  
  // 1. Admin login
  console.log('\nStep 1: Admin Login...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: '6e0rgge@gmail.com',
      contrasena: '1001089215ge'
    })
  });
  
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;
  console.log('Admin login successful. Token acquired.');

  // 2. Create standard employee with all fields
  console.log('\nStep 2: Creating new employee with all new fields...');
  const newEmployeePayload = {
    correo: 'test_employee@gla.edu.co',
    contrasena: 'Colombia1',
    rol_id: 2,
    documento_identidad: '99988877',
    nombres: 'Test',
    apellidos: 'Employee',
    telefono: '3001234567',
    fecha_ingreso: '2026-06-01',
    habilidades: ['React', 'Node.js', 'PostgreSQL'],
    fecha_info_personal: '2026-06-01',
    fecha_soportes: '2026-06-02',
    fecha_seguridad: '2026-06-03',
    superior_inmediato: 'Jorge Gómez',
    departamento: 'Académico - STEM'
  };

  const createRes = await fetch(`${BASE_URL}/empleados`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(newEmployeePayload)
  });

  assert.strictEqual(createRes.status, 201, 'Employee creation should succeed');
  const createData = await createRes.json();
  const createdEmployee = createData.empleado;
  console.log('Employee created successfully:', createdEmployee);

  // Validate fields in the creation response
  assert.strictEqual(createdEmployee.documento_identidad, '99988877');
  assert.strictEqual(createdEmployee.nombres, 'Test');
  assert.strictEqual(createdEmployee.apellidos, 'Employee');
  assert.strictEqual(createdEmployee.telefono, '3001234567');
  assert.deepStrictEqual(createdEmployee.habilidades, ['React', 'Node.js', 'PostgreSQL']);
  assert.strictEqual(createdEmployee.superior_inmediato, 'Jorge Gómez');
  assert.strictEqual(createdEmployee.departamento, 'Académico - STEM');
  
  const empId = createdEmployee.id;

  // 3. Admin updates employee fields
  console.log('\nStep 3: Admin updates employee fields...');
  const updatedPayload = {
    correo: 'test_employee_updated@gla.edu.co',
    documento_identidad: '99988877',
    nombres: 'Test Updated',
    apellidos: 'Employee Updated',
    telefono: '3009999999',
    fecha_ingreso: '2026-06-01',
    habilidades: ['React', 'Node.js', 'PostgreSQL', 'Express'],
    fecha_info_personal: '2026-06-10',
    fecha_soportes: '2026-06-11',
    fecha_seguridad: '2026-06-12',
    superior_inmediato: 'Marta Rivera',
    departamento: 'Administrativo'
  };

  const updateRes = await fetch(`${BASE_URL}/empleados/${empId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(updatedPayload)
  });

  assert.strictEqual(updateRes.status, 200, 'Employee update should succeed');
  const updateData = await updateRes.json();
  const updatedEmployee = updateData.empleado;
  console.log('Employee updated successfully by Admin:', updatedEmployee);

  // Validate updated fields
  assert.strictEqual(updatedEmployee.correo, 'test_employee_updated@gla.edu.co');
  assert.strictEqual(updatedEmployee.nombres, 'Test Updated');
  assert.strictEqual(updatedEmployee.apellidos, 'Employee Updated');
  assert.strictEqual(updatedEmployee.telefono, '3009999999');
  assert.deepStrictEqual(updatedEmployee.habilidades, ['React', 'Node.js', 'PostgreSQL', 'Express']);
  assert.strictEqual(updatedEmployee.superior_inmediato, 'Marta Rivera');
  assert.strictEqual(updatedEmployee.departamento, 'Administrativo');

  // 4. Employee logs in
  console.log('\nStep 4: Logging in as the new employee (with updated email)...');
  const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: 'test_employee_updated@gla.edu.co',
      contrasena: 'Colombia1'
    })
  });

  assert.strictEqual(empLoginRes.status, 200, 'Employee login should succeed');
  const empLoginData = await empLoginRes.json();
  const empToken = empLoginData.token;
  console.log('Employee login successful. Token acquired.');

  // 5. Employee fetches profile
  console.log('\nStep 5: Employee retrieves own profile...');
  const profileRes = await fetch(`${BASE_URL}/empleados/perfil`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empToken}` }
  });

  assert.strictEqual(profileRes.status, 200, 'Profile fetch should succeed');
  const profileData = await profileRes.json();
  const profile = profileData.perfil;
  console.log('Employee profile retrieved:', profile);

  assert.strictEqual(profile.nombres, 'Test Updated');
  assert.strictEqual(profile.superior_inmediato, 'Marta Rivera');
  assert.strictEqual(profile.departamento, 'Administrativo');
  assert.deepStrictEqual(profile.habilidades, ['React', 'Node.js', 'PostgreSQL', 'Express']);

  // 6. Employee updates their own phone number (using new verificarAdminOPropioEmpleado route)
  console.log('\nStep 6: Employee updates their contact phone...');
  const selfUpdatePayload = {
    correo: profile.correo,
    documento_identidad: profile.documento_identidad,
    nombres: profile.nombres,
    apellidos: profile.apellidos,
    telefono: '3119876543', // updated phone
    fecha_ingreso: profile.fecha_ingreso,
    habilidades: profile.habilidades,
    fecha_info_personal: profile.fecha_info_personal,
    fecha_soportes: profile.fecha_soportes,
    fecha_seguridad: profile.fecha_seguridad,
    superior_inmediato: profile.superior_inmediato, // preserving superior_inmediato
    departamento: profile.departamento // preserving departamento
  };

  const selfUpdateRes = await fetch(`${BASE_URL}/empleados/${empId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empToken}`
    },
    body: JSON.stringify(selfUpdatePayload)
  });

  assert.strictEqual(selfUpdateRes.status, 200, 'Employee self update should succeed');
  const selfUpdateData = await selfUpdateRes.json();
  const selfUpdatedEmployee = selfUpdateData.empleado;
  console.log('Employee self-updated profile:', selfUpdatedEmployee);

  // Validate that phone was updated, and administrative fields (superior_inmediato, habilidades, dates) were preserved
  assert.strictEqual(selfUpdatedEmployee.telefono, '3119876543');
  assert.strictEqual(selfUpdatedEmployee.superior_inmediato, 'Marta Rivera');
  assert.strictEqual(selfUpdatedEmployee.departamento, 'Administrativo');
  assert.deepStrictEqual(selfUpdatedEmployee.habilidades, ['React', 'Node.js', 'PostgreSQL', 'Express']);
  assert.strictEqual(selfUpdatedEmployee.fecha_info_personal.substring(0, 10), '2026-06-10');

  // 7. Test unauthorized access (another employee updates this profile)
  console.log('\nStep 7: Verifying unauthorized update protection...');
  // soporte@gla.edu.co is another employee
  const anotherEmpLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      correo: 'soporte@gla.edu.co',
      contrasena: 'Colombia1'
    })
  });
  const anotherEmpLoginData = await anotherEmpLoginRes.json();
  const anotherEmpToken = anotherEmpLoginData.token;

  const maliciousUpdateRes = await fetch(`${BASE_URL}/empleados/${empId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anotherEmpToken}`
    },
    body: JSON.stringify(selfUpdatePayload)
  });

  assert.strictEqual(maliciousUpdateRes.status, 403, 'Malicious update should be rejected with 403');
  console.log('Unauthorized access successfully blocked.');

  // 8. Test Laboral Certificate PDF generation (needs a contract first)
  console.log('\nStep 8: Testing PDF certificate generation...');
  
  // Let's create a contract for the test employee first (using Admin token)
  const contractPayload = {
    empleado_id: empId,
    cargo: 'Docente de Matemáticas',
    tipo_contrato: 'Término Fijo',
    salario: 3500000,
    fecha_inicio: '2026-06-01',
    estado: 'Activo'
  };

  const createContractRes = await fetch(`${BASE_URL}/contratos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(contractPayload)
  });
  
  assert.strictEqual(createContractRes.status, 201, 'Contract creation should succeed');
  console.log('Contract created for test employee.');

  // Generate certificate
  const certRes = await fetch(`${BASE_URL}/empleados/certificado`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empToken}` }
  });

  assert.strictEqual(certRes.status, 200, 'PDF generation should succeed');
  assert.strictEqual(certRes.headers.get('content-type'), 'application/pdf', 'Response should be a PDF file');
  console.log('Laboral certificate successfully generated in PDF format.');

  // 9. Cleanup
  console.log('\nStep 9: Cleaning up test data...');
  // We can't delete directly if there is a foreign key from contracts, let's see if delete cascade or if we need to clean up contracts first.
  // Wait, let's look at employeeController.js delete logic: it deletes employee and user. But does it cascade contracts?
  // Let's delete the employee via admin.
  const deleteRes = await fetch(`${BASE_URL}/empleados/${empId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('Delete response status:', deleteRes.status);
  
  console.log('\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===');
};

runTests().catch(err => {
  console.error('\n!!! TEST FAILED !!!');
  console.error(err);
  process.exit(1);
});
