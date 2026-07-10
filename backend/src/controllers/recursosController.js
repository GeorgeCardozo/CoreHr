const db = require('../config/db');

// Base de conocimiento local sobre legislación laboral de Colombia (CST)
const baseConocimiento = [
  {
    keywords: ['hora', 'extra', 'recargo', 'nocturno', 'dominical', 'festivo', 'jornada'],
    respuesta: `### Horas Extras y Recargos en Colombia (CST Art. 159-168)

En Colombia, la jornada ordinaria es de **42 horas semanales** (Ley 2101 de 2021). Los recargos se calculan sobre el valor de la hora ordinaria ordinaria (HO):

1. **Hora Extra Diurna (6:00 AM - 9:00 PM)**: Recargo del **25%**. 
   * *Fórmula*: HO × 1.25
2. **Hora Extra Nocturna (9:00 PM - 6:00 AM)**: Recargo del **75%**.
   * *Fórmula*: HO × 1.75
3. **Recargo Nocturno ordinario** (jornada ordinaria en la noche): Recargo del **35%**.
   * *Fórmula*: HO × 1.35
4. **Recargo Dominical/Festivo ordinario**: Recargo del **75%** por trabajar domingos o festivos.
   * *Fórmula*: HO × 1.75
5. **Hora Extra Diurna Dominical/Festiva**: Recargo del **100%** (75% del festivo + 25% extra).
   * *Fórmula*: HO × 2.00
6. **Hora Extra Nocturna Dominical/Festiva**: Recargo del **150%** (75% del festivo + 75% extra).
   * *Fórmula*: HO × 2.50

*Nota: El límite legal de horas extras es de **2 horas diarias** y **12 horas semanales**.*`
  },
  {
    keywords: ['cesantia', 'cesantias', 'interes', 'intereses'],
    respuesta: `### Cesantías e Intereses sobre Cesantías en Colombia

Las cesantías son una prestación social obligatoria destinada a proteger al trabajador cuando quede desempleado o para inversión en vivienda/educación:

1. **Cesantías**: 
   * **Monto**: Equivalen a **un mes de salario por cada año trabajado** (o proporcional al tiempo laborado).
   * **Consignación**: El empleador debe liquidarlas a diciembre 31 de cada año y consignarlas en el fondo de cesantías elegido por el empleado a más tardar el **14 de febrero** del año siguiente.
   * *Fórmula*: \`Cesantías = (Salario Base × Días Trabajados) / 360\` *(incluye auxilio de transporte)*.

2. **Intereses sobre Cesantías**:
   * **Monto**: Equivalen al **12% anual** sobre el saldo acumulado de cesantías a diciembre 31 (o proporcional).
   * **Pago**: Se pagan directamente al empleado a más tardar el **31 de enero**.
   * *Fórmula*: \`Intereses = (Cesantías acumuladas × Días Trabajados × 0.12) / 360\`.`
  },
  {
    keywords: ['prima', 'servicios', 'primas'],
    respuesta: `### Prima de Servicios en Colombia (CST Art. 306)

La prima de servicios es una prestación social legal que corresponde a la participación del empleado en las utilidades de la empresa:

* **Monto**: Equivale a **un mes de salario por cada año de trabajo**, dividido en dos pagos quincenales del 50%.
* **Fechas de Pago**:
  1. **Primera mitad**: Se paga a más tardar el **30 de junio**.
  2. **Segunda mitad**: Se paga a más tardar el **20 de diciembre**.
* **Liquidación Proporcional**: Si el contrato termina antes de las fechas límite, la prima se liquida y paga proporcionalmente al tiempo laborado en el semestre.
* *Fórmula*: \`Prima = (Salario Base × Días Trabajados en el Semestre) / 360\` *(incluye auxilio de transporte)*.`
  },
  {
    keywords: ['vacacion', 'vacaciones', 'descanso'],
    respuesta: `### Vacaciones en Colombia (CST Art. 186)

Las vacaciones son un derecho de descanso remunerado:

* **Derecho**: El empleado tiene derecho a **15 días hábiles consecutivos de vacaciones remuneradas** por cada año de servicios.
* **Liquidación**: Se pagan con base en el último salario básico devengado por el trabajador (excluyendo auxilio de transporte y horas extras ordinarias).
* **Compensación en dinero**: Solo se permite compensar en dinero hasta el 50% de las vacaciones por acuerdo de las partes, el resto debe ser disfrutado en descanso físico.
* *Fórmula*: \`Vacaciones = (Salario Básico × Días Trabajados) / 720\`.`
  },
  {
    keywords: ['prueba', 'periodo', 'ensayo'],
    respuesta: `### Periodo de Prueba en Colombia (CST Art. 76-80)

El periodo de prueba es la etapa inicial del contrato laboral que busca evaluar la aptitud del trabajador:

* **Escrito**: Debe pactarse **siempre por escrito** en el contrato de trabajo. Si no se estipula por escrito, no existe periodo de prueba legal.
* **Límite Máximo**: No puede exceder los **2 meses** (60 días).
* **Contratos a Término Fijo menores a un año**: No puede exceder de la **quinta parte (1/5)** de la duración pactada. 
  * *Ejemplo*: En un contrato de 5 meses, el periodo de prueba máximo es de 1 mes (30 días).
* **Derechos**: Durante este periodo el trabajador goza de todas las prestaciones sociales y afiliación a seguridad social.
* **Terminación**: Cualquiera de las partes puede dar por terminado el contrato de manera unilateral y sin preaviso en este lapso sin lugar a indemnizaciones.`
  },
  {
    keywords: ['incapacidad', 'enfermedad', 'eps', 'arl', 'accidente', 'salud'],
    respuesta: `### Incapacidades Laborales en Colombia

El pago de las incapacidades depende del origen de la contingencia (común o laboral):

1. **Incapacidad por Enfermedad General / Origen Común**:
   * **Primeros 2 días**: A cargo del **empleador** (se paga al **66.67%** del salario).
   * **Día 3 al 180**: A cargo de la **EPS** (se paga al **66.67%** hasta el día 90 y al **50%** del día 91 al 180).
   * **Día 181 en adelante**: A cargo del **Fondo de Pensiones** (AFP).
   * *Nota: Ninguna incapacidad puede ser inferior al Salario Mínimo Mensual Legal Vigente (SMLV) liquidado por días.*

2. **Incapacidad por Accidente o Enfermedad Laboral (Origen Profesional)**:
   * **Primer día**: A cargo de la **ARL** (se paga al **100%** del salario base de cotización, liquidado desde el día siguiente al accidente).
   * **Todo el periodo**: Asumido en su totalidad por la Administradora de Riesgos Laborales (ARL).`
  },
  {
    keywords: ['liquidacion', 'indemnizacion', 'despido', 'justa', 'injusta', 'termina'],
    respuesta: `### Liquidación de Contrato e Indemnizaciones en Colombia

Al finalizar un contrato laboral, el empleador debe pagar la liquidación de prestaciones sociales a más tardar en el último día de labores:

1. **Conceptos de Liquidación**:
   * Salarios causados y no pagados.
   * Primas de servicios proporcionales.
   * Cesantías e intereses proporcionales.
   * Vacaciones causadas y no disfrutadas.

2. **Indemnización por Despido sin Justa Causa (CST Art. 64)**:
   * **Contrato a Término Fijo**: Equivale al **salario correspondiente al tiempo que falte** para vencer el plazo del contrato.
   * **Contrato Indefinido (para salarios menores a 10 mínimos)**:
     * Si lleva **menos de un año**: 30 días de salario.
     * Si lleva **más de un año**: 30 días por el primer año, más 20 días adicionales por cada año siguiente o fracción proporcional.`
  }
];

// Controlador de chat con Inteligencia Artificial
exports.procesarChatRecursos = async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje || mensaje.trim() === '') {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      // Uso de Gemini API vía REST Nativo (compatible con cualquier versión de Node.js v18+)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const promptSystem = `Eres un asistente inteligente de Operaciones de Recursos Humanos de CoreRRHH. 
Tu especialidad es la legislación laboral colombiana (Código Sustantivo del Trabajo - CST), las prestaciones sociales, el cálculo de nómina y los convenios corporativos. 
Debes responder de manera sumamente clara, profesional, empática y estructurada utilizando formato Markdown. 
Si la pregunta no está relacionada con el ámbito de Recursos Humanos o leyes laborales colombianas, amablemente indica que tu propósito es asesorar sobre temas de personal y nómina.`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: mensaje }]
          }],
          systemInstruction: {
            parts: [{ text: promptSystem }]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API devolvió código: ${response.status}`);
      }

      const responseData = await response.json();
      const respuestaTexto = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (respuestaTexto) {
        return res.status(200).json({
          respuesta: respuestaTexto,
          fuente: 'Gemini AI'
        });
      }
    } catch (apiError) {
      console.error('Error al invocar la API de Gemini, aplicando fallback local:', apiError);
    }
  }

  // Fallback: Motor local de búsqueda de palabras clave
  const msgClean = mensaje.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Buscar coincidencia en base de conocimiento
  let respuestaEncontrada = null;
  for (const item of baseConocimiento) {
    const coincide = item.keywords.some(keyword => msgClean.includes(keyword));
    if (coincide) {
      respuestaEncontrada = item.respuesta;
      break;
    }
  }

  if (respuestaEncontrada) {
    return res.status(200).json({
      respuesta: respuestaEncontrada,
      fuente: 'Base de Conocimientos Local (CST Colombia)'
    });
  }

  // Respuesta por defecto si no coincide ninguna palabra clave
  return res.status(200).json({
    respuesta: `Hola. Como asistente de Recursos Humanos de **CoreRRHH**, puedo asesorarte sobre temas clave de la legislación laboral de Colombia (CST) y trámites internos.
    
Para darte información detallada, por favor intenta preguntar sobre alguno de estos temas:
* 🕒 **Horas extras y recargos** (nocturnos, dominicales)
* 💰 **Prestaciones sociales** (primas, cesantías, intereses)
* 🌴 **Vacaciones** (días de descanso y liquidación)
* 📋 **Periodo de prueba** (límites legales y contratos)
* 🏥 **Incapacidades** (enfermedad común, origen laboral)
* 💼 **Liquidaciones e indemnizaciones** (despidos, cálculo)
    
*(Nota: Para habilitar respuestas abiertas con Inteligencia Artificial libre, configure la clave 'GEMINI_API_KEY' en el archivo .env del servidor).*`,
    fuente: 'Base de Conocimientos Local (CST Colombia)'
  });
};
