# CircuitDiagIA

Copia independiente para Vercel: React + Vite, OpenAI en funciones de servidor y un proyecto externo de Supabase para cuentas y registros privados. El proyecto original no se modifica ni se utiliza como servicio de esta copia.

## Incluido
- Acceso con correo y contraseña, registro con confirmación por correo, cierre de sesión y recuperación de contraseña.
- Perfil profesional: nombre, foto, profesión, empresa/laboratorio, especialización, ciudad/país y biografía. Los campos son opcionales, editables y no son credenciales profesionales verificadas.
- Historial privado con foto, resultado, mediciones y fecha; abrir y eliminar informes.
- Esquemas guardados para informes ya registrados, detección YOLO local, chat con fotos, PDF y guía Arduino Nano.
- Icono de pestaña derivado del mismo CircuitBoard usado junto al nombre; sin integración ni marcas de la plataforma original.
- Se conserva la demostración original, claramente identificada y sin guardarla como un diagnóstico real.

## 1. Crear TU proyecto externo de Supabase
Crea un proyecto nuevo en tu propia cuenta. No reutilices el servicio del original.
1. Abre SQL Editor y ejecuta **supabase/setup.sql** una sola vez sobre el proyecto nuevo.
2. Se crean `profiles`, `diagnostics`, `schematics`, `ai_usage` y dos espacios privados de archivos: `avatars` y `diagnostic-images`.
3. Las políticas limitan cada usuario a sus registros y archivos. No hay cuentas administradoras ni privilegios en datos de perfil.
4. En Authentication, activa correo/contraseña y mantén la confirmación por correo habilitada.
5. Configura un proveedor SMTP para correos de registro y recuperación en producción; prueba su entrega antes de abrir el registro público.
6. En URL Configuration pon como Site URL tu dirección HTTPS de Vercel y añade las URLs exactas de esa dirección y `/reset-password` a la lista de redirecciones permitidas. Para pruebas locales añade también las direcciones locales utilizadas.
7. Copia la Project URL y la clave **publishable/anon**, nunca la clave service_role.

## 2. Preparar Vercel
Importa el contenido de esta carpeta como un proyecto nuevo (por ejemplo, mediante tu repositorio Git). Selecciona Vite y Node.js 22. Comando: `npm run build`. Salida: `dist`.

Configura estas variables en Vercel, en los entornos que vayas a usar:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | Project URL de TU proyecto externo |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable/anon key de TU proyecto externo |
| `SUPABASE_URL` | La misma Project URL; la utiliza el servidor |
| `SUPABASE_PUBLISHABLE_KEY` | La misma publishable/anon key; la utiliza el servidor |
| `OPENAI_API_KEY` | Tu clave privada de OpenAI, solo en Vercel |
| `OPENAI_MODEL` | `gpt-4.1` por defecto; debe aceptar fotos y herramientas |

**Nunca uses un nombre `VITE_` para la clave OpenAI. Nunca subas un archivo con claves a Git.** Los archivos `.env.example` solo tienen campos vacíos; no contienen claves. Las cuentas y correos de tu aplicación actual no se copian: los usuarios deben registrarse en el servicio nuevo.

OpenAI requiere saldo y acceso al modelo. El diagrama como imagen del chat utiliza Responses + image_generation y puede tener coste adicional. Los esquemas SVG detallados/por bloques utilizan Chat Completions con herramientas.

`vercel.json` incluye la resolución de páginas y una duración máxima de 120 segundos para la función. Revisa que tu plan permita ese tiempo; imágenes complejas pueden excederlo. El detector se ejecuta en el navegador, no consume OpenAI. El archivo ONNX es de unos 45 MB: si usas GitHub, súbelo mediante Git local, no su cargador web de archivos de 25 MB.

## 3. Primera comprobación real
1. Despliega y abre tu URL de Vercel.
2. Crea una cuenta y confirma el correo. Inicia sesión.
3. Completa y guarda el perfil; recarga la página para comprobar que persiste.
4. Carga una foto JPEG/PNG/WebP de hasta 2,5 MB y espera el diagnóstico.
5. Pulsa **Enregistrer le diagnostic**. Abre **Historique**, recarga y vuelve a abrirlo: debe conservar foto y lecturas.
6. Una vez guardado el informe, genera un esquema. Se guarda asociado al informe y vuelve a cargarse al abrirlo.
7. Crea una segunda cuenta: no debe ver los informes ni archivos de la primera.
8. Prueba recuperación de contraseña mediante el correo real.

Las fotografías grandes se rechazan antes de analizar porque Vercel limita el tamaño del cuerpo de las funciones; no se comprimen automáticamente para no perder detalles de componentes. Hay un límite de protección de **50 solicitudes de IA por usuario y día UTC**, configurable en la función SQL `consume_ai_request`; incluye intentos fallidos y generación de diagramas. No es un plan comercial ni una garantía de coste. La página de historial carga 20 informes por página.

## Arduino
Usa `public/firmware/circuit_diagnostic.ino`, Nano clásica ATmega328P, USB, 115200 baudios. Solo A0 habilitado por defecto, voltaje DC únicamente. El firmware no está preparado para UNO con A6/A7 inexistentes ni ESP32. No mide resistencias, capacitores, diodos o continuidad. Verifica primero con multímetro y fuente segura; nunca conectes una tarjeta desconocida o un punto superior a la referencia/5 V. Cierra el monitor serie antes de conectar CircuitDiagIA.

## Desarrollo y pruebas
- `npm install`
- `npm run dev` muestra el cliente; no emula funciones Vercel.
- `npx vercel dev` permite probar cliente y funciones con las variables configuradas localmente (no las publiques).
- `npm test` ejecuta 31 pruebas sin llamar a OpenAI.
- `tests/privacy.sql` prueba privacidad y cuotas con dos identidades ficticias en una base **desechable**, tras preparar los esquemas de auth/storage. No ejecutes esta prueba sobre producción.

## Verificación realizada y pendientes
La copia compila; las comprobaciones de tipos y 31 pruebas pasan. El SQL completo se aplicó a un PostgreSQL temporal aislado con sustitutos de auth/storage y pasó las pruebas de separación entre dos usuarios, vinculación de esquemas y cuota. Esto no verifica las configuraciones alojadas de Supabase ni su correo.

No se ha desplegado en tu Vercel, creado tu proyecto externo ni llamado OpenAI con tu clave. El acceso real, guardado/lectura en TU servicio y mediciones USB físicas deben verificarse siguiendo la sección 3. No se incluyen claves privadas, usuarios reales ni datos del servicio original.

El diagnóstico visual es provisional; YOLO puede omitir/confundir componentes. El esquema es inferido, no el original del fabricante. Confirma cualquier avería con mediciones apropiadas.

## Licencias
Se incluyen recursos del modelo PCB (github.com/wangshnegqi/pcb-component-detection-dataset-yolo, atribución CC BY 4.0 indicada en el proyecto original) y ONNX Runtime. Conserva las licencias de dependencias instaladas. El entrenamiento/exportación utiliza el ecosistema Ultralytics: revisa sus condiciones AGPL/comerciales y las del checkpoint antes de distribuir comercialmente; la atribución del dataset no sustituye las licencias del software/modelo. No se ha efectuado una auditoría legal de esas licencias.
