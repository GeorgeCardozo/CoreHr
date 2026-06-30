const fs = require('fs');
const path = require('path');

const test = async () => {
  try {
    // 1. Login as Employee (George Brando)
    console.log("--- Login ---");
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        correo: 'soporte@gla.edu.co',
        contrasena: 'Colombia1'
      })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Logged in. Token obtained successfully.");

    // 2. Create a dummy image file for testing
    console.log("--- Creating Dummy Image ---");
    const testImagePath = path.join(__dirname, 'test_image.png');
    fs.writeFileSync(testImagePath, 'fake-image-content-for-testing-multer');
    console.log(`Dummy image created at ${testImagePath}`);

    // 3. Upload the image using fetch and FormData
    console.log("--- Uploading Image ---");
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(testImagePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('foto', fileBlob, 'test_image.png');

    const uploadRes = await fetch('http://localhost:3000/api/empleados/perfil/foto', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status ${uploadRes.status}: ${await uploadRes.text()}`);
    }

    const uploadData = await uploadRes.json();
    console.log("Upload response:", uploadData);
    const photoUrl = uploadData.foto_perfil;
    console.log(`Profile photo path returned: ${photoUrl}`);

    // 4. Verify static serving of the uploaded file
    console.log("--- Verifying Static File Serving ---");
    const fileFetchUrl = `http://localhost:3000${photoUrl}`;
    console.log(`Fetching uploaded file from static URL: ${fileFetchUrl}`);
    const fileRes = await fetch(fileFetchUrl);
    
    if (fileRes.ok) {
      const fileContent = await fileRes.text();
      console.log(`Static file fetch success! Content starts with: "${fileContent.substring(0, 30)}..."`);
    } else {
      throw new Error(`Static serving failed with status ${fileRes.status}`);
    }

    // 5. Cleanup test files
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    const uploadedLocalPath = path.join(__dirname, '..', photoUrl);
    if (fs.existsSync(uploadedLocalPath)) {
      console.log(`Local uploaded file exists at: ${uploadedLocalPath}`);
      fs.unlinkSync(uploadedLocalPath);
      console.log("Cleaned up uploaded test file.");
    }

    console.log("--- TEST SUCCESSFUL ---");

  } catch (err) {
    console.error("Test failed:", err);
  }
};

test();
