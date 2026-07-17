# Excel de referencia de nómina

Documento de referencia para que el **panel empresa** descargue el **mismo Excel** que el superadmin (Control de pagos → Excel nómina), con la misma estructura, columnas, reglas de cálculo y estilo.

---

## 1. Qué es este archivo

Es un `.xlsx` de **referencia operativa** para el área de nómina de la empresa.

Responde a:

1. ¿Cuánto descontar este mes a cada empleado?
2. ¿Cuánto se le transfirió neto al empleado (después de la comisión Cerebiia)?
3. ¿Cuánto cuesta el servicio (comisión) por esos adelantos?
4. ¿Detalle cuota por cuota de lo que cae en el periodo?

**No es** la factura/cuenta de cobro formal; es el archivo de trabajo para descuentos en nómina.

---

## 2. Nombre del archivo

```
referencia-nomina-{empresa_nombre}-{periodo}-{YYYYMMDD}.xlsx
```

Ejemplo: `referencia-nomina-ACME_SAS-2026-07-20260717.xlsx`

- `empresa_nombre`: sanitizado (solo letras/números/`_`, máx. 40 chars).
- `periodo`: `YYYY-MM` (mes de corte de nómina).
- Último tramo: fecha del día de descarga.

---

## 3. Origen de datos (API)

### Superadmin (actual)

```
GET /admin/referencia-nomina/?empresa_id={uuid}&periodo={YYYY-MM}
```

Permiso: `IsSuperAdmin`.

### Panel empresa (recomendado)

Misma lógica de negocio, pero autenticado como admin de empresa:

```
GET /empresa/referencia-nomina/?periodo={YYYY-MM}
```

- `empresa_id` se toma del token / sesión (no se envía por query).
- Misma respuesta JSON (`ReferenciaNominaApi`).
- El frontend empresa debe reutilizar el **mismo generador** de Excel:

  `src/lib/export-referencia-nomina-excel.ts` → `exportReferenciaNominaExcel(data)`

Backend: reutilizar el use case `ObtenerReferenciaNominaUseCase` (no duplicar reglas).

---

## 4. Criterio de inclusión (muy importante)

Solo entran cuotas que cumplan **todo** esto:

| Condición | Detalle |
|-----------|---------|
| Empresa | `solicitud.empresa_id` = empresa del reporte |
| Estado solicitud | `pagado` |
| Fecha de corte | `cuota.fecha_corte` dentro del mes del `periodo` (día 1 → último día del mes) |

**Implicaciones:**

- Un adelanto de 2 cuotas puede aparecer en **dos periodos** distintos (una cuota por mes).
- En un periodo solo se listan las cuotas cuya `fecha_corte` cae en ese mes.
- Solicitudes pendientes, rechazadas o no pagadas **no** aparecen.

---

## 5. Estructura del libro

Dos hojas, en este orden:

| # | Nombre hoja | Filas |
|---|-------------|--------|
| 1 | `Resumen por empleado` | 1 fila por empleado + 1 fila `TOTAL` |
| 2 | `Detalle cuotas` | 1 fila por cuota incluida en el periodo |

Librería frontend: `xlsx-js-style`.

### Estilos (mantener iguales)

| Elemento | Color |
|----------|--------|
| Header (fondo) | Verde marca `#166534`, texto blanco |
| Fila TOTAL | Fondo verde claro `#DCFCE7`, texto bold |
| Bordes | `#CBD5E1` thin |
| Montos | Formato Excel `"$"#,##0.00` |
| Documento | Sin resaltado (fondo normal) |

---

## 6. Hoja 1 — Resumen por empleado

### Columnas (orden exacto)

| Col | Header Excel | Campo API | Tipo en celda |
|-----|--------------|-----------|---------------|
| A | Inicio Periodo | `inicio_periodo` | texto `DD/MM/YYYY` |
| B | Fin Periodo | `fin_periodo` | texto `DD/MM/YYYY` |
| C | Número Documento | `numero_documento` | texto |
| D | Nombre | `nombre` | texto (MAYÚSCULAS) |
| E | Apellido | `apellido` | texto (MAYÚSCULAS) |
| F | # Adelantos | `cantidad_adelantos` | número |
| G | Total Cuotas | `detalle_cuotas` | texto desglose, ej. `1+1+2` |
| H | Total Costo de Servicio | `total_costo_servicio` | moneda |
| I | Total Neto Transferido | `total_neto_transferido` | moneda |
| J | Total Solicitado | `total_solicitado` | moneda |
| K | Total a Descontar Este Mes | `total_a_descontar_mes` | moneda |
| L | Total a Pagar al Proveedor | `total_a_pagar_proveedor` | moneda |

> En Excel, la columna **G “Total Cuotas”** muestra el **desglose** (`detalle_cuotas`), no el entero `total_cuotas`.  
> En la fila **TOTAL**, G sí suma el numérico `totales.total_cuotas`.

Ordenamiento de filas: apellido → nombre → documento.

### Reglas de cálculo (por empleado)

Se agrupa por `numero_documento`. Cada **solicitud pagada** que tenga al menos una cuota en el periodo se cuenta **una sola vez** para montos de solicitud/tarifa/neto.

| Concepto | Cómo se calcula |
|----------|-----------------|
| **# Adelantos** | Cantidad de solicitudes distintas (pagadas) con cuota(s) en el periodo. |
| **Total Cuotas (desglose)** | Por cada adelanto: `numero_cuotas_snapshot`. Se concatena con `+`. Ejemplo: tres adelantos de 1, 1 y 2 cuotas → `1+1+2`. |
| **Total Costo de Servicio** | Suma de `solicitud.tarifa_total` **una vez por adelanto**. `tarifa_total` = tarifa fija × número total de cuotas del adelanto (no solo las del mes). |
| **Total Neto Transferido** | Suma de `solicitud.monto_neto` una vez por adelanto. Equivale a: **monto solicitado − comisión**. Es lo que Cerebiia transfirió al empleado. |
| **Total Solicitado** | Suma de `solicitud.monto` una vez por adelanto. |
| **Total a Descontar Este Mes** | Suma de `cuota.monto` de **todas** las cuotas del empleado con `fecha_corte` en el periodo. |
| **Total a Pagar al Proveedor** | **Igual** a Total a Descontar Este Mes (hoy se paga por cuotas del mes). |

#### Ejemplo numérico

Empleado con 3 adelantos pagados cuyas cuotas caen (parcial o total) en el mes:

| Adelanto | Monto solicitado | Cuotas | Tarifa/cuota | tarifa_total | monto_neto |
|----------|------------------|--------|--------------|--------------|------------|
| A | 100.000 | 1 | 12.000 | 12.000 | 88.000 |
| B | 200.000 | 1 | 12.000 | 12.000 | 188.000 |
| C | 400.000 | 2 | 12.000 | 24.000 | 376.000 |

Si en el mes caen las cuotas correspondientes (ej. montos de cuota que suman el descuento del mes):

| Columna Excel | Valor |
|---------------|-------|
| # Adelantos | 3 |
| Total Cuotas | `1+1+2` |
| Total Costo de Servicio | 48.000 (12+12+24) |
| Total Neto Transferido | 652.000 (88+188+376) |
| Total Solicitado | 700.000 |
| Total a Descontar Este Mes | suma de montos de cuota del mes |
| Total a Pagar al Proveedor | = Total a Descontar Este Mes |

### Fila TOTAL

- Columna A: texto `TOTAL` (resto de identificación vacío).
- Suma: `# Adelantos`, `total_cuotas` (entero), costo, neto, solicitado, descontar, proveedor.
- Estilo fondo verde claro.

Los totales también vienen en `data.totales` del API (preferir esos; el export tiene fallback recalculando desde `resumen`).

---

## 7. Hoja 2 — Detalle cuotas

Una fila por cada cuota incluida en el periodo (misma regla de inclusión).

### Columnas (orden exacto)

| Col | Header Excel | Campo API | Notas |
|-----|--------------|-----------|-------|
| A | Inicio Periodo | `inicio_periodo` | `DD/MM/YYYY` |
| B | Fin Periodo | `fin_periodo` | `DD/MM/YYYY` |
| C | Número Documento | `numero_documento` | |
| D | Nombre | `nombre` | |
| E | Apellido | `apellido` | |
| F | Cuota # | — | Texto: `"{cuota_numero} de {total_cuotas}"` |
| G | Total Cuotas | `total_cuotas` | Número total de cuotas del adelanto |
| H | Fecha Corte | `fecha_corte` | ISO del API; se muestra como texto |
| I | Monto a Descontar Nómina | `monto_a_descontar` | = `cuota.monto` |
| J | Monto Solicitud | `monto_solicitud` | Monto total del adelanto |
| K | Costo Servicio Cuota | `tarifa_cuota` | Tarifa asignada a esa cuota |
| L | Estado Cuota | `estado_cuota` | ej. `pendiente`, `pagada`, etc. |

No hay fila TOTAL en esta hoja.

Orden API: nombre empleado → solicitud → número de cuota.

---

## 8. Contrato JSON (respuesta API)

Campos de alto nivel:

```ts
{
  empresa_id: string;
  empresa_nombre: string;
  empresa_nit: string;
  periodo: string;           // "YYYY-MM"
  inicio_periodo: string;    // "DD/MM/YYYY"
  fin_periodo: string;       // "DD/MM/YYYY"
  detalle: ReferenciaNominaDetalleApi[];
  resumen: ReferenciaNominaResumenApi[];
  total_a_descontar: string; // = totales.total_a_descontar_mes
  totales: {
    cantidad_adelantos: number;
    total_cuotas: number;
    total_costo_servicio: string;
    total_neto_transferido: string;
    total_solicitado: string;
    total_a_descontar_mes: string;
    total_a_pagar_proveedor: string;
  };
}
```

Tipos TypeScript: `src/lib/api/types.ts` (`ReferenciaNominaApi` y relacionados).

---

## 9. Cómo replicarlo en el panel empresa (checklist)

1. **Backend**
   - Endpoint empresa con el mismo use case `ObtenerReferenciaNominaUseCase`.
   - Autorización: solo la empresa del usuario autenticado.
   - Query: solo `periodo=YYYY-MM`.

2. **Frontend empresa**
   - Llamar al endpoint y pasar el JSON a `exportReferenciaNominaExcel(data)`.
   - Ideal: compartir el módulo (paquete interno o copiar el archivo manteniendo paridad).
   - No reinventar columnas ni fórmulas en el panel empresa.

3. **UX sugerida**
   - Selector de periodo (mes/año).
   - Botón “Descargar Excel nómina” / “Referencia para descuentos”.
   - Mismo nombre de archivo.

4. **Validación de paridad**
   - Mismo `empresa_id` + `periodo` → Excel admin y Excel empresa deben coincidir fila a fila.

---

## 10. Archivos de referencia en este repo

| Pieza | Ubicación |
|-------|-----------|
| Generador Excel | `src/lib/export-referencia-nomina-excel.ts` |
| Tipos API | `src/lib/api/types.ts` → `ReferenciaNomina*` |
| Cliente API admin | `src/lib/api/admin.ts` → `getReferenciaNomina` |
| UI descarga (admin) | `src/routes/admin.control-pagos.tsx` |

### Backend (repo Adelantos)

| Pieza | Ubicación |
|-------|-----------|
| Use case | `obtener_referencia_nomina.py` |
| Query cuotas | `django_cuota_repository.find_descuentos_nomina_periodo` |
| Endpoint admin | `GET /admin/referencia-nomina/` |
| Serializers | `ReferenciaNomina*Serializer` en `admin_serializers.py` |

---

## 11. Resumen de negocio (para producto / nómina)

| Pregunta de negocio | Columna / hoja |
|---------------------|----------------|
| ¿Cuánto le descuento al empleado este mes? | **Total a Descontar Este Mes** (resumen) o sumar **Monto a Descontar Nómina** (detalle) |
| ¿Cuánto le giró Cerebiia al empleado? | **Total Neto Transferido** |
| ¿Cuánto fue la comisión Cerebiia? | **Total Costo de Servicio** |
| ¿Cuánto pidió en total (bruto)? | **Total Solicitado** |
| ¿Cómo se repartieron las cuotas por adelanto? | **Total Cuotas** = `1+1+2` |
| ¿Detalle para conciliar? | Hoja **Detalle cuotas** |

Fórmula clave:

```
Total Neto Transferido = Total Solicitado − Total Costo de Servicio
```

(por construcción, vía `monto_neto` de cada solicitud).
